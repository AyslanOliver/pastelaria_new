// API de Pedidos - Cloudflare Workers com D1

import { Router } from 'itty-router';
import { corsHeaders } from '../utils/cors.js';

const router = Router();

// Schema de validação para pedidos
const pedidoSchema = {
  cliente_nome: [
    (v, f) => v === undefined || v === null || v === '' ? `Campo '${f}' é obrigatório` : null,
    (v, f) => typeof v !== 'string' ? `Campo '${f}' deve ser uma string` : null,
    (v, f) => v.length < 2 ? `Campo '${f}' deve ter pelo menos 2 caracteres` : null,
    (v, f) => v.length > 100 ? `Campo '${f}' deve ter no máximo 100 caracteres` : null
  ],
  cliente_telefone: [
    (v, f) => v === undefined || v === null || v === '' ? `Campo '${f}' é obrigatório` : null,
    (v, f) => typeof v !== 'string' ? `Campo '${f}' deve ser uma string` : null,
    (v, f) => !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(v) ? `Campo '${f}' deve estar no formato (XX) XXXXX-XXXX` : null
  ],
  cliente_endereco: [
    (v, f) => v && typeof v !== 'string' ? `Campo '${f}' deve ser uma string` : null,
    (v, f) => v && v.length > 500 ? `Campo '${f}' deve ter no máximo 500 caracteres` : null
  ],
  tipo_entrega: [
    (v, f) => v === undefined || v === null || v === '' ? `Campo '${f}' é obrigatório` : null,
    (v, f) => !['Balcão', 'Entrega'].includes(v) ? `Campo '${f}' deve ser 'Balcão' ou 'Entrega'` : null
  ],
  forma_pagamento: [
    (v, f) => v === undefined || v === null || v === '' ? `Campo '${f}' é obrigatório` : null,
    (v, f) => !['Dinheiro', 'Cartão', 'PIX', 'Débito', 'Crédito'].includes(v) ? `Campo '${f}' deve ser 'Dinheiro', 'Cartão', 'PIX', 'Débito' ou 'Crédito'` : null
  ],
  observacoes: [
    (v, f) => v && typeof v !== 'string' ? `Campo '${f}' deve ser uma string` : null,
    (v, f) => v && v.length > 1000 ? `Campo '${f}' deve ter no máximo 1000 caracteres` : null
  ],
  itens: [
    (v, f) => v === undefined || v === null ? `Campo '${f}' é obrigatório` : null,
    (v, f) => !Array.isArray(v) ? `Campo '${f}' deve ser uma lista` : null,
    (v, f) => v && v.length < 1 ? `Campo '${f}' deve ter pelo menos 1 item` : null
  ]
};

