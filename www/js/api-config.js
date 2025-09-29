// Configuração da API - Arquivo separado para evitar cache
// VERSÃO ATUALIZADA - Força limpeza de cache
window.API_CONFIG = {
    // Para desenvolvimento local (browser)
    BASE_URL_LOCAL: 'http://localhost:3000/api/v1',
    // Para dispositivos móveis na mesma rede (IP atual da máquina)
    BASE_URL_NETWORK: 'http://10.0.0.126:3000/api/v1',
    // Para emulador Android
    BASE_URL_EMULATOR: 'http://10.0.2.2:3000/api/v1',
    // Para produção - usando servidor local como fallback já que APIs externas não estão funcionando
    BASE_URL_PRODUCTION: 'http://10.0.0.126:3000/api/v1',
    VERSION: '3.2.0',
    TIMESTAMP: Date.now()
};

// Função para limpar cache da API
function clearApiCache() {
    try {
        localStorage.removeItem('api_base_url');
        sessionStorage.removeItem('api_base_url');
        console.log('🧹 Cache da API limpo');
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
    }
}

// Função para salvar configuração no localStorage
function saveApiConfig(url) {
    try {
        localStorage.setItem('api_base_url', url);
        console.log('💾 Configuração salva:', url);
    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
    }
}

// Função para carregar configuração do localStorage
function loadApiConfig() {
    try {
        const saved = localStorage.getItem('api_base_url');
        if (saved) {
            console.log('📂 Configuração carregada do storage:', saved);
            return saved;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar configuração:', error);
    }
    return null;
}

// Detecta se está rodando em dispositivo móvel ou browser
function getApiBaseUrl() {
    console.log('🔍 Detectando ambiente...');
    console.log('🔍 window.cordova:', !!window.cordova);
    console.log('🔍 window.PhoneGap:', !!window.PhoneGap);
    console.log('🔍 window.phonegap:', !!window.phonegap);
    console.log('🔍 document.URL:', document.URL);
    console.log('🔍 location.protocol:', location.protocol);
    console.log('🔍 navigator.userAgent:', navigator.userAgent);
    
    // Primeiro, verifica se há configuração salva
    const savedConfig = loadApiConfig();
    if (savedConfig) {
        console.log('✅ Usando configuração salva:', savedConfig);
        return savedConfig;
    }
    
    // Detecta se está rodando em emulador Android
    const isAndroidEmulator = !!(
        navigator.userAgent.indexOf('Android') !== -1 && 
        (navigator.userAgent.indexOf('sdk_gphone') !== -1 || // Emulador padrão
         navigator.userAgent.indexOf('Emulator') !== -1 ||   // Emulador genérico
         navigator.userAgent.indexOf('AVD') !== -1 ||        // Android Virtual Device
         window.location.hostname === 'localhost' ||         // Pode ser emulador
         document.URL.indexOf('android_asset') !== -1)       // Asset do Android
    );
    
    if (isAndroidEmulator) {
        console.log('🤖 Detectado emulador Android - usando 10.0.2.2');
        console.log('🌐 URL da API:', window.API_CONFIG.BASE_URL_EMULATOR);
        const url = window.API_CONFIG.BASE_URL_EMULATOR;
        saveApiConfig(url); // Salva para próximas vezes
        return url;
    }
    
    // Detecção mais robusta do ambiente móvel
    const isMobile = !!(
        window.cordova || 
        window.PhoneGap || 
        window.phonegap || 
        document.URL.indexOf('file://') === 0 ||
        document.URL.indexOf('android_asset') !== -1 ||
        navigator.userAgent.indexOf('wv') !== -1 || // WebView
        (window.location.protocol === 'file:')
    );
    
    if (isMobile) {
        console.log('📱 Detectado dispositivo móvel - usando produção');
        console.log('🌐 URL da API (produção):', window.API_CONFIG.BASE_URL_PRODUCTION);
        const url = window.API_CONFIG.BASE_URL_PRODUCTION;
        saveApiConfig(url); // Salva para próximas vezes
        return url;
    } else {
        // Browser - detecta se está rodando localmente
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '0.0.0.0';
        
        if (isLocalhost) {
            console.log('💻 Detectado ambiente local - usando API local');
            console.log('🌐 URL da API:', window.API_CONFIG.BASE_URL_LOCAL);
            const url = window.API_CONFIG.BASE_URL_LOCAL;
            saveApiConfig(url);
            return url;
        } else {
            console.log('💻 Detectado ambiente browser remoto - usando produção');
            console.log('🌐 URL da API:', window.API_CONFIG.BASE_URL_PRODUCTION);
            const url = window.API_CONFIG.BASE_URL_PRODUCTION;
            saveApiConfig(url);
            return url;
        }
    }
}

// Função para configurar manualmente a URL da API
window.setApiUrl = function(url) {
    console.log('🔧 Configurando URL manualmente:', url);
    window.API_CONFIG.BASE_URL = url;
    saveApiConfig(url);
    
    // Testa a nova configuração
    setTimeout(() => {
        testApiConnection();
    }, 500);
    
    return url;
};

// Função para resetar para configuração automática
window.resetApiConfig = function() {
    console.log('🔄 Resetando configuração da API');
    clearApiCache();
    window.API_CONFIG.BASE_URL = getApiBaseUrl();
    testApiConnection();
};

// Limpa cache antigo e define a URL base da API
clearApiCache();
window.API_CONFIG.BASE_URL = getApiBaseUrl();

// Função para testar conectividade com a API
function testApiConnection(baseUrl) {
    const urlToTest = baseUrl || window.API_CONFIG.BASE_URL;
    console.log('🔄 Testando conectividade com:', urlToTest);
    
    // Usar o endpoint /health correto (não /v1/health)
    const healthUrl = urlToTest.replace('/api/v1', '') + '/health';
    
    fetch(healthUrl)
        .then(response => {
            if (response.ok) {
                console.log('✅ API conectada com sucesso!');
                console.log('📊 Status:', response.status);
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('📋 Resposta da API:', data);
            
            // Mostra notificação de sucesso se possível
            if (window.app && window.app.toast) {
                window.app.toast.create({
                    text: '✅ API conectada com sucesso!',
                    position: 'top',
                    closeTimeout: 3000,
                }).open();
            }
        })
        .catch(error => {
            console.log('❌ Erro ao conectar com a API:', error);
            console.log('🔧 Tentando endpoint alternativo...');
            
            // Tentar endpoint alternativo
            const altUrl = urlToTest + '/health';
            fetch(altUrl)
                .then(response => {
                    if (response.ok) {
                        console.log('✅ Endpoint alternativo funcionando!');
                        if (window.app && window.app.toast) {
                            window.app.toast.create({
                                text: '✅ API conectada (endpoint alternativo)!',
                                position: 'top',
                                closeTimeout: 3000,
                            }).open();
                        }
                    } else {
                        console.log('❌ Endpoint alternativo também falhou');
                        if (window.app && window.app.toast) {
                            window.app.toast.create({
                                text: '❌ Erro de conexão com a API',
                                position: 'top',
                                closeTimeout: 5000,
                            }).open();
                        }
                    }
                })
                .catch(() => {
                    console.log('❌ Todos os endpoints falharam');
                    if (window.app && window.app.toast) {
                        window.app.toast.create({
                            text: '❌ Erro de conexão com a API',
                            position: 'top',
                            closeTimeout: 5000,
                        }).open();
                    }
                });
        });
}

// Testa a conexão quando o arquivo é carregado
setTimeout(() => {
    testApiConnection();
}, 1000);

console.log('🔄 Configuração da API carregada (VERSÃO 3.1.0):', window.API_CONFIG);
console.log('🎯 URL ATIVA:', window.API_CONFIG.BASE_URL);

// Expõe funções globalmente para debug
window.testApiConnection = testApiConnection;
window.API_CONFIG.test = testApiConnection;
window.clearApiCache = clearApiCache;