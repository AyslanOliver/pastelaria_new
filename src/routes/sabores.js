import { Router } from 'itty-router';
import { validateRequest, validateUrlParams } from '../middleware/validation.js';
import { authenticateRequest, optionalAuth } from '../middleware/auth.js';
import { withCache, generateCacheKey, invalidateCache } from '../utils/cache.js';
import { addCORSHeaders } from '../utils/cors.js';
import { 
  optimizeForMobile, 
  createMobilePagination, 
  compressResponse,
  adaptResponseForDevice 
} from '../utils/mobile-optimization.js';

const router = Router();

// Schema de validação para sabores
const saborSchema = {
  nome: { required: true, type: 'string', maxLength: 100 },
  precoAdicional: { required: true, type: 'number', min: 0 },
  descricao: { type: 'string', maxLength: 500 },
  ativo: { type: 'boolean', default: true },
  categoria: { type: 'string', maxLength: 50 }
};

// Listar sabores com otimizações para mobile
router.get('/api/v1/sabores', optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const categoria = url.searchParams.get('categoria');
    const ativo = url.searchParams.get('ativo');
    const search = url.searchParams.get('search');
    const deviceType = request.headers.get('X-Device-Type') || 'desktop';
    
    // Otimizar limite baseado no dispositivo
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    
    // Construir query com filtros
    let query = 'SELECT * FROM sabores WHERE 1=1';
    const params = [];
    
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (ativo !== null && ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    if (search) {
      query += ' AND (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Adicionar ordenação e paginação
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(optimizedLimit, offset);
    
    // Executar query principal
    const { results: sabores } = await env.DB.prepare(query).bind(...params).all();
    
    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as total FROM sabores WHERE 1=1';
    const countParams = [];
    
    if (categoria) {
      countQuery += ' AND categoria = ?';
      countParams.push(categoria);
    }
    
    if (ativo !== null && ativo !== undefined) {
      countQuery += ' AND ativo = ?';
      countParams.push(ativo === 'true' ? 1 : 0);
    }
    
    if (search) {
      countQuery += ' AND (nome LIKE ? OR descricao LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const { results: [{ total }] } = await env.DB.prepare(countQuery).bind(...countParams).all();
    
    // Criar paginação otimizada para mobile
    const pagination = createMobilePagination(page, optimizedLimit, total, deviceType);
    
    // Adaptar response para o dispositivo
    const adaptedSabores = adaptResponseForDevice(sabores, deviceType, {
      removeFields: deviceType === 'mobile' ? ['created_at', 'updated_at'] : [],
      optimizeNumbers: true
    });
    
    const response = {
      success: true,
      data: adaptedSabores,
      pagination,
      filters: {
        categoria,
        ativo: ativo ? (ativo === 'true') : null,
        search
      },
      meta: {
        total,
        device_optimized: true,
        cache_strategy: deviceType === 'mobile' ? 'aggressive' : 'moderate'
      }
    };
    
    // Comprimir response se necessário
    const finalResponse = await compressResponse(response, request);
    
    return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': deviceType === 'mobile' ? 'public, max-age=1800' : 'public, max-age=600',
        'X-Device-Optimized': 'true'
      }
    }));
    
  } catch (error) {
    console.error('Erro ao listar sabores:', error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
});

