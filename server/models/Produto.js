const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Pizza', 'Pastel', 'Bebida', 'Sobremesa'],
    default: 'Pizza'
  },
  preco: {
    type: Number,
    required: true,
    min: 0
  },
  descricao: {
    type: String,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  imagem: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Produto', produtoSchema);