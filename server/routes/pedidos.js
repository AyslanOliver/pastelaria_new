const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');

// GET /api/pedidos - Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { status, data, limite = 50 } = req.query;
    let filtro = {};
    
    if (status) {
      filtro.status = status;
    }
    
    if (data) {
      const dataInicio = new Date(data);
      const dataFim = new Date(data);
      dataFim.setDate(dataFim.getDate() + 1);
      filtro.createdAt = { $gte: dataInicio, $lt: dataFim };
    }

    const pedidos = await Pedido.find(filtro)
      .populate('itens.produto', 'nome categoria')
      .populate('itens.tamanho', 'nome multiplicador')
      .populate('itens.sabores.sabor', 'nome precoAdicional')
      .sort({ createdAt: -1 })
      .limit(parseInt(limite));
      
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
  }
});

// GET /api/pedidos/:id - Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('itens.produto', 'nome categoria')
      .populate('itens.tamanho', 'nome multiplicador')
      .populate('itens.sabores.sabor', 'nome precoAdicional');
      
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedido', error: error.message });
  }
});

// GET /api/pedidos/numero/:numero - Buscar pedido por número
router.get('/numero/:numero', async (req, res) => {
  try {
    const pedido = await Pedido.findOne({ numero: req.params.numero })
      .populate('itens.produto', 'nome categoria')
      .populate('itens.tamanho', 'nome multiplicador')
      .populate('itens.sabores.sabor', 'nome precoAdicional');
      
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedido', error: error.message });
  }
});

// POST /api/pedidos - Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    const novoPedido = await pedido.save();
    
    // Popular os dados para retorno
    await novoPedido.populate('itens.produto', 'nome categoria');
    await novoPedido.populate('itens.tamanho', 'nome multiplicador');
    await novoPedido.populate('itens.sabores.sabor', 'nome precoAdicional');
    
    res.status(201).json(novoPedido);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
});

// PUT /api/pedidos/:id - Atualizar pedido
router.put('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('itens.produto', 'nome categoria')
    .populate('itens.tamanho', 'nome multiplicador')
    .populate('itens.sabores.sabor', 'nome precoAdicional');
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar pedido', error: error.message });
  }
});

// PATCH /api/pedidos/:id/status - Atualizar apenas o status do pedido
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json({ message: 'Status atualizado com sucesso', pedido });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar status', error: error.message });
  }
});

// DELETE /api/pedidos/:id - Cancelar pedido
router.delete('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelado' },
      { new: true }
    );
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cancelar pedido', error: error.message });
  }
});

// GET /api/pedidos/relatorio/vendas - Relatório de vendas
router.get('/relatorio/vendas', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    let filtro = { status: { $ne: 'Cancelado' } };
    
    if (dataInicio && dataFim) {
      filtro.createdAt = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }

    const pedidos = await Pedido.find(filtro);
    
    const relatorio = {
      totalPedidos: pedidos.length,
      totalVendas: pedidos.reduce((sum, pedido) => sum + pedido.total, 0),
      ticketMedio: pedidos.length > 0 ? pedidos.reduce((sum, pedido) => sum + pedido.total, 0) / pedidos.length : 0,
      statusDistribuicao: {}
    };

    // Distribuição por status
    pedidos.forEach(pedido => {
      relatorio.statusDistribuicao[pedido.status] = (relatorio.statusDistribuicao[pedido.status] || 0) + 1;
    });

    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
  }
});

module.exports = router;