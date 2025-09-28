// Configuração da API
const API_BASE_URL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:3000/api';

console.log('🔄 API.js carregado com URL:', API_BASE_URL);

class PastelariaAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        console.log('🔄 PastelariaAPI inicializada com URL:', this.baseURL);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('🌐 Fazendo requisição para:', url);
        console.log('🔧 Opções da requisição:', options);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };
        console.log('🔧 Opções finais:', finalOptions);

        try {
            const response = await fetch(url, finalOptions);
            console.log('📡 Resposta recebida:', response.status, response.statusText);
            
            if (!response.ok) {
                console.error('❌ Erro na resposta:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Dados recebidos:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            console.error('❌ URL que falhou:', url);
            throw error;
        }
    }

    // Produtos
    async getProdutos() {
        return this.request('/produtos');
    }

    async getProdutoById(id) {
        return this.request(`/produtos/${id}`);
    }

    async getProdutosByCategoria(categoria) {
        return this.request(`/produtos/categoria/${categoria}`);
    }

    // Sabores
    async getSabores() {
        return this.request('/sabores');
    }

    async getSaboresByCategoria(categoria) {
        return this.request(`/sabores/categoria/${categoria}`);
    }

    // Tamanhos
    async getTamanhos() {
        return this.request('/tamanhos');
    }

    // Pedidos
    async criarPedido(pedidoData) {
        return this.request('/pedidos', {
            method: 'POST',
            body: JSON.stringify(pedidoData)
        });
    }

    async getPedidos() {
        return this.request('/pedidos');
    }

    async getPedidoById(id) {
        return this.request(`/pedidos/${id}`);
    }

    async getPedidoByNumero(numero) {
        return this.request(`/pedidos/numero/${numero}`);
    }

    async atualizarStatusPedido(id, status) {
        return this.request(`/pedidos/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    // Método para testar a conexão com a API
    async testarConexao() {
        try {
            const response = await this.request('/test');
            console.log('✅ Conexão com API estabelecida:', response);
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar com a API:', error);
            return false;
        }
    }
}

// Instância global da API
const api = new PastelariaAPI();

// Exportar para uso em outros arquivos
window.PastelariaAPI = PastelariaAPI;
window.api = api;