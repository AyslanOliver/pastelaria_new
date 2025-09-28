// Configuração da API - Arquivo separado para evitar cache
window.API_CONFIG = {
    // Para desenvolvimento local (browser)
    BASE_URL_LOCAL: 'http://localhost:3000/api',
    // Para dispositivos móveis na mesma rede
    BASE_URL_NETWORK: 'http://192.168.18.104:3000/api',
    // Para emulador Android
    BASE_URL_EMULATOR: 'http://10.0.2.2:3000/api',
    // Para produção no Vercel
    BASE_URL_PRODUCTION: 'https://pastelaria-39rpg3z9u-ayslanoons-projects.vercel.app/api',
    VERSION: '2.0.0',
    TIMESTAMP: Date.now()
};

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
        console.log('📱 Detectado dispositivo móvel - tentando produção primeiro');
        console.log('🌐 URL da API (produção):', window.API_CONFIG.BASE_URL_PRODUCTION);
        const url = window.API_CONFIG.BASE_URL_PRODUCTION;
        saveApiConfig(url); // Salva para próximas vezes
        return url;
    } else {
        console.log('💻 Detectado ambiente browser - usando localhost');
        console.log('🌐 URL da API:', window.API_CONFIG.BASE_URL_LOCAL);
        return window.API_CONFIG.BASE_URL_LOCAL;
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
    try {
        localStorage.removeItem('api_base_url');
    } catch (error) {
        console.error('❌ Erro ao limpar configuração:', error);
    }
    window.API_CONFIG.BASE_URL = getApiBaseUrl();
    testApiConnection();
};

// Define a URL base da API
window.API_CONFIG.BASE_URL = getApiBaseUrl();

// Função para testar conectividade
async function testApiConnection() {
    try {
        console.log('🔄 Testando conectividade com:', window.API_CONFIG.BASE_URL);
        const response = await fetch(window.API_CONFIG.BASE_URL.replace('/api', '/api/test'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API conectada com sucesso:', data);
            
            // Mostra notificação de sucesso se possível
            if (window.app && window.app.toast) {
                window.app.toast.create({
                    text: '✅ API conectada com sucesso!',
                    position: 'top',
                    closeTimeout: 3000,
                }).open();
            }
            
            return true;
        } else {
            console.error('❌ Erro na resposta da API:', response.status, response.statusText);
            
            // Mostra notificação de erro se possível
            if (window.app && window.app.toast) {
                window.app.toast.create({
                    text: `❌ Erro na API: ${response.status}`,
                    position: 'top',
                    closeTimeout: 5000,
                }).open();
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com a API:', error);
        
        // Mostra notificação de erro se possível
        if (window.app && window.app.toast) {
            window.app.toast.create({
                text: '❌ Erro de conexão com a API',
                position: 'top',
                closeTimeout: 5000,
            }).open();
        }
        
        return false;
    }
}

// Testa a conexão quando o arquivo é carregado
setTimeout(() => {
    testApiConnection();
}, 1000);

console.log('🔄 Configuração da API carregada:', window.API_CONFIG);

// Expõe funções globalmente para debug
window.testApiConnection = testApiConnection;
window.API_CONFIG.test = testApiConnection;