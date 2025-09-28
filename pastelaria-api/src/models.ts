/**
 * Modelos Mongoose para Cloudflare Workers
 * Adaptados dos modelos originais do servidor
 */

import { Schema, model, Document } from 'mongoose';

// Interface para Produto
export interface IProduto extends Document {
  nome: string;
  categoria: 'Pizza' | 'Pastel' | 'Bebida' | 'Sobremesa';
  preco: number;
  descricao?: string;
  ativo: boolean;
  imagem?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Produto
const produtoSchema = new Schema<IProduto>({
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

// Interface para Sabor
export interface ISabor extends Document {
  nome: string;
  categoria: 'Doce' | 'Salgado';
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Sabor
const saborSchema = new Schema<ISabor>({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Doce', 'Salgado'],
    default: 'Salgado'
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Interface para Tamanho
export interface ITamanho extends Document {
  nome: string;
  categoria: 'Pizza' | 'Pastel';
  preco: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Tamanho
const tamanhoSchema = new Schema<ITamanho>({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Pizza', 'Pastel'],
    default: 'Pizza'
  },
  preco: {
    type: Number,
    required: true,
    min: 0
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Interface para Pedido
export interface IPedido extends Document {
  numero: number;
  cliente: {
    nome: string;
    telefone: string;
    endereco: string;
  };
  itens: Array<{
    produto: string;
    produtoNome: string;
    tamanho: string;
    sabores: string[];
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    observacoes?: string;
  }>;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  formaPagamento: 'Dinheiro' | 'Cartão' | 'PIX';
  tipoEntrega: 'Balcão' | 'Entrega';
  status: 'Pendente' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';
  observacoes?: string;
  dataEntrega?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Pedido
const pedidoSchema = new Schema<IPedido>({
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
      required: true,
      trim: true
    }
  },
  itens: [{
    produto: {
      type: String,
      required: true
    },
    produtoNome: {
      type: String,
      required: true
    },
    tamanho: {
      type: String,
      required: true
    },
    sabores: [{
      type: String,
      required: true
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
  }],
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
    enum: ['Dinheiro', 'Cartão', 'PIX']
  },
  tipoEntrega: {
    type: String,
    required: true,
    enum: ['Balcão', 'Entrega'],
    default: 'Balcão'
  },
  status: {
    type: String,
    required: true,
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

// Auto-incremento para número do pedido
pedidoSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastPedido = await model('Pedido').findOne().sort({ numero: -1 });
    this.numero = lastPedido ? lastPedido.numero + 1 : 1;
  }
  next();
});

// Exportar modelos
export const Produto = model<IProduto>('Produto', produtoSchema);
export const Sabor = model<ISabor>('Sabor', saborSchema);
export const Tamanho = model<ITamanho>('Tamanho', tamanhoSchema);
export const Pedido = model<IPedido>('Pedido', pedidoSchema);