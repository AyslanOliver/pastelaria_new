// Sistema de cache otimizado para dispositivos móveis

/**
 * Armazena uma resposta no cache
 * @param {Object} db - Instância do banco D1
 * @param {string} key - Chave do cache
 * @param {string} value - Valor a ser cacheado (JSON string)
 * @param {number} ttl - Time to live em segundos
 */
export async function cacheResponse(db, key, value, ttl = 3600) {
  try {
    const expiresAt = new Date(Date.now() + (ttl * 1000)).toISOString();
    
    await db.prepare(`
      INSERT OR REPLACE INTO cache_dados (chave, valor, expires_at)
      VALUES (?, ?, ?)
    `).bind(key, value, expiresAt).run();
    
    return true;
  } catch (error) {
    console.error('Erro ao cachear resposta:', error);
    return false;
  }
}

/**
 * Recupera uma resposta do cache
 * @param {Object} db - Instância do banco D1
 * @param {string} key - Chave do cache
 * @returns {string|null} - Valor cacheado ou null se não encontrado/expirado
 */
export async function getCachedResponse(db, key) {
  try {
    const result = await db.prepare(`
      SELECT valor, expires_at 
      FROM cache_dados 
      WHERE chave = ? AND expires_at > ?
    `).bind(key, new Date().toISOString()).first();
    
    return result ? result.valor : null;
  } catch (error) {
    console.error('Erro ao recuperar cache:', error);
    return null;
  }
}

/**
 * Remove uma entrada específica do cache
 * @param {Object} db - Instância do banco D1
 * @param {string} key - Chave do cache
 */
export async function invalidateCache(db, key) {
  try {
    await db.prepare('DELETE FROM cache_dados WHERE chave = ?')
      .bind(key).run();
    return true;
  } catch (error) {
    console.error('Erro ao invalidar cache:', error);
    return false;
  }
}

/**
 * Remove múltiplas entradas do cache por padrão
 * @param {Object} db - Instância do banco D1
 * @param {string} pattern - Padrão da chave (usando LIKE)
 */
export async function invalidateCachePattern(db, pattern) {
  try {
    await db.prepare('DELETE FROM cache_dados WHERE chave LIKE ?')
      .bind(pattern).run();
    return true;
  } catch (error) {
    console.error('Erro ao invalidar cache por padrão:', error);
    return false;
  }
}

/**
 * Gera chave de cache baseada na requisição
 * @param {Request} request - Objeto da requisição
 * @param {Object} params - Parâmetros adicionais
 * @returns {string} - Chave do cache
 */
export function generateCacheKey(request, params = {}) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  const query = url.search;
  
  // Incluir headers relevantes para mobile
  const deviceType = request.headers.get('X-Device-Type') || 'unknown';
  const appVersion = request.headers.get('X-App-Version') || 'unknown';
  
  const keyParts = [
    method,
    path,
    query,
    deviceType,
    appVersion,
    JSON.stringify(params)
  ];
  
  return keyParts.join('|');
}

/**
 * Middleware para cache automático
 * @param {Function} handler - Handler da rota
 * @param {number} ttl - Time to live em segundos
 * @returns {Function} - Handler com cache
 */
export function withCache(handler, ttl = 3600) {
  return async (request, env, ctx) => {
    const cacheKey = generateCacheKey(request);
    
    // Tentar recuperar do cache
    const cached = await getCachedResponse(env.DB, cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Executar handler original
    const response = await handler(request, env, ctx);
    
    // Cachear apenas respostas de sucesso
    if (response.status === 200) {
      const responseText = await response.text();
      await cacheResponse(env.DB, cacheKey, responseText, ttl);
      
      return new Response(responseText, {
        status: response.status,
        headers: {
          ...response.headers,
          'X-Cache': 'MISS'
        }
      });
    }
    
    return response;
  };
}

/**
 * Limpa cache expirado (para uso em cron jobs)
 * @param {Object} db - Instância do banco D1
 */
export async function cleanExpiredCache(db) {
  try {
    const result = await db.prepare(`
      DELETE FROM cache_dados 
      WHERE expires_at < ?
    `).bind(new Date().toISOString()).run();
    
    console.log(`Cache limpo: ${result.changes} entradas removidas`);
    return result.changes;
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
    return 0;
  }
}