// API de Produtos otimizada para Cloudflare D1 e dispositivos móveis

import { Router } from 'itty-router';
import { corsHeaders } from '../utils/cors';
import { optionalAuth } from '../middleware/auth';
import { validateRequest, schemas, validateUrlParams, validators } from '../middleware/validation';
import { withCache, invalidateCachePattern } from '../utils/cache';
import { detectDeviceType, adaptResponseForDevice, createMobilePagination, optimizeImageUrl } from '../utils/mobile-optimization';

const router = Router();

// Listar produtos com otimizações para mobile
router.get('/api/v1/produtos', withCache(async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const categoria = url.searchParams.get('categoria');
    const ativo = url.searchParams.get('ativo');
    const search = url.searchParams.get('search');
    
    const deviceType = detectDeviceType(request);
    const offset = (page - 1) * limit;
    
    // Construir query dinâmica
    let whereConditions = [];
    let params = [];
    
    if (categoria) {
      whereConditions.push('categoria = ?');
      params.push(categoria);
    }
    
    if (ativo !== null && ativo !== undefined) {
      whereConditions.push('ativo = ?');
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    if (search) {
      whereConditions.push('(nome LIKE ? OR descricao LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM produtos ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult.total;
    
    // Query para buscar produtos
    const query = `
      SELECT id, nome, categoria, preco, descricao, ativo, imagem, updated_at
      FROM produtos 
      ${whereClause}
      ORDER BY nome ASC 
      LIMIT ? OFFSET ?
    `;
    
    const result = await env.DB.prepare(query).bind(...params, limit, offset).all();
    const produtos = result.results || [];
    
    // Otimizar imagens para o dispositivo
    const produtosOtimizados = produtos.map(produto => ({
      ...produto,
      imagem: optimizeImageUrl(produto.imagem, deviceType),
      preco: parseFloat(produto.preco) // Garantir que preço seja número
    }));
    
    const pagination = createMobilePagination(total, page, limit);
    
    const response = {
      success: true,
      data: produtosOtimizados,
      pagination,
      filters: {
        categoria,
        ativo,
        search
      }
    };
    
    // Adaptar resposta para o dispositivo
    const adaptedResponse = adaptResponseForDevice(response, deviceType);
    
    return new Response(JSON.stringify(adaptedResponse), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao buscar produtos',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}, 300)); // Cache por 5 minutos

// Buscar produto por ID
router.get('/api/v1/produtos/:id', withCache(async (request, env) => {
  try {
    const { id } = request.params;
    
    // Validar ID
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f) => validators.number(v, f, { min: 1 })]
    });
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: 'ID inválido',
        details: errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const produto = await env.DB.prepare(`
      SELECT id, nome, categoria, preco, descricao, ativo, imagem, created_at, updated_at
      FROM produtos 
      WHERE id = ?
    `).bind(id).first();
    
    if (!produto) {
      return new Response(JSON.stringify({
        error: 'Produto não encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const deviceType = detectDeviceType(request);
    
    const produtoOtimizado = {
      ...produto,
      imagem: optimizeImageUrl(produto.imagem, deviceType),
      preco: parseFloat(produto.preco)
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: produtoOtimizado
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao buscar produto',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}, 600)); // Cache por 10 minutos

// Criar novo produto
router.post('/api/v1/produtos', optionalAuth, validateRequest(schemas.produto), async (request, env) => {
  try {
    const data = request.validatedData;
    
    const result = await env.DB.prepare(`
      INSERT INTO produtos (nome, categoria, preco, descricao, ativo, imagem)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.nome,
      data.categoria || 'Pizza',
      data.preco,
      data.descricao || '',
      data.ativo !== undefined ? (data.ativo ? 1 : 0) : 1,
      data.imagem || ''
    ).run();
    
    if (result.success) {
      // Invalidar cache de produtos
      await invalidateCachePattern(env.DB, 'GET|/api/v1/produtos%');
      
      // Buscar produto criado
      const novoProduto = await env.DB.prepare(`
        SELECT * FROM produtos WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Produto criado com sucesso',
        data: {
          ...novoProduto,
          preco: parseFloat(novoProduto.preco)
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    throw new Error('Falha ao criar produto');
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao criar produto',
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

// Atualizar produto
router.put('/api/v1/produtos/:id', optionalAuth, validateRequest(schemas.produto), async (request, env) => {
  try {
    const { id } = request.params;
    const data = request.validatedData;
    
    // Validar ID
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f) => validators.number(v, f, { min: 1 })]
    });
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: 'ID inválido',
        details: errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const result = await env.DB.prepare(`
      UPDATE produtos 
      SET nome = ?, categoria = ?, preco = ?, descricao = ?, ativo = ?, imagem = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.nome,
      data.categoria || 'Pizza',
      data.preco,
      data.descricao || '',
      data.ativo !== undefined ? (data.ativo ? 1 : 0) : 1,
      data.imagem || '',
      id
    ).run();
    
    if (result.success && result.changes > 0) {
      // Invalidar cache
      await invalidateCachePattern(env.DB, 'GET|/api/v1/produtos%');
      
      // Buscar produto atualizado
      const produtoAtualizado = await env.DB.prepare(`
        SELECT * FROM produtos WHERE id = ?
      `).bind(id).first();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: {
          ...produtoAtualizado,
          preco: parseFloat(produtoAtualizado.preco)
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Produto não encontrado'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao atualizar produto',
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

// Deletar produto
router.delete('/api/v1/produtos/:id', optionalAuth, async (request, env) => {
  try {
    const { id } = request.params;
    
    // Validar ID
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f) => validators.number(v, f, { min: 1 })]
    });
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: 'ID inválido',
        details: errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Verificar se produto existe
    const produto = await env.DB.prepare('SELECT id FROM produtos WHERE id = ?').bind(id).first();
    
    if (!produto) {
      return new Response(JSON.stringify({
        error: 'Produto não encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Soft delete - apenas marcar como inativo
    const result = await env.DB.prepare(`
      UPDATE produtos 
      SET ativo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      // Invalidar cache
      await invalidateCachePattern(env.DB, 'GET|/api/v1/produtos%');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Produto removido com sucesso'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    throw new Error('Falha ao remover produto');
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro ao remover produto',
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

export default router;