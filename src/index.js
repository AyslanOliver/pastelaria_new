// Cloudflare Worker principal - Otimizado para dispositivos móveis
import { Router } from 'itty-router';
import { handleCORS, addCORSHeaders } from './utils/cors.js';
import { rateLimitMiddleware } from './middleware/auth.js';
import { validateRequestSize } from './middleware/validation.js';
import { withCache, cleanExpiredCache } from './utils/cache.js';
import { compressResponse } from './utils/mobile-optimization.js';

// Importar rotas
import produtosRouter from './routes/produtos.js';
import saboresRouter from './routes/sabores.js';
import tamanhosRouter from './routes/tamanhos.js';
import pedidosRouter from './routes/pedidos.js';
import syncRouter from './routes/sync.js';

const router = Router();

// Middleware global para CORS
router.all('*', handleCORS);

// Rota de health check
router.get('/health', () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
});

// Registrar todas as rotas
router.all('*', produtosRouter.handle);
router.all('*', saboresRouter.handle);
router.all('*', tamanhosRouter.handle);
router.all('*', pedidosRouter.handle);
router.all('*', syncRouter.handle);

// Rota para limpeza de cache (administrativa)
router.post('/api/v1/admin/clear-cache', authenticateRequest, async (request, env) => {
  try {
    await env.DB.prepare('DELETE FROM cache_dados WHERE expires_at < ?')
      .bind(new Date().toISOString())
      .run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cache limpo com sucesso' 
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Erro ao limpar cache',
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

// Rota para estatísticas (otimizada para mobile)
router.get('/api/v1/stats', async (request, env) => {
  try {
    // Verificar cache primeiro
    const cacheKey = 'stats_dashboard';
    const cached = await getCachedResponse(env.DB, cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'X-Cache': 'HIT'
        }
      });
    }

    // Buscar dados do banco
    const [produtos, pedidosHoje, pedidosPendentes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as total FROM produtos WHERE ativo = 1').first(),
      env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM pedidos 
        WHERE DATE(created_at) = DATE('now')
      `).first(),
      env.DB.prepare('SELECT COUNT(*) as total FROM pedidos WHERE status = ?')
        .bind('Pendente').first()
    ]);

    const stats = {
      produtos_ativos: produtos.total,
      pedidos_hoje: pedidosHoje.total,
      pedidos_pendentes: pedidosPendentes.total,
      timestamp: new Date().toISOString()
    };

    // Cache por 5 minutos
    await cacheResponse(env.DB, cacheKey, JSON.stringify(stats), 300);

    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar estatísticas',
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

// Handler principal
export default {
  async fetch(request, env, ctx) {
    try {
      // Verificar tamanho da requisição (limite para mobile)
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
        return new Response(JSON.stringify({ 
          error: 'Requisição muito grande',
          max_size: '10MB'
        }), {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Processar requisição
      const response = await router.handle(request, env, ctx);
      
      // Adicionar headers de segurança
      const secureResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });

      return secureResponse;
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
  },

  // Handler para tarefas agendadas (limpeza de cache)
  async scheduled(controller, env, ctx) {
    try {
      // Limpar cache expirado
      await env.DB.prepare('DELETE FROM cache_dados WHERE expires_at < ?')
        .bind(new Date().toISOString())
        .run();
      
      console.log('Cache expirado limpo com sucesso');
    } catch (error) {
      console.error('Erro na limpeza de cache:', error);
    }
  }
};