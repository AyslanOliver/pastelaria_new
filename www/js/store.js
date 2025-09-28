const store = {
    // Gerenciamento de Produtos
    produtos: {
        getAll() {
            const produtos = localStorage.getItem('produtos');
            return produtos ? JSON.parse(produtos) : [];
        },
        
        add(produto) {
            const produtos = this.getAll();
            produto.id = Date.now().toString();
            produtos.push(produto);
            localStorage.setItem('produtos', JSON.stringify(produtos));
            return produto;
        },
        
        update(produto) {
            const produtos = this.getAll();
            const index = produtos.findIndex(p => p.id === produto.id);
            if (index !== -1) {
                produtos[index] = produto;
                localStorage.setItem('produtos', JSON.stringify(produtos));
                return true;
            }
            return false;
        },
        
        delete(id) {
            const produtos = this.getAll();
            const filteredProdutos = produtos.filter(p => p.id !== id);
            localStorage.setItem('produtos', JSON.stringify(filteredProdutos));
        }
    },

    // Gerenciamento de Sabores de Pizza
    sabores: {
        getAll() {
            const sabores = localStorage.getItem('sabores');
            return sabores ? JSON.parse(sabores) : [];
        },
        
        add(sabor) {
            const sabores = this.getAll();
            sabor.id = Date.now().toString();
            sabor.categoria = 'Pizza';
            sabores.push(sabor);
            localStorage.setItem('sabores', JSON.stringify(sabores));
            return sabor;
        },
        
        update(sabor) {
            const sabores = this.getAll();
            const index = sabores.findIndex(s => s.id === sabor.id);
            if (index !== -1) {
                sabores[index] = sabor;
                localStorage.setItem('sabores', JSON.stringify(sabores));
                return true;
            }
            return false;
        },
        
        delete(id) {
            const sabores = this.getAll();
            const filteredSabores = sabores.filter(s => s.id !== id);
            localStorage.setItem('sabores', JSON.stringify(filteredSabores));
        }
    },

    // Gerenciamento de Tamanhos de Pizza
    tamanhos: {
        getAll() {
            const tamanhos = localStorage.getItem('tamanhos');
            return tamanhos ? JSON.parse(tamanhos) : [];
        },
        
        add(tamanho) {
            const tamanhos = this.getAll();
            tamanho.id = Date.now().toString();
            tamanhos.push(tamanho);
            localStorage.setItem('tamanhos', JSON.stringify(tamanhos));
            return tamanho;
        },
        
        update(tamanho) {
            const tamanhos = this.getAll();
            const index = tamanhos.findIndex(t => t.id === tamanho.id);
            if (index !== -1) {
                tamanhos[index] = tamanho;
                localStorage.setItem('tamanhos', JSON.stringify(tamanhos));
                return true;
            }
            return false;
        },
        
        delete(id) {
            const tamanhos = this.getAll();
            const filteredTamanhos = tamanhos.filter(t => t.id !== id);
            localStorage.setItem('tamanhos', JSON.stringify(filteredTamanhos));
        }
    },

    // Configurações do Aplicativo
    config: {
        get() {
            const config = localStorage.getItem('config');
            return config ? JSON.parse(config) : {
                bluetoothAddress: '',
                taxaEntrega: 0
            };
        },
        
        save(config) {
            localStorage.setItem('config', JSON.stringify(config));
        }
    },

    // Gerenciamento de Pedidos
    pedidos: {
        getAll() {
            const pedidos = localStorage.getItem('pedidos');
            return pedidos ? JSON.parse(pedidos) : [];
        },
        
        add(pedido) {
            const pedidos = this.getAll();
            pedido.id = Date.now().toString();
            pedido.data = new Date().toISOString();
            pedidos.push(pedido);
            localStorage.setItem('pedidos', JSON.stringify(pedidos));
            return pedido;
        },
        
        getById(id) {
            const pedidos = this.getAll();
            return pedidos.find(p => p.id === id);
        },
        
        update(pedido) {
            const pedidos = this.getAll();
            const index = pedidos.findIndex(p => p.id === pedido.id);
            if (index !== -1) {
                pedidos[index] = pedido;
                localStorage.setItem('pedidos', JSON.stringify(pedidos));
                return true;
            }
            return false;
        },
        
        delete(id) {
            const pedidos = this.getAll();
            const filteredPedidos = pedidos.filter(p => p.id !== id);
            localStorage.setItem('pedidos', JSON.stringify(filteredPedidos));
        }
    }
};