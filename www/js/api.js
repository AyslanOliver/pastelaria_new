// Configuração da API - usando arquivo de configuração separado
const API_BASE_URL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:3000/api';

// Log para debug
console.log('🔄 API configurada para:', API_BASE_URL, 'Config:', window.API_CONFIG);

// Classe para gerenciar chamadas da API
class PastelariaAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Método genérico para fazer requisições
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
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