// Sistema de sincronização offline para dispositivos móveis

import { Router } from 'itty-router';
import { corsHeaders } from '../utils/cors';
import { optionalAuth } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';

const router = Router();

/**
 * Endpoint para sincronização de dados offline
 * Permite que dispositivos móveis enviem dados coletados offline
 */
router.post('/api/v1/sync/upload', optionalAuth, async (request, env) => {
  try {
    const { operations } = await request.json();
    
    if (!Array.isArray(operations)) {
      return new Response(JSON.stringify({
        error: 'Operations deve ser um array',
        code: 'INVALID_OPERATIONS'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const results = [];
    const errors = [];
    
    // Processar operações em lote
    for (const operation of operations) {
      try {
        const result = await processOperation(env.DB, operation);
        results.push({
          id: operation.id,
          status: 'success',
          result
        });
      } catch (error) {
        errors.push({
          id: operation.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro na sincronização',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

/**
 * Endpoint para download de dados atualizados
 * Permite que dispositivos móveis baixem dados mais recentes
 */
router.get('/api/v1/sync/download', optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const lastSync = url.searchParams.get('last_sync');
    const tables = url.searchParams.get('tables')?.split(',') || ['produtos', 'sabores', 'tamanhos'];
    
    const syncData = {};
    const currentTimestamp = new Date().toISOString();
    
    // Buscar dados atualizados desde a última sincronização
    for (const table of tables) {
      let query = `SELECT * FROM ${table}`;
      let params = [];
      
      if (lastSync) {
        query += ` WHERE updated_at > ?`;
        params.push(lastSync);
      }
      
      query += ` ORDER BY updated_at DESC LIMIT 1000`; // Limite para mobile
      
      const stmt = env.DB.prepare(query);
      if (params.length > 0) {
        stmt.bind(...params);
      }
      
      const results = await stmt.all();
      syncData[table] = results.results || [];
    }
    
    // Buscar dados deletados (se houver tabela de log de deleções)
    const deletedData = {};
    // Implementar lógica de soft delete se necessário
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: currentTimestamp,
      data: syncData,
      deleted: deletedData,
      has_more: false // Implementar paginação se necessário
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro no download de sincronização',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

/**
 * Endpoint para verificar status de sincronização
 */
router.get('/api/v1/sync/status', async (request, env) => {
  try {
    const stats = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as total FROM produtos WHERE ativo = 1').first(),
      env.DB.prepare('SELECT COUNT(*) as total FROM sabores WHERE ativo = 1').first(),
      env.DB.prepare('SELECT COUNT(*) as total FROM tamanhos WHERE ativo = 1').first(),
      env.DB.prepare('SELECT COUNT(*) as total FROM pedidos WHERE DATE(created_at) = DATE("now")').first(),
      env.DB.prepare('SELECT MAX(updated_at) as last_update FROM produtos').first()
    ]);
    
    return new Response(JSON.stringify({
      success: true,
      stats: {
        produtos_ativos: stats[0].total,
        sabores_ativos: stats[1].total,
        tamanhos_ativos: stats[2].total,
        pedidos_hoje: stats[3].total,
        last_update: stats[4].last_update
      },
      server_time: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60', // Cache por 1 minuto
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao verificar status',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

/**
 * Endpoint para resolver conflitos de sincronização
 */
router.post('/api/v1/sync/resolve-conflict', optionalAuth, async (request, env) => {
  try {
    const { table, id, resolution, data } = await request.json();
    
    // Validar parâmetros
    if (!table || !id || !resolution) {
      return new Response(JSON.stringify({
        error: 'Parâmetros obrigatórios: table, id, resolution',
        code: 'MISSING_PARAMS'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    let result;
    
    switch (resolution) {
      case 'server_wins':
        // Manter dados do servidor, retornar dados atuais
        result = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`)
          .bind(id).first();
        break;
        
      case 'client_wins':
        // Usar dados do cliente
        result = await updateRecord(env.DB, table, id, data);
        break;
        
      case 'merge':
        // Implementar lógica de merge específica por tabela
        result = await mergeRecord(env.DB, table, id, data);
        break;
        
      default:
        throw new Error('Resolução de conflito inválida');
    }
    
    return new Response(JSON.stringify({
      success: true,
      resolution,
      data: result
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro na resolução de conflito',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

/**
 * Processa uma operação de sincronização
 */
async function processOperation(db, operation) {
  const { type, table, data, id } = operation;
  
  switch (type) {
    case 'CREATE':
      return await createRecord(db, table, data);
      
    case 'UPDATE':
      return await updateRecord(db, table, id, data);
      
    case 'DELETE':
      return await deleteRecord(db, table, id);
      
    default:
      throw new Error(`Tipo de operação inválido: ${type}`);
  }
}

/**
 * Cria um novo registro
 */
async function createRecord(db, table, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map(() => '?').join(', ');
  
  const query = `
    INSERT INTO ${table} (${fields.join(', ')})
    VALUES (${placeholders})
  `;
  
  const result = await db.prepare(query).bind(...values).run();
  
  if (result.success) {
    // Retornar o registro criado
    return await db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
      .bind(result.meta.last_row_id).first();
  }
  
  throw new Error('Falha ao criar registro');
}

/**
 * Atualiza um registro existente
 */
async function updateRecord(db, table, id, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  const query = `
    UPDATE ${table} 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const result = await db.prepare(query).bind(...values, id).run();
  
  if (result.success && result.changes > 0) {
    // Retornar o registro atualizado
    return await db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
      .bind(id).first();
  }
  
  throw new Error('Registro não encontrado ou não atualizado');
}

/**
 * Remove um registro
 */
async function deleteRecord(db, table, id) {
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?`)
    .bind(id).run();
  
  if (result.success && result.changes > 0) {
    return { deleted: true, id };
  }
  
  throw new Error('Registro não encontrado ou não removido');
}

/**
 * Faz merge de dados (implementação básica)
 */
async function mergeRecord(db, table, id, clientData) {
  // Buscar dados atuais do servidor
  const serverData = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
    .bind(id).first();
  
  if (!serverData) {
    throw new Error('Registro não encontrado no servidor');
  }
  
  // Merge simples: priorizar dados mais recentes
  const merged = { ...serverData };
  
  for (const [key, value] of Object.entries(clientData)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      merged[key] = value;
    }
  }
  
  // Atualizar com dados merged
  return await updateRecord(db, table, id, merged);
}

export default router;