// Configuração da API - Arquivo separado para evitar cache
window.API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    VERSION: '2.0.0',
    TIMESTAMP: Date.now()
};

console.log('🔄 Configuração da API carregada:', window.API_CONFIG);