// Middleware de autenticação JWT otimizado para mobile

import { corsHeaders } from '../utils/cors';

/**
 * Gera um token JWT simples (para demonstração)
 * Em produção, use uma biblioteca JWT completa
 */
export function generateToken(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Simulação de assinatura (use uma biblioteca JWT real em produção)
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifica um token JWT simples
 */
export function verifyToken(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verificar assinatura (simplificado)
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(atob(payload));
    
    // Verificar expiração
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticação
 */
export async function authenticateRequest(request, env, ctx) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    const secret = env.JWT_SECRET || 'default-secret-change-in-production';
    
    const payload = verifyToken(token, secret);
    
    if (!payload) {
      return new Response(JSON.stringify({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Adicionar dados do usuário à requisição
    request.user = payload;
    
    // Continuar para o próximo middleware/handler
    return null;
    
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Middleware de autenticação opcional (não bloqueia se não houver token)
 */
export async function optionalAuth(request, env, ctx) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = env.JWT_SECRET || 'default-secret-change-in-production';
      const payload = verifyToken(token, secret);
      
      if (payload) {
        request.user = payload;
      }
    }
    
    return null; // Sempre continua
  } catch (error) {
    console.error('Erro na autenticação opcional:', error);
    return null; // Não bloqueia em caso de erro
  }
}

/**
 * Endpoint para login (exemplo)
 */
export async function loginHandler(request, env) {
  try {
    const { username, password } = await request.json();
    
    // Validação simples (em produção, use hash de senha e banco de dados)
    if (username === 'admin' && password === 'admin123') {
      const payload = {
        username,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
      };
      
      const secret = env.JWT_SECRET || 'default-secret-change-in-production';
      const token = generateToken(payload, secret);
      
      return new Response(JSON.stringify({
        success: true,
        token,
        user: {
          username: payload.username,
          role: payload.role
        },
        expires_in: 86400 // 24 horas em segundos
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Credenciais inválidas',
      code: 'INVALID_CREDENTIALS'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro no login',
      details: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Rate limiting simples para proteger endpoints
 */
export async function rateLimitMiddleware(request, env, limit = 100, window = 3600) {
  try {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `rate_limit:${clientIP}`;
    
    // Verificar cache para rate limiting
    const cached = await env.DB.prepare(`
      SELECT valor, expires_at 
      FROM cache_dados 
      WHERE chave = ? AND expires_at > ?
    `).bind(key, new Date().toISOString()).first();
    
    let requests = 0;
    
    if (cached) {
      requests = parseInt(cached.valor) + 1;
      
      if (requests > limit) {
        return new Response(JSON.stringify({
          error: 'Muitas requisições',
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: window
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': window.toString(),
            ...corsHeaders
          }
        });
      }
    } else {
      requests = 1;
    }
    
    // Atualizar contador
    const expiresAt = new Date(Date.now() + (window * 1000)).toISOString();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO cache_dados (chave, valor, expires_at)
      VALUES (?, ?, ?)
    `).bind(key, requests.toString(), expiresAt).run();
    
    return null; // Continuar
  } catch (error) {
    console.error('Erro no rate limiting:', error);
    return null; // Não bloquear em caso de erro
  }
}