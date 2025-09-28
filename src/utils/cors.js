// Utilitários CORS otimizados para dispositivos móveis

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Device-Type, X-App-Version',
  'Access-Control-Max-Age': '86400', // 24 horas para reduzir preflight requests
  'Access-Control-Expose-Headers': 'X-Cache, X-Rate-Limit-Remaining, X-Response-Time'
};

export function handleCORS(request) {
  // Responder a requisições OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
}

export function addCORSHeaders(response) {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}