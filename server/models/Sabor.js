const mongoose = require('mongoose');

const saborSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  precoAdicional: {
    type: Number,
    default: 0,
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
  categoria: {
    type: String,
    enum: ['Doce', 'Salgado', 'Especial'],
    default: 'Salgado'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sabor', saborSchema);