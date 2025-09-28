const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  produtoNome: {
    type: String,
    required: true
  },
  tamanho: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tamanho'
  },
  sabores: [{
    sabor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sabor'
    },
    nome: String,
    adicional: {
      type: Number,
      default: 0
    }
  }],
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  precoUnitario: {
    type: Number,
    required: true,
    min: 0
  },
  precoTotal: {
    type: Number,
    required: true,
    min: 0
  },
  observacoes: {
    type: String,
    trim: true
  }
});

const pedidoSchema = new mongoose.Schema({
  numero: {
    type: Number,
    unique: true
  },
  cliente: {
    nome: {
      type: String,
      required: true,
      trim: true
    },
    telefone: {
      type: String,
      required: true,
      trim: true
    },
    endereco: {
      type: String,
      trim: true
    }
  },
  itens: [itemPedidoSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxaEntrega: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  formaPagamento: {
    type: String,
    required: true,
    enum: ['Dinheiro', 'Cartão', 'PIX', 'Débito', 'Crédito']
  },
  tipoEntrega: {
    type: String,
    required: true,
    enum: ['Balcão', 'Entrega'],
    default: 'Balcão'
  },
  status: {
    type: String,
    enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'],
    default: 'Pendente'
  },
  observacoes: {
    type: String,
    trim: true
  },
  dataEntrega: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-incrementar número do pedido
pedidoSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastPedido = await this.constructor.findOne({}, {}, { sort: { 'numero': -1 } });
    this.numero = lastPedido ? lastPedido.numero + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Pedido', pedidoSchema);