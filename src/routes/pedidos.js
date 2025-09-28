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

// Schema de validação para pedidos
const pedidoSchema = {
  cliente_nome: { required: true, type: 'string', maxLength: 100 },
  cliente_telefone: { required: true, type: 'string', maxLength: 20 },
  cliente_endereco: { type: 'string', maxLength: 500 },
  tipo_entrega: { required: true, type: 'enum', values: ['balcao', 'entrega'] },
  forma_pagamento: { required: true, type: 'enum', values: ['dinheiro', 'cartao', 'pix'] },
  observacoes: { type: 'string', maxLength: 1000 },
  itens: { 
    required: true, 
    type: 'array', 
    minItems: 1,
    items: {
      produto_id: { required: true, type: 'string' },
      quantidade: { required: true, type: 'number', min: 1 },
      preco_unitario: { required: true, type: 'number', min: 0 },
      observacoes: { type: 'string', maxLength: 200 },
      sabores: {
        type: 'array',
        items: {
          sabor_id: { required: true, type: 'string' },
          preco_adicional: { type: 'number', min: 0, default: 0 }
        }
      }
    }
  }
};

// Listar pedidos com otimizações para mobile
router.get('/api/v1/pedidos', optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status');
    const tipo_entrega = url.searchParams.get('tipo_entrega');
    const forma_pagamento = url.searchParams.get('forma_pagamento');
    const data_inicio = url.searchParams.get('data_inicio');
    const data_fim = url.searchParams.get('data_fim');
    const search = url.searchParams.get('search');
    const deviceType = request.headers.get('X-Device-Type') || 'desktop';
    
    // Otimizar limite baseado no dispositivo
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    
    // Construir query com filtros
    let query = `
      SELECT p.*, 
             COUNT(pi.id) as total_itens,
             SUM(pi.quantidade * pi.preco_unitario) as valor_itens
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    if (tipo_entrega) {
      query += ' AND p.tipo_entrega = ?';
      params.push(tipo_entrega);
    }
    
    if (forma_pagamento) {
      query += ' AND p.forma_pagamento = ?';
      params.push(forma_pagamento);
    }
    
    if (data_inicio) {
      query += ' AND DATE(p.created_at) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND DATE(p.created_at) <= ?';
      params.push(data_fim);
    }
    
    if (search) {
      query += ' AND (p.cliente_nome LIKE ? OR p.cliente_telefone LIKE ? OR p.id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Adicionar GROUP BY, ordenação e paginação
    query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(optimizedLimit, offset);
    
    // Executar query principal
    const { results: pedidos } = await env.DB.prepare(query).bind(...params).all();
    
    // Query para contar total
    let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM pedidos p WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }
    
    if (tipo_entrega) {
      countQuery += ' AND p.tipo_entrega = ?';
      countParams.push(tipo_entrega);
    }
    
    if (forma_pagamento) {
      countQuery += ' AND p.forma_pagamento = ?';
      countParams.push(forma_pagamento);
    }
    
    if (data_inicio) {
      countQuery += ' AND DATE(p.created_at) >= ?';
      countParams.push(data_inicio);
    }
    
    if (data_fim) {
      countQuery += ' AND DATE(p.created_at) <= ?';
      countParams.push(data_fim);
    }
    
    if (search) {
      countQuery += ' AND (p.cliente_nome LIKE ? OR p.cliente_telefone LIKE ? OR p.id LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const { results: [{ total }] } = await env.DB.prepare(countQuery).bind(...countParams).all();
    
    // Criar paginação otimizada para mobile
    const pagination = createMobilePagination(page, optimizedLimit, total, deviceType);
    
    // Adaptar response para o dispositivo
    const adaptedPedidos = adaptResponseForDevice(pedidos, deviceType, {
      removeFields: deviceType === 'mobile' ? ['updated_at'] : [],
      optimizeNumbers: true
    });
    
    const response = {
      success: true,
      data: adaptedPedidos,
      pagination,
      filters: {
        status,
        tipo_entrega,
        forma_pagamento,
        data_inicio,
        data_fim,
        search
      },
      meta: {
        total,
        device_optimized: true,
        cache_strategy: deviceType === 'mobile' ? 'moderate' : 'light'
      }
    };
    
    // Comprimir response se necessário
    const finalResponse = await compressResponse(response, request);
    
    return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': deviceType === 'mobile' ? 'public, max-age=300' : 'public, max-age=120',
        'X-Device-Optimized': 'true'
      }
    }));
    
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
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

// Buscar pedido por ID com detalhes completos
router.get('/api/v1/pedidos/:id', 
  validateUrlParams({ id: { required: true, type: 'string' } }),
  optionalAuth,
  withCache(180), // Cache por 3 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      const deviceType = request.headers.get('X-Device-Type') || 'desktop';
      
      // Buscar pedido
      const { results: pedidoResults } = await env.DB.prepare(
        'SELECT * FROM pedidos WHERE id = ?'
      ).bind(id).all();
      
      if (pedidoResults.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Pedido não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const pedido = pedidoResults[0];
      
      // Buscar itens do pedido com produtos
      const { results: itens } = await env.DB.prepare(`
        SELECT 
          pi.*,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.imagem as produto_imagem
        FROM pedido_itens pi
        JOIN produtos p ON pi.produto_id = p.id
        WHERE pi.pedido_id = ?
        ORDER BY pi.created_at ASC
      `).bind(id).all();
      
      // Buscar sabores de cada item
      for (let item of itens) {
        const { results: sabores } = await env.DB.prepare(`
          SELECT 
            isab.*,
            s.nome as sabor_nome,
            s.categoria as sabor_categoria
          FROM item_sabores isab
          JOIN sabores s ON isab.sabor_id = s.id
          WHERE isab.item_id = ?
          ORDER BY s.nome ASC
        `).bind(item.id).all();
        
        item.sabores = sabores;
      }
      
      pedido.itens = itens;
      
      // Adaptar response para o dispositivo
      const adaptedPedido = adaptResponseForDevice(pedido, deviceType, {
        removeFields: deviceType === 'mobile' ? ['updated_at'] : [],
        optimizeNumbers: true
      });
      
      const response = {
        success: true,
        data: adaptedPedido,
        meta: {
          device_optimized: true,
          cached: true,
          total_itens: itens.length
        }
      };
      
      const finalResponse = await compressResponse(response, request);
      
      return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=180',
          'X-Device-Optimized': 'true'
        }
      }));
      
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
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

// Criar novo pedido
router.post('/api/v1/pedidos',
  authenticateRequest,
  validateRequest(pedidoSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = new Date().toISOString();
      
      // Calcular total do pedido
      let total_pedido = 0;
      for (const item of data.itens) {
        let total_item = item.quantidade * item.preco_unitario;
        
        // Adicionar preço dos sabores
        if (item.sabores) {
          for (const sabor of item.sabores) {
            total_item += sabor.preco_adicional || 0;
          }
        }
        
        total_pedido += total_item;
      }
      
      // Criar pedido
      const { results: pedidoResults } = await env.DB.prepare(`
        INSERT INTO pedidos (
          cliente_nome, cliente_telefone, cliente_endereco,
          tipo_entrega, forma_pagamento, observacoes,
          total, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.cliente_nome,
        data.cliente_telefone,
        data.cliente_endereco || null,
        data.tipo_entrega,
        data.forma_pagamento,
        data.observacoes || null,
        total_pedido,
        'pendente',
        now,
        now
      ).all();
      
      const novoPedido = pedidoResults[0];
      
      // Criar itens do pedido
      const itensCompletos = [];
      for (const item of data.itens) {
        const { results: itemResults } = await env.DB.prepare(`
          INSERT INTO pedido_itens (
            pedido_id, produto_id, quantidade, preco_unitario, observacoes, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `).bind(
          novoPedido.id,
          item.produto_id,
          item.quantidade,
          item.preco_unitario,
          item.observacoes || null,
          now
        ).all();
        
        const novoItem = itemResults[0];
        
        // Adicionar sabores do item
        if (item.sabores && item.sabores.length > 0) {
          const saboresCompletos = [];
          for (const sabor of item.sabores) {
            await env.DB.prepare(`
              INSERT INTO item_sabores (item_id, sabor_id, preco_adicional, created_at)
              VALUES (?, ?, ?, ?)
            `).bind(
              novoItem.id,
              sabor.sabor_id,
              sabor.preco_adicional || 0,
              now
            ).run();
            
            saboresCompletos.push({
              sabor_id: sabor.sabor_id,
              preco_adicional: sabor.preco_adicional || 0
            });
          }
          novoItem.sabores = saboresCompletos;
        }
        
        itensCompletos.push(novoItem);
      }
      
      novoPedido.itens = itensCompletos;
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'pedidos:*');
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'pedidos',
        novoPedido.id,
        'create',
        JSON.stringify(novoPedido),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoPedido,
        message: 'Pedido criado com sucesso'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
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