// Buscar sabor por ID
router.get('/api/v1/sabores/:id', 
  optionalAuth,
  withCache(300), // Cache por 5 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({
          error: 'ID inválido',
          code: 'INVALID_ID'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      const deviceType = request.headers.get('X-Device-Type') || 'desktop';
      
      const { results } = await env.DB.prepare(
        'SELECT * FROM sabores WHERE id = ?'
      ).bind(id).all();
      
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Sabor não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const sabor = results[0];
      
      // Adaptar response para o dispositivo
      const adaptedSabor = adaptResponseForDevice(sabor, deviceType, {
        removeFields: deviceType === 'mobile' ? ['created_at', 'updated_at'] : [],
        optimizeNumbers: true
      });
      
      const response = {
        success: true,
        data: adaptedSabor,
        meta: {
          device_optimized: true,
          cached: true
        }
      };
      
      const finalResponse = await compressResponse(response, request);
      
      return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'X-Device-Optimized': 'true'
        }
      }));
      
    } catch (error) {
      console.error('Erro ao buscar sabor:', error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
);

// Criar novo sabor
router.post('/api/v1/sabores',
  authenticateRequest,
  validateRequest(saborSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = new Date().toISOString();
      
      const { results } = await env.DB.prepare(`
        INSERT INTO sabores (nome, preco_adicional, descricao, ativo, categoria, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.nome,
        data.precoAdicional,
        data.descricao || null,
        data.ativo !== false ? 1 : 0,
        data.categoria || null,
        now,
        now
      ).all();
      
      const novoSabor = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'sabores:*');
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'sabores',
        novoSabor.id,
        'create',
        JSON.stringify(novoSabor),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoSabor,
        message: 'Sabor criado com sucesso'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao criar sabor:', error);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Já existe um sabor com este nome',
          code: 'DUPLICATE_NAME'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
);

// Atualizar sabor
router.put('/api/v1/sabores/:id',
  authenticateRequest,
  validateRequest(saborSchema, false), // Validação parcial para updates
  async (request, env) => {
    try {
      const { id } = request.params;
      
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({
          error: 'ID inválido',
          code: 'INVALID_ID'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const data = request.validatedData;
      const now = new Date().toISOString();
      
      // Verificar se o sabor existe
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM sabores WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Sabor não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Construir query de update dinamicamente
      const updateFields = [];
      const updateValues = [];
      
      if (data.nome !== undefined) {
        updateFields.push('nome = ?');
        updateValues.push(data.nome);
      }
      
      if (data.precoAdicional !== undefined) {
        updateFields.push('preco_adicional = ?');
        updateValues.push(data.precoAdicional);
      }
      
      if (data.descricao !== undefined) {
        updateFields.push('descricao = ?');
        updateValues.push(data.descricao);
      }
      
      if (data.ativo !== undefined) {
        updateFields.push('ativo = ?');
        updateValues.push(data.ativo ? 1 : 0);
      }
      
      if (data.categoria !== undefined) {
        updateFields.push('categoria = ?');
        updateValues.push(data.categoria);
      }
      
      updateFields.push('updated_at = ?');
      updateValues.push(now);
      updateValues.push(id);
      
      const { results } = await env.DB.prepare(`
        UPDATE sabores SET ${updateFields.join(', ')} WHERE id = ?
        RETURNING *
      `).bind(...updateValues).all();
      
      const saborAtualizado = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'sabores:*');
      await invalidateCache(env, `sabor:${id}`);
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'sabores',
        id,
        'update',
        JSON.stringify(saborAtualizado),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: saborAtualizado,
        message: 'Sabor atualizado com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar sabor:', error);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Já existe um sabor com este nome',
          code: 'DUPLICATE_NAME'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
);

// Remover sabor (soft delete)
router.delete('/api/v1/sabores/:id',
  authenticateRequest,
  async (request, env) => {
    try {
      const { id } = request.params;
      
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({
          error: 'ID inválido',
          code: 'INVALID_ID'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      const now = new Date().toISOString();
      
      // Verificar se o sabor existe
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM sabores WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Sabor não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Verificar se o sabor está sendo usado em pedidos
      const { results: pedidosUsando } = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM item_sabores 
        WHERE sabor_id = ?
      `).bind(id).all();
      
      if (pedidosUsando[0].count > 0) {
        // Soft delete - apenas desativar
        await env.DB.prepare(`
          UPDATE sabores SET ativo = 0, updated_at = ? WHERE id = ?
        `).bind(now, id).run();
        
        return addCORSHeaders(new Response(JSON.stringify({
          success: true,
          message: 'Sabor desativado com sucesso (estava sendo usado em pedidos)',
          action: 'deactivated'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      } else {
        // Hard delete - remover completamente
        await env.DB.prepare('DELETE FROM sabores WHERE id = ?').bind(id).run();
        
        // Invalidar cache relacionado
        await invalidateCache(env, 'sabores:*');
        await invalidateCache(env, `sabor:${id}`);
        
        // Adicionar à fila de sincronização
        await env.DB.prepare(`
          INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          'sabores',
          id,
          'delete',
          JSON.stringify({ id }),
          now
        ).run();
        
        return addCORSHeaders(new Response(JSON.stringify({
          success: true,
          message: 'Sabor removido com sucesso',
          action: 'deleted'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
    } catch (error) {
      console.error('Erro ao remover sabor:', error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
);

// Listar categorias de sabores
router.get('/api/v1/sabores/categorias', 
  optionalAuth,
  withCache(1800), // Cache por 30 minutos
  async (request, env) => {
    try {
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT categoria 
        FROM sabores 
        WHERE categoria IS NOT NULL AND categoria != '' AND ativo = 1
        ORDER BY categoria ASC
      `).all();
      
      const categorias = results.map(row => row.categoria);
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: categorias,
        meta: {
          total: categorias.length,
          cached: true
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800'
        }
      }));
      
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
);

export default router;