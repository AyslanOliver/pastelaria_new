// Utilitários de otimização para dispositivos móveis

/**
 * Comprime dados JSON para reduzir uso de banda em dispositivos móveis
 */
export function compressResponse(data) {
  // Implementação básica de compressão
  // Em produção, use uma biblioteca de compressão real
  const jsonString = JSON.stringify(data);
  
  // Remover espaços desnecessários e otimizar estrutura
  const optimized = {
    d: data, // dados
    t: Date.now(), // timestamp
    c: true // compressed flag
  };
  
  return JSON.stringify(optimized);
}

/**
 * Descomprime dados recebidos
 */
export function decompressResponse(compressedData) {
  try {
    const parsed = JSON.parse(compressedData);
    return parsed.c ? parsed.d : parsed;
  } catch (error) {
    return compressedData;
  }
}

/**
 * Otimiza consultas para dispositivos móveis
 */
export function optimizeQueryForMobile(baseQuery, options = {}) {
  const {
    limit = 50,
    offset = 0,
    fields = '*',
    orderBy = 'id DESC'
  } = options;
  
  // Limitar resultados para economizar banda e memória
  let optimizedQuery = baseQuery;
  
  if (fields !== '*') {
    optimizedQuery = optimizedQuery.replace('SELECT *', `SELECT ${fields}`);
  }
  
  if (!optimizedQuery.includes('LIMIT')) {
    optimizedQuery += ` ORDER BY ${orderBy} LIMIT ${limit}`;
    
    if (offset > 0) {
      optimizedQuery += ` OFFSET ${offset}`;
    }
  }
  
  return optimizedQuery;
}

/**
 * Detecta tipo de dispositivo baseado nos headers
 */
export function detectDeviceType(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const deviceType = request.headers.get('X-Device-Type');
  
  if (deviceType) {
    return deviceType.toLowerCase();
  }
  
  // Detecção básica por User-Agent
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Ajusta resposta baseada no tipo de dispositivo
 */
export function adaptResponseForDevice(data, deviceType) {
  switch (deviceType) {
    case 'mobile':
      return {
        ...data,
        // Remover campos desnecessários para mobile
        metadata: undefined,
        debug: undefined,
        // Limitar arrays grandes
        items: Array.isArray(data.items) ? data.items.slice(0, 20) : data.items
      };
      
    case 'tablet':
      return {
        ...data,
        // Permitir mais dados para tablets
        items: Array.isArray(data.items) ? data.items.slice(0, 50) : data.items
      };
      
    default:
      return data;
  }
}

/**
 * Implementa paginação otimizada para mobile
 */
export function createMobilePagination(totalItems, currentPage = 1, itemsPerPage = 20) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  
  return {
    current_page: currentPage,
    items_per_page: itemsPerPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: hasNext,
    has_previous: hasPrev,
    next_page: hasNext ? currentPage + 1 : null,
    previous_page: hasPrev ? currentPage - 1 : null
  };
}

/**
 * Otimiza imagens para dispositivos móveis
 */
export function optimizeImageUrl(imageUrl, deviceType, quality = 'medium') {
  if (!imageUrl) return '';
  
  // Se usando Cloudflare Images, adicionar transformações
  if (imageUrl.includes('imagedelivery.net')) {
    const qualityMap = {
      'low': 'q_30,f_auto',
      'medium': 'q_60,f_auto',
      'high': 'q_80,f_auto'
    };
    
    const sizeMap = {
      'mobile': 'w_400,h_400',
      'tablet': 'w_600,h_600',
      'desktop': 'w_800,h_800'
    };
    
    const transforms = [
      qualityMap[quality] || qualityMap.medium,
      sizeMap[deviceType] || sizeMap.mobile
    ].join(',');
    
    return `${imageUrl}/${transforms}`;
  }
  
  return imageUrl;
}

/**
 * Implementa throttling de requisições para economizar bateria
 */
export class RequestThrottler {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  canMakeRequest(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const clientRequests = this.requests.get(clientId);
    
    // Remover requisições antigas
    const validRequests = clientRequests.filter(time => time > windowStart);
    this.requests.set(clientId, validRequests);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Adicionar nova requisição
    validRequests.push(now);
    return true;
  }
  
  getRemainingRequests(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(clientId)) {
      return this.maxRequests;
    }
    
    const validRequests = this.requests.get(clientId)
      .filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Otimiza dados para armazenamento local em dispositivos móveis
 */
export function optimizeForLocalStorage(data) {
  // Remover campos desnecessários
  const optimized = { ...data };
  
  // Remover timestamps desnecessários
  delete optimized.created_at;
  delete optimized.updated_at;
  
  // Converter números para strings se necessário (economizar espaço)
  if (optimized.preco) {
    optimized.preco = optimized.preco.toString();
  }
  
  // Remover campos vazios
  Object.keys(optimized).forEach(key => {
    if (optimized[key] === null || optimized[key] === undefined || optimized[key] === '') {
      delete optimized[key];
    }
  });
  
  return optimized;
}

/**
 * Implementa cache inteligente baseado na conectividade
 */
export function getCacheStrategy(request) {
  const connection = request.headers.get('X-Connection-Type') || 'unknown';
  const deviceType = detectDeviceType(request);
  
  // Estratégias de cache baseadas na conectividade
  const strategies = {
    'wifi': {
      ttl: 300, // 5 minutos
      maxSize: 1000,
      preload: true
    },
    '4g': {
      ttl: 600, // 10 minutos
      maxSize: 500,
      preload: false
    },
    '3g': {
      ttl: 1800, // 30 minutos
      maxSize: 200,
      preload: false
    },
    '2g': {
      ttl: 3600, // 1 hora
      maxSize: 100,
      preload: false
    },
    'unknown': {
      ttl: 600, // 10 minutos
      maxSize: 300,
      preload: false
    }
  };
  
  return strategies[connection] || strategies.unknown;
}

/**
 * Monitora performance da aplicação em dispositivos móveis
 */
export function createPerformanceMetrics(request, startTime) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const deviceType = detectDeviceType(request);
  
  return {
    duration_ms: duration,
    device_type: deviceType,
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    user_agent: request.headers.get('User-Agent'),
    connection_type: request.headers.get('X-Connection-Type')
  };
}

/**
 * Implementa retry automático para requisições falhadas
 */
export async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Backoff exponencial
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

/**
 * Otimiza limite de resultados baseado no tipo de dispositivo
 */
export function optimizeForMobile(limit, deviceType) {
  const deviceLimits = {
    'mobile': Math.min(limit, 10),
    'tablet': Math.min(limit, 20),
    'desktop': limit
  };
  
  return deviceLimits[deviceType] || deviceLimits.mobile;
}