// Atualizar status do pedido
router.put('/api/v1/pedidos/:id/status',
  validateUrlParams({ id: { required: true, type: 'string' } }),
  authenticateRequest,
  validateRequest({
    status: { 
      required: true, 
      type: 'enum', 
      values: ['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'] 
    }
  }),
  async (request, env) => {
    try {
      const { id } = request.params;
      const { status } = request.validatedData;
      const now = new Date().toISOString();
      
      // Verificar se o pedido existe
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM pedidos WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Pedido não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Atualizar status
      const { results } = await env.DB.prepare(`
        UPDATE pedidos SET status = ?, updated_at = ? WHERE id = ?
        RETURNING *
      `).bind(status, now, id).all();
      
      const pedidoAtualizado = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'pedidos:*');
      await invalidateCache(env, `pedido:${id}`);
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'pedidos',
        id,
        'update',
        JSON.stringify({ id, status, updated_at: now }),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: pedidoAtualizado,
        message: `Status do pedido atualizado para: ${status}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
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

// Cancelar pedido
router.delete('/api/v1/pedidos/:id',
  validateUrlParams({ id: { required: true, type: 'string' } }),
  authenticateRequest,
  async (request, env) => {
    try {
      const { id } = request.params;
      const now = new Date().toISOString();
      
      // Verificar se o pedido existe e pode ser cancelado
      const { results: existing } = await env.DB.prepare(
        'SELECT * FROM pedidos WHERE id = ?'
      ).bind(id).all();
      
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Pedido não encontrado',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const pedido = existing[0];
      
      if (['entregue', 'cancelado'].includes(pedido.status)) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: 'Pedido não pode ser cancelado',
          code: 'CANNOT_CANCEL',
          current_status: pedido.status
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Cancelar pedido
      const { results } = await env.DB.prepare(`
        UPDATE pedidos SET status = 'cancelado', updated_at = ? WHERE id = ?
        RETURNING *
      `).bind(now, id).all();
      
      const pedidoCancelado = results[0];
      
      // Invalidar cache relacionado
      await invalidateCache(env, 'pedidos:*');
      await invalidateCache(env, `pedido:${id}`);
      
      // Adicionar à fila de sincronização
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'pedidos',
        id,
        'update',
        JSON.stringify({ id, status: 'cancelado', updated_at: now }),
        now
      ).run();
      
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: pedidoCancelado,
        message: 'Pedido cancelado com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
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

// Estatísticas de pedidos
router.get('/api/v1/pedidos/stats', 
  authenticateRequest,
  withCache(300), // Cache por 5 minutos
  async (request, env) => {
    try {
      const url = new URL(request.url);
      const periodo = url.searchParams.get('periodo') || 'hoje'; // hoje, semana, mes, ano
      
      let dataInicio;
      const agora = new Date();
      
      switch (periodo) {
        case 'hoje':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
          break;
        case 'semana':
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
          break;
        case 'ano':
          dataInicio = new Date(agora.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      }
      
      // Estatísticas gerais
      const { results: stats } = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_pedidos,
          SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
          SUM(CASE WHEN status = 'preparando' THEN 1 ELSE 0 END) as preparando,
          SUM(CASE WHEN status = 'pronto' THEN 1 ELSE 0 END) as prontos,
          SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as entregues,
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
          SUM(total) as faturamento_total,
          AVG(total) as ticket_medio
        FROM pedidos 
        WHERE created_at >= ?
      `).bind(dataInicio.toISOString()).all();
      
      // Pedidos por forma de pagamento
      const { results: pagamentos } = await env.DB.prepare(`
        SELECT 
          forma_pagamento,
          COUNT(*) as quantidade,
          SUM(total) as valor_total
        FROM pedidos 
        WHERE created_at >= ?
        GROUP BY forma_pagamento
      `).bind(dataInicio.toISOString()).all();
      
      // Pedidos por tipo de entrega
      const { results: entregas } = await env.DB.prepare(`
        SELECT 
          tipo_entrega,
          COUNT(*) as quantidade,
          SUM(total) as valor_total
        FROM pedidos 
        WHERE created_at >= ?
        GROUP BY tipo_entrega
      `).bind(dataInicio.toISOString()).all();
      
      const response = {
        success: true,
        data: {
          periodo,
          data_inicio: dataInicio.toISOString(),
          resumo: stats[0],
          por_pagamento: pagamentos,
          por_entrega: entregas
        },
        meta: {
          cached: true,
          generated_at: new Date().toISOString()
        }
      };
      
      return addCORSHeaders(new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      }));
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
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