// Listar pedidos
router.get('/api/v1/pedidos', async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const data_inicio = url.searchParams.get('data_inicio');
    const data_fim = url.searchParams.get('data_fim');

    // Construir query base
    let query = `
      SELECT 
        p.id,
        p.numero,
        p.cliente_nome,
        p.cliente_telefone,
        p.cliente_endereco,
        p.subtotal,
        p.taxa_entrega,
        p.total,
        p.forma_pagamento,
        p.tipo_entrega,
        p.status,
        p.observacoes,
        p.data_entrega,
        p.created_at,
        p.updated_at
      FROM pedidos p
      WHERE 1=1
    `;

    const params = [];

    // Filtros opcionais
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND DATE(p.created_at) >= DATE(?)`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND DATE(p.created_at) <= DATE(?)`;
      params.push(data_fim);
    }

    // Ordenação e paginação
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('Query pedidos:', query);
    console.log('Params:', params);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Query para contar total de registros
    let countQuery = `SELECT COUNT(*) as total FROM pedidos p WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    if (data_inicio) {
      countQuery += ` AND DATE(p.created_at) >= DATE(?)`;
      countParams.push(data_inicio);
    }

    if (data_fim) {
      countQuery += ` AND DATE(p.created_at) <= DATE(?)`;
      countParams.push(data_fim);
    }

    const { results: countResults } = await env.DB.prepare(countQuery).bind(...countParams).all();
    const total = countResults[0]?.total || 0;

    // Para cada pedido, buscar os itens
    const pedidosComItens = await Promise.all(
      results.map(async (pedido) => {
        const itensQuery = `
          SELECT 
            ip.id,
            ip.produto_nome,
            ip.quantidade,
            ip.preco_unitario,
            ip.preco_total,
            ip.observacoes,
            t.nome as tamanho_nome,
            GROUP_CONCAT(s.nome) as sabores
          FROM itens_pedido ip
          LEFT JOIN tamanhos t ON ip.tamanho_id = t.id
          LEFT JOIN item_sabores isa ON ip.id = isa.item_pedido_id
          LEFT JOIN sabores s ON isa.sabor_id = s.id
          WHERE ip.pedido_id = ?
          GROUP BY ip.id
        `;

        const { results: itens } = await env.DB.prepare(itensQuery).bind(pedido.id).all();

        return {
          ...pedido,
          itens: itens.map(item => ({
            ...item,
            sabores: item.sabores ? item.sabores.split(',') : []
          }))
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return new Response(JSON.stringify({
      success: true,
      data: pedidosComItens,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Buscar pedido por ID
router.get('/api/v1/pedidos/:id', async (request, env) => {
  try {
    const { id } = request.params;

    const pedidoQuery = `
      SELECT 
        p.id,
        p.numero,
        p.cliente_nome,
        p.cliente_telefone,
        p.cliente_endereco,
        p.subtotal,
        p.taxa_entrega,
        p.total,
        p.forma_pagamento,
        p.tipo_entrega,
        p.status,
        p.observacoes,
        p.data_entrega,
        p.created_at,
        p.updated_at
      FROM pedidos p
      WHERE p.id = ?
    `;

    const { results } = await env.DB.prepare(pedidoQuery).bind(id).all();

    if (results.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido não encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const pedido = results[0];

    // Buscar itens do pedido
    const itensQuery = `
      SELECT 
        ip.id,
        ip.produto_nome,
        ip.quantidade,
        ip.preco_unitario,
        ip.preco_total,
        ip.observacoes,
        t.nome as tamanho_nome,
        GROUP_CONCAT(s.nome) as sabores
      FROM itens_pedido ip
      LEFT JOIN tamanhos t ON ip.tamanho_id = t.id
      LEFT JOIN item_sabores isa ON ip.id = isa.item_pedido_id
      LEFT JOIN sabores s ON isa.sabor_id = s.id
      WHERE ip.pedido_id = ?
      GROUP BY ip.id
    `;

    const { results: itens } = await env.DB.prepare(itensQuery).bind(id).all();

    const pedidoCompleto = {
      ...pedido,
      itens: itens.map(item => ({
        ...item,
        sabores: item.sabores ? item.sabores.split(',') : []
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      data: pedidoCompleto
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Criar pedido
router.post('/api/v1/pedidos', async (request, env) => {
  try {
    const data = await request.json();
    
    // Gerar número do pedido
    const { results: ultimoPedido } = await env.DB.prepare(
      'SELECT MAX(numero) as ultimo_numero FROM pedidos'
    ).all();
    
    const numeroProximoPedido = (ultimoPedido[0]?.ultimo_numero || 0) + 1;

    // Calcular totais
    let subtotal = 0;
    const itensProcessados = [];

    for (const item of data.itens) {
      // Buscar preço do produto
      const { results: produto } = await env.DB.prepare(
        'SELECT preco FROM produtos WHERE id = ?'
      ).bind(item.produto_id).all();

      if (produto.length === 0) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
      }

      const precoUnitario = produto[0].preco;
      const precoTotal = precoUnitario * item.quantidade;
      subtotal += precoTotal;

      itensProcessados.push({
        ...item,
        preco_unitario: precoUnitario,
        preco_total: precoTotal
      });
    }

    const taxaEntrega = data.tipo_entrega === 'Entrega' ? 5.00 : 0;
    const total = subtotal + taxaEntrega;

    // Inserir pedido
    const insertPedidoQuery = `
      INSERT INTO pedidos (
        numero, cliente_nome, cliente_telefone, cliente_endereco,
        subtotal, taxa_entrega, total, forma_pagamento, tipo_entrega,
        observacoes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')
    `;

    const { meta: pedidoMeta } = await env.DB.prepare(insertPedidoQuery).bind(
      numeroProximoPedido,
      data.cliente_nome,
      data.cliente_telefone,
      data.cliente_endereco || null,
      subtotal,
      taxaEntrega,
      total,
      data.forma_pagamento,
      data.tipo_entrega,
      data.observacoes || null
    ).run();

    const pedidoId = pedidoMeta.last_row_id;

    // Inserir itens do pedido
    for (const item of itensProcessados) {
      const insertItemQuery = `
        INSERT INTO itens_pedido (
          pedido_id, produto_id, produto_nome, tamanho_id,
          quantidade, preco_unitario, preco_total, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Buscar nome do produto
      const { results: produtoNome } = await env.DB.prepare(
        'SELECT nome FROM produtos WHERE id = ?'
      ).bind(item.produto_id).all();

      const { meta: itemMeta } = await env.DB.prepare(insertItemQuery).bind(
        pedidoId,
        item.produto_id,
        produtoNome[0].nome,
        item.tamanho_id || null,
        item.quantidade,
        item.preco_unitario,
        item.preco_total,
        item.observacoes || null
      ).run();

      // Inserir sabores do item (se houver)
      if (item.sabores && item.sabores.length > 0) {
        for (const saborId of item.sabores) {
          // Buscar nome do sabor
          const { results: saborNome } = await env.DB.prepare(
            'SELECT nome FROM sabores WHERE id = ?'
          ).bind(saborId).all();

          await env.DB.prepare(
            'INSERT INTO item_sabores (item_pedido_id, sabor_id, sabor_nome) VALUES (?, ?, ?)'
          ).bind(itemMeta.last_row_id, saborId, saborNome[0]?.nome || 'Sabor não encontrado').run();
        }
      }
    }

    // Buscar o pedido completo criado para retornar
    const { results: pedidoCompleto } = await env.DB.prepare(`
      SELECT 
        p.id,
        p.numero,
        p.cliente_nome,
        p.cliente_telefone,
        p.cliente_endereco,
        p.subtotal,
        p.taxa_entrega,
        p.total,
        p.forma_pagamento,
        p.tipo_entrega,
        p.status,
        p.observacoes,
        p.data_entrega,
        p.created_at
      FROM pedidos p
      WHERE p.id = ?
    `).bind(pedidoId).all();

    // Buscar itens do pedido
    const { results: itensPedido } = await env.DB.prepare(`
      SELECT 
        ip.id,
        ip.produto_id,
        ip.produto_nome,
        ip.tamanho_id,
        ip.quantidade,
        ip.preco_unitario,
        ip.preco_total,
        ip.observacoes
      FROM itens_pedido ip
      WHERE ip.pedido_id = ?
    `).bind(pedidoId).all();

    // Buscar sabores de cada item
    for (let item of itensPedido) {
      const { results: sabores } = await env.DB.prepare(`
        SELECT sabor_id, sabor_nome
        FROM item_sabores
        WHERE item_pedido_id = ?
      `).bind(item.id).all();
      
      item.sabores = sabores.map(s => ({
        id: s.sabor_id,
        nome: s.sabor_nome
      }));
    }

    const pedidoRetorno = {
      ...pedidoCompleto[0],
      numeroPedido: pedidoCompleto[0].numero,
      cliente: {
        nome: pedidoCompleto[0].cliente_nome,
        telefone: pedidoCompleto[0].cliente_telefone,
        endereco: pedidoCompleto[0].cliente_endereco
      },
      formaPagamento: pedidoCompleto[0].forma_pagamento,
      tipoEntrega: pedidoCompleto[0].tipo_entrega,
      itens: itensPedido
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Pedido criado com sucesso',
      data: pedidoRetorno
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Deletar pedido
router.delete('/api/v1/pedidos/:id', async (request, env) => {
  try {
    const { id } = request.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID inválido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Verificar se pedido existe
    const { results: pedidoExiste } = await env.DB.prepare(
      'SELECT id FROM pedidos WHERE id = ?'
    ).bind(id).all();
    
    if (pedidoExiste.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido não encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Como o schema tem ON DELETE CASCADE, só precisamos deletar o pedido
    // Os itens e sabores serão deletados automaticamente
    await env.DB.prepare('DELETE FROM pedidos WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Pedido removido com sucesso'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

export default router;