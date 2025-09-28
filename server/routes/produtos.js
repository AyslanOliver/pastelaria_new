const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');

// GET /api/produtos - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.find({ ativo: true }).sort({ nome: 1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
  }
});

// GET /api/produtos/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produto', error: error.message });
  }
});

// POST /api/produtos - Criar novo produto
router.post('/', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    const novoProduto = await produto.save();
    res.status(201).json(novoProduto);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar produto', error: error.message });
  }
});

// PUT /api/produtos/:id - Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar produto', error: error.message });
  }
});

// DELETE /api/produtos/:id - Deletar produto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover produto', error: error.message });
  }
});

// GET /api/produtos/categoria/:categoria - Buscar produtos por categoria
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const produtos = await Produto.find({ 
      categoria: req.params.categoria,
      ativo: true 
    }).sort({ nome: 1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos por categoria', error: error.message });
  }
});

module.exports = router;