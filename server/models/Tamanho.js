const mongoose = require('mongoose');

const tamanhoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  multiplicador: {
    type: Number,
    required: true,
    min: 0.1,
    default: 1.0
  },
  descricao: {
    type: String,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ordem: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tamanho', tamanhoSchema);