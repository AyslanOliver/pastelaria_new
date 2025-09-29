import { Router } from 'itty-router';
import { corsHeaders } from './utils/cors';
import produtosRouter from './routes/produtos';
import pedidosRouter from './routes/pedidos';

const router = Router();

// Middleware global para CORS - Melhorado
router.all('*', (request) => {
  // Responder a requisições OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
});

// Rota de health check
router.get('/health', () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
});

// Integrar roteador de produtos (que já funcionava)
router.all('/api/v1/produtos*', produtosRouter.handle);

// Integrar roteador de pedidos - usando fetch para debug
router.all('/api/v1/pedidos*', async (request, env, ctx) => {
  try {
    console.log('Roteando pedidos:', request.method, request.url);
    return await pedidosRouter.handle(request, env, ctx);
  } catch (error) {
    console.error('Erro no roteador de pedidos:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno no roteador de pedidos',
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

// Rota simplificada para sabores (conectando ao banco D1)
router.get('/api/v1/sabores', async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;
    
    // Buscar sabores do banco D1 (usando nomes corretos das colunas)
    const sabores = await env.DB.prepare(`
      SELECT id, nome, preco_adicional, descricao, ativo, categoria, 
             created_at, updated_at
      FROM sabores 
      WHERE ativo = 1 
      ORDER BY nome ASC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    // Contar total
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM sabores WHERE ativo = 1
    `).first();
    
    return new Response(JSON.stringify({
      success: true,
      data: sabores.results || [],
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Erro no endpoint sabores:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Rota simplificada para tamanhos (conectando ao banco D1)
router.get('/api/v1/tamanhos', async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;
    
    // Buscar tamanhos do banco D1 (usando nomes corretos das colunas)
    const tamanhos = await env.DB.prepare(`
      SELECT id, nome, multiplicador, descricao, ativo, 
             created_at, updated_at
      FROM tamanhos 
      WHERE ativo = 1 
      ORDER BY multiplicador ASC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    // Contar total
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM tamanhos WHERE ativo = 1
    `).first();
    
    return new Response(JSON.stringify({
      success: true,
      data: tamanhos.results || [],
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Erro no endpoint tamanhos:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Handler principal com CORS garantido
export default {
  async fetch(request, env, ctx) {
    try {
      // Aplicar CORS para todas as requisições OPTIONS primeiro
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      const response = await router.handle(request, env, ctx);
      
      if (response) {
        // Garantir que todas as respostas tenham CORS
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
      
      return new Response('Not Found', { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Erro no worker:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};