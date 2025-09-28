-- Dados de exemplo para Cloudflare D1 - Otimizado para dispositivos móveis

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, categoria, preco, descricao, ativo) VALUES
('Pizza Margherita', 'Pizza', 25.90, 'Pizza clássica com molho de tomate, mussarela e manjericão', 1),
('Pizza Calabresa', 'Pizza', 28.90, 'Pizza com calabresa, cebola e azeitonas', 1),
('Pizza Portuguesa', 'Pizza', 32.90, 'Pizza com presunto, ovos, cebola, azeitonas e ervilha', 1),
('Pizza Quatro Queijos', 'Pizza', 35.90, 'Pizza com mussarela, parmesão, gorgonzola e catupiry', 1),
('Pastel de Carne', 'Pastel', 8.50, 'Pastel frito recheado com carne moída temperada', 1),
('Pastel de Queijo', 'Pastel', 7.50, 'Pastel frito recheado com queijo derretido', 1),
('Pastel de Frango', 'Pastel', 9.00, 'Pastel frito recheado com frango desfiado', 1),
('Coca-Cola 350ml', 'Bebida', 4.50, 'Refrigerante Coca-Cola lata 350ml', 1),
('Guaraná Antarctica 350ml', 'Bebida', 4.00, 'Refrigerante Guaraná Antarctica lata 350ml', 1),
('Água Mineral 500ml', 'Bebida', 2.50, 'Água mineral sem gás 500ml', 1),
('Pudim de Leite', 'Sobremesa', 12.90, 'Pudim de leite condensado com calda de caramelo', 1),
('Brigadeiro', 'Sobremesa', 3.50, 'Brigadeiro gourmet com granulado', 1);

-- Inserir sabores de exemplo
INSERT INTO sabores (nome, preco_adicional, descricao, ativo, categoria) VALUES
('Margherita', 0.00, 'Molho de tomate, mussarela e manjericão', 1, 'Salgado'),
('Calabresa', 2.00, 'Calabresa fatiada com cebola', 1, 'Salgado'),
('Portuguesa', 4.00, 'Presunto, ovos, cebola, azeitonas e ervilha', 1, 'Salgado'),
('Quatro Queijos', 6.00, 'Mussarela, parmesão, gorgonzola e catupiry', 1, 'Salgado'),
('Frango com Catupiry', 5.00, 'Frango desfiado com catupiry', 1, 'Salgado'),
('Bacon', 4.50, 'Bacon crocante com cebola', 1, 'Salgado'),
('Vegetariana', 3.50, 'Tomate, pimentão, cebola, azeitona e orégano', 1, 'Salgado'),
('Pepperoni', 5.50, 'Pepperoni italiano com pimentão', 1, 'Salgado'),
('Chocolate', 4.00, 'Chocolate ao leite derretido', 1, 'Doce'),
('Banana com Canela', 3.00, 'Banana fatiada com canela e açúcar', 1, 'Doce'),
('Romeu e Julieta', 4.50, 'Queijo com goiabada', 1, 'Doce'),
('Nutella', 6.00, 'Creme de avelã Nutella', 1, 'Especial');

-- Inserir tamanhos de exemplo
INSERT INTO tamanhos (nome, multiplicador, descricao, ativo, ordem) VALUES
('Pequena', 0.8, 'Pizza pequena - 25cm', 1, 1),
('Média', 1.0, 'Pizza média - 30cm', 1, 2),
('Grande', 1.3, 'Pizza grande - 35cm', 1, 3),
('Família', 1.6, 'Pizza família - 40cm', 1, 4),
('Individual', 0.6, 'Porção individual', 1, 0);

-- Inserir alguns pedidos de exemplo para demonstração
INSERT INTO pedidos (numero, cliente_nome, cliente_telefone, cliente_endereco, subtotal, taxa_entrega, total, forma_pagamento, tipo_entrega, status, observacoes) VALUES
(1001, 'João Silva', '(11) 99999-1234', 'Rua das Flores, 123 - Centro', 45.80, 5.00, 50.80, 'PIX', 'Entrega', 'Entregue', 'Sem cebola na pizza'),
(1002, 'Maria Santos', '(11) 88888-5678', 'Av. Principal, 456 - Jardim', 28.90, 0.00, 28.90, 'Dinheiro', 'Balcão', 'Pronto', ''),
(1003, 'Pedro Costa', '(11) 77777-9012', 'Rua da Paz, 789 - Vila Nova', 67.30, 8.00, 75.30, 'Cartão', 'Entrega', 'Preparando', 'Pizza bem assada'),
(1004, 'Ana Oliveira', '(11) 66666-3456', '', 15.50, 0.00, 15.50, 'PIX', 'Balcão', 'Pendente', 'Para viagem');

-- Inserir itens dos pedidos de exemplo
INSERT INTO itens_pedido (pedido_id, produto_id, produto_nome, tamanho_id, quantidade, preco_unitario, preco_total, observacoes) VALUES
-- Pedido 1001
(1, 1, 'Pizza Margherita', 2, 1, 25.90, 25.90, ''),
(1, 5, 'Pastel de Carne', NULL, 2, 8.50, 17.00, ''),
(1, 8, 'Coca-Cola 350ml', NULL, 1, 4.50, 4.50, ''),

-- Pedido 1002  
(2, 2, 'Pizza Calabresa', 2, 1, 28.90, 28.90, ''),

-- Pedido 1003
(3, 4, 'Pizza Quatro Queijos', 3, 1, 46.67, 46.67, ''), -- 35.90 * 1.3
(3, 6, 'Pastel de Queijo', NULL, 2, 7.50, 15.00, ''),
(3, 9, 'Guaraná Antarctica 350ml', NULL, 1, 4.00, 4.00, ''),

-- Pedido 1004
(4, 7, 'Pastel de Frango', NULL, 1, 9.00, 9.00, ''),
(4, 10, 'Água Mineral 500ml', NULL, 1, 2.50, 2.50, ''),
(4, 12, 'Brigadeiro', NULL, 1, 3.50, 3.50, '');

-- Inserir sabores dos itens (para pizzas)
INSERT INTO item_sabores (item_pedido_id, sabor_id, sabor_nome, adicional) VALUES
-- Pizza Margherita do pedido 1001
(1, 1, 'Margherita', 0.00),

-- Pizza Calabresa do pedido 1002
(2, 2, 'Calabresa', 2.00),

-- Pizza Quatro Queijos do pedido 1003
(3, 4, 'Quatro Queijos', 6.00);

-- Inserir alguns dados de cache para demonstração
INSERT INTO cache_dados (chave, valor, expires_at) VALUES
('stats_dashboard', '{"produtos_ativos":12,"pedidos_hoje":4,"pedidos_pendentes":1,"timestamp":"2024-01-01T12:00:00.000Z"}', datetime('now', '+5 minutes')),
('produtos_populares', '[{"id":1,"nome":"Pizza Margherita","vendas":25},{"id":2,"nome":"Pizza Calabresa","vendas":20}]', datetime('now', '+1 hour'));

-- Inserir dados na fila de sincronização para demonstração
INSERT INTO sync_queue (operacao, tabela, dados, processado, tentativas) VALUES
('CREATE', 'pedidos', '{"cliente_nome":"Cliente Offline","total":25.90}', 0, 0),
('UPDATE', 'produtos', '{"id":1,"preco":26.90}', 1, 1);