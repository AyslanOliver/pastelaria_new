const mongoose = require('mongoose');
require('dotenv').config();

const Produto = require('../models/Produto');
const Sabor = require('../models/Sabor');
const Tamanho = require('../models/Tamanho');

const connectDB = require('../config/database');

const seedData = async () => {
  try {
    await connectDB();
    
    // Limpar dados existentes
    await Produto.deleteMany({});
    await Sabor.deleteMany({});
    await Tamanho.deleteMany({});
    
    console.log('Dados existentes removidos...');

    // Inserir Tamanhos
    const tamanhos = await Tamanho.insertMany([
      { nome: 'Pequena', multiplicador: 0.8, descricao: 'Pizza pequena (4 fatias)', ordem: 1 },
      { nome: 'Média', multiplicador: 1.0, descricao: 'Pizza média (6 fatias)', ordem: 2 },
      { nome: 'Grande', multiplicador: 1.3, descricao: 'Pizza grande (8 fatias)', ordem: 3 },
      { nome: 'Família', multiplicador: 1.6, descricao: 'Pizza família (12 fatias)', ordem: 4 }
    ]);
    console.log('Tamanhos inseridos:', tamanhos.length);

    // Inserir Sabores
    const sabores = await Sabor.insertMany([
      { nome: 'Margherita', precoAdicional: 0, categoria: 'Salgado', descricao: 'Molho de tomate, mussarela e manjericão' },
      { nome: 'Pepperoni', precoAdicional: 2.00, categoria: 'Salgado', descricao: 'Molho de tomate, mussarela e pepperoni' },
      { nome: 'Calabresa', precoAdicional: 1.50, categoria: 'Salgado', descricao: 'Molho de tomate, mussarela e calabresa' },
      { nome: 'Frango com Catupiry', precoAdicional: 3.00, categoria: 'Salgado', descricao: 'Frango desfiado com catupiry' },
      { nome: 'Portuguesa', precoAdicional: 2.50, categoria: 'Salgado', descricao: 'Presunto, ovos, cebola, azeitona e ervilha' },
      { nome: 'Quatro Queijos', precoAdicional: 4.00, categoria: 'Especial', descricao: 'Mussarela, parmesão, gorgonzola e provolone' },
      { nome: 'Chocolate', precoAdicional: 3.50, categoria: 'Doce', descricao: 'Chocolate ao leite derretido' },
      { nome: 'Banana com Canela', precoAdicional: 2.00, categoria: 'Doce', descricao: 'Banana fatiada com canela e açúcar' },
      { nome: 'Romeu e Julieta', precoAdicional: 3.00, categoria: 'Doce', descricao: 'Queijo minas com goiabada' },
      { nome: 'Vegetariana', precoAdicional: 2.50, categoria: 'Especial', descricao: 'Abobrinha, berinjela, pimentão e tomate' }
    ]);
    console.log('Sabores inseridos:', sabores.length);

    // Inserir Produtos
    const produtos = await Produto.insertMany([
      { 
        nome: 'Pizza Tradicional', 
        categoria: 'Pizza', 
        preco: 25.00, 
        descricao: 'Pizza tradicional com massa artesanal' 
      },
      { 
        nome: 'Pastel de Carne', 
        categoria: 'Pastel', 
        preco: 8.00, 
        descricao: 'Pastel frito com recheio de carne moída temperada' 
      },
      { 
        nome: 'Pastel de Queijo', 
        categoria: 'Pastel', 
        preco: 7.00, 
        descricao: 'Pastel frito com queijo mussarela derretido' 
      },
      { 
        nome: 'Pastel de Frango', 
        categoria: 'Pastel', 
        preco: 8.50, 
        descricao: 'Pastel frito com frango desfiado temperado' 
      },
      { 
        nome: 'Coca-Cola 350ml', 
        categoria: 'Bebida', 
        preco: 4.50, 
        descricao: 'Refrigerante Coca-Cola lata 350ml' 
      },
      { 
        nome: 'Guaraná Antarctica 350ml', 
        categoria: 'Bebida', 
        preco: 4.00, 
        descricao: 'Refrigerante Guaraná Antarctica lata 350ml' 
      },
      { 
        nome: 'Água Mineral 500ml', 
        categoria: 'Bebida', 
        preco: 2.50, 
        descricao: 'Água mineral sem gás 500ml' 
      },
      { 
        nome: 'Suco de Laranja 300ml', 
        categoria: 'Bebida', 
        preco: 5.00, 
        descricao: 'Suco natural de laranja 300ml' 
      },
      { 
        nome: 'Pudim de Leite', 
        categoria: 'Sobremesa', 
        preco: 6.00, 
        descricao: 'Pudim de leite condensado com calda de caramelo' 
      },
      { 
        nome: 'Brigadeiro', 
        categoria: 'Sobremesa', 
        preco: 3.00, 
        descricao: 'Brigadeiro gourmet com granulado' 
      }
    ]);
    console.log('Produtos inseridos:', produtos.length);

    console.log('✅ Dados de exemplo inseridos com sucesso!');
    console.log(`📊 Total: ${produtos.length} produtos, ${sabores.length} sabores, ${tamanhos.length} tamanhos`);
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  seedData();
}

module.exports = seedData;