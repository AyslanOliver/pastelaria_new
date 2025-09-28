-- Schema para Cloudflare D1 - Otimizado para dispositivos móveis
-- Baseado nos modelos MongoDB existentes

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Pizza', 'Pastel', 'Bebida', 'Sobremesa')) DEFAULT 'Pizza',
    preco REAL NOT NULL CHECK (preco >= 0),
    descricao TEXT,
    ativo BOOLEAN DEFAULT 1,
    imagem TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sabores
CREATE TABLE IF NOT EXISTS sabores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco_adicional REAL DEFAULT 0 CHECK (preco_adicional >= 0),
    descricao TEXT,
    ativo BOOLEAN DEFAULT 1,
    categoria TEXT CHECK (categoria IN ('Doce', 'Salgado', 'Especial')) DEFAULT 'Salgado',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tamanhos
CREATE TABLE IF NOT EXISTS tamanhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    multiplicador REAL NOT NULL CHECK (multiplicador >= 0.1) DEFAULT 1.0,
    descricao TEXT,
    ativo BOOLEAN DEFAULT 1,
    ordem INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE NOT NULL,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT NOT NULL,
    cliente_endereco TEXT,
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    taxa_entrega REAL DEFAULT 0 CHECK (taxa_entrega >= 0),
    total REAL NOT NULL CHECK (total >= 0),
    forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Dinheiro', 'Cartão', 'PIX', 'Débito', 'Crédito')),
    tipo_entrega TEXT NOT NULL CHECK (tipo_entrega IN ('Balcão', 'Entrega')) DEFAULT 'Balcão',
    status TEXT CHECK (status IN ('Pendente', 'Preparando', 'Pronto', 'Entregue', 'Cancelado')) DEFAULT 'Pendente',
    observacoes TEXT,
    data_entrega DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    produto_nome TEXT NOT NULL,
    tamanho_id INTEGER,
    quantidade INTEGER NOT NULL CHECK (quantidade >= 1),
    preco_unitario REAL NOT NULL CHECK (preco_unitario >= 0),
    preco_total REAL NOT NULL CHECK (preco_total >= 0),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (tamanho_id) REFERENCES tamanhos(id)
);

-- Tabela de Sabores por Item (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS item_sabores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_pedido_id INTEGER NOT NULL,
    sabor_id INTEGER NOT NULL,
    sabor_nome TEXT NOT NULL,
    adicional REAL DEFAULT 0,
    FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (sabor_id) REFERENCES sabores(id)
);

-- Tabela para cache de dados (otimização mobile)
CREATE TABLE IF NOT EXISTS cache_dados (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para sincronização offline
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operacao TEXT NOT NULL CHECK (operacao IN ('CREATE', 'UPDATE', 'DELETE')),
    tabela TEXT NOT NULL,
    dados TEXT NOT NULL, -- JSON
    processado BOOLEAN DEFAULT 0,
    tentativas INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de performance em dispositivos móveis
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_sabores_categoria ON sabores(categoria);
CREATE INDEX IF NOT EXISTS idx_sabores_ativo ON sabores(ativo);
CREATE INDEX IF NOT EXISTS idx_tamanhos_ativo ON tamanhos(ativo);
CREATE INDEX IF NOT EXISTS idx_tamanhos_ordem ON tamanhos(ordem);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_item_sabores_item_id ON item_sabores(item_pedido_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_dados(expires_at);
CREATE INDEX IF NOT EXISTS idx_sync_processado ON sync_queue(processado);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_produtos_timestamp 
    AFTER UPDATE ON produtos
    BEGIN
        UPDATE produtos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_sabores_timestamp 
    AFTER UPDATE ON sabores
    BEGIN
        UPDATE sabores SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tamanhos_timestamp 
    AFTER UPDATE ON tamanhos
    BEGIN
        UPDATE tamanhos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_pedidos_timestamp 
    AFTER UPDATE ON pedidos
    BEGIN
        UPDATE pedidos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;