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

// Schema de validação para tamanhos
const tamanhoSchema = {
  nome: { required: true, type: 'string', maxLength: 50 },
  multiplicador: { required: true, type: 'number', min: 0.1, max: 10 },
  descricao: { type: 'string', maxLength: 200 },
  ativo: { type: 'boolean', default: true },
  ordem: { type: 'number', min: 0, default: 0 }
};

// Listar tamanhos com otimizações para mobile
router.get('/api/v1/tamanhos', optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const ativo = url.searchParams.get('ativo');
    const search = url.searchParams.get('search');
    const deviceType = request.headers.get('X-Device-Type') || 'desktop';
    
    // Otimizar limite baseado no dispositivo
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    
    // Construir query com filtros
    let query = 'SELECT * FROM tamanhos WHERE 1=1';
    const params = [];
    
    if (ativo !== null && ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    if (search) {
      query += ' AND (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Adicionar ordenação e paginação
    query += ' ORDER BY ordem ASC, nome ASC LIMIT ? OFFSET ?';
    params.push(optimizedLimit, offset);
    
    // Executar query principal
    const { results: tamanhos } = await env.DB.prepare(query).bind(...params).all();
    
    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as total FROM tamanhos WHERE 1=1';
    const countParams = [];
    
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
    const adaptedTamanhos = adaptResponseForDevice(tamanhos, deviceType, {
      removeFields: deviceType === 'mobile' ? ['created_at', 'updated_at'] : [],
      optimizeNumbers: true
    });
    
    const response = {
      success: true,
      data: adaptedTamanhos,
      pagination,
      filters: {
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
    console.error('Erro ao listar tamanhos:', error);
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

// Buscar tamanho por ID
router.get('/api/v1/tamanhos/:id', 
  validateUrlParams({ id: { required: true, type: 'string' } }),
  optionalAuth,
  withCache(300), // Cache por 5 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      const deviceType = request.headers.get('X-Device-Type') || 'desktop';
      
      const { results } = await env.DB.prepare(
        'SELECT * FROM tamanhos WHERE id = ?'
      ).bind(id).all();
      
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Tamanho não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const tamanho = results[0];
      
      // Adaptar response para o dispositivo
      const adaptedTamanho = adaptResponseForDevice(tamanho, deviceType, {
        removeFields: deviceType === 'mobile' ? ['created_at', 'updated_at'] : [],
        optimizeNumbers: true
      });
      
      const response = {
        success: true,
        data: adaptedTamanho,
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
      console.error('Erro ao buscar tamanho:', error);
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

// Criar novo tamanho
router.post('/api/v1/tamanhos',
  authenticateRequest,
  validateRequest(tamanhoSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = new Date().toISOString();
      
      const { results } = await env.DB.prepare(`
        INSERT INTO tamanhos (nome, multiplicador, descricao, ativo, ordem, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.nome,
        data.multiplicador,
        data.descricao || null,
        data.ativo !== false ? 1 : 0,
        data.ordem || 0,
        now,
        now
      ).all();
      
      const novoTamanho = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'tamanhos:*');
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'tamanhos',
        novoTamanho.id,
        'create',
        JSON.stringify(novoTamanho),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoTamanho,
        message: 'Tamanho criado com sucesso'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao criar tamanho:', error);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Já existe um tamanho com este nome',
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

// Atualizar tamanho
router.put('/api/v1/tamanhos/:id',
  validateUrlParams({ id: { required: true, type: 'string' } }),
  authenticateRequest,
  validateRequest(tamanhoSchema, false), // Validação parcial para updates
  async (request, env) => {
    try {
      const { id } = request.params;
      const data = request.validatedData;
      const now = new Date().toISOString();
      
      // Verificar se o tamanho existe
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM tamanhos WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Tamanho não encontrado',
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
      
      if (data.multiplicador !== undefined) {
        updateFields.push('multiplicador = ?');
        updateValues.push(data.multiplicador);
      }
      
      if (data.descricao !== undefined) {
        updateFields.push('descricao = ?');
        updateValues.push(data.descricao);
      }
      
      if (data.ativo !== undefined) {
        updateFields.push('ativo = ?');
        updateValues.push(data.ativo ? 1 : 0);
      }
      
      if (data.ordem !== undefined) {
        updateFields.push('ordem = ?');
        updateValues.push(data.ordem);
      }
      
      updateFields.push('updated_at = ?');
      updateValues.push(now);
      updateValues.push(id);
      
      const { results } = await env.DB.prepare(`
        UPDATE tamanhos SET ${updateFields.join(', ')} WHERE id = ?
        RETURNING *
      `).bind(...updateValues).all();
      
      const tamanhoAtualizado = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'tamanhos:*');
      await invalidateCache(env, `tamanho:${id}`);
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'tamanhos',
        id,
        'update',
        JSON.stringify(tamanhoAtualizado),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: tamanhoAtualizado,
        message: 'Tamanho atualizado com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar tamanho:', error);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Já existe um tamanho com este nome',
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

// Remover tamanho (soft delete)
router.delete('/api/v1/tamanhos/:id',
  validateUrlParams({ id: { required: true, type: 'string' } }),
  authenticateRequest,
  async (request, env) => {
    try {
      const { id } = request.params;
      const now = new Date().toISOString();
      
      // Verificar se o tamanho existe
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM tamanhos WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Tamanho não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Verificar se o tamanho está sendo usado em pedidos
      const { results: pedidosUsando } = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM pedido_itens 
        WHERE produto_id IN (
          SELECT id FROM produtos WHERE 1=1
        )
      `).bind().all();
      
      // Para simplificar, vamos sempre fazer soft delete para tamanhos
      // pois eles podem estar referenciados em produtos ou pedidos
      await env.DB.prepare(`
        UPDATE tamanhos SET ativo = 0, updated_at = ? WHERE id = ?
      `).bind(now, id).run();
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'tamanhos:*');
      await invalidateCache(env, `tamanho:${id}`);
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'tamanhos',
        id,
        'update',
        JSON.stringify({ id, ativo: false }),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        message: 'Tamanho desativado com sucesso',
        action: 'deactivated'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao remover tamanho:', error);
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

// Reordenar tamanhos
router.post('/api/v1/tamanhos/reorder',
  authenticateRequest,
  validateRequest({
    tamanhos: { 
      required: true, 
      type: 'array',
      items: {
        id: { required: true, type: 'string' },
        ordem: { required: true, type: 'number', min: 0 }
      }
    }
  }),
  async (request, env) => {
    try {
      const { tamanhos } = request.validatedData;
      const now = new Date().toISOString();
      
      // Atualizar ordem de cada tamanho
      for (const tamanho of tamanhos) {
        await env.DB.prepare(`
          UPDATE tamanhos SET ordem = ?, updated_at = ? WHERE id = ?
        `).bind(tamanho.ordem, now, tamanho.id).run();
      }
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'tamanhos:*');
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'tamanhos',
        'bulk_reorder',
        'update',
        JSON.stringify({ tamanhos }),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        message: 'Ordem dos tamanhos atualizada com sucesso',
        data: { updated_count: tamanhos.length }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao reordenar tamanhos:', error);
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

// Calcular preço com multiplicador
router.post('/api/v1/tamanhos/calcular-preco',
  optionalAuth,
  validateRequest({
    preco_base: { required: true, type: 'number', min: 0 },
    tamanho_id: { required: true, type: 'string' }
  }),
  async (request, env) => {
    try {
      const { preco_base, tamanho_id } = request.validatedData;
      
      const { results } = await env.DB.prepare(
        'SELECT multiplicador FROM tamanhos WHERE id = ? AND ativo = 1'
      ).bind(tamanho_id).all();
      
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Tamanho não encontrado ou inativo',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const { multiplicador } = results[0];
      const preco_final = preco_base * multiplicador;
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: {
          preco_base,
          multiplicador,
          preco_final: Math.round(preco_final * 100) / 100, // Arredondar para 2 casas decimais
          economia: preco_base - preco_final
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
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