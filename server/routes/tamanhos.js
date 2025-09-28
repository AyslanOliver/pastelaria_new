const express = require('express');
const router = express.Router();
const Tamanho = require('../models/Tamanho');

// GET /api/tamanhos - Listar todos os tamanhos
router.get('/', async (req, res) => {
  try {
    const tamanhos = await Tamanho.find({ ativo: true }).sort({ ordem: 1, nome: 1 });
    res.json(tamanhos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tamanhos', error: error.message });
  }
});

// GET /api/tamanhos/:id - Buscar tamanho por ID
router.get('/:id', async (req, res) => {
  try {
    const tamanho = await Tamanho.findById(req.params.id);
    if (!tamanho) {
      return res.status(404).json({ message: 'Tamanho não encontrado' });
    }
    res.json(tamanho);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tamanho', error: error.message });
  }
});

// POST /api/tamanhos - Criar novo tamanho
router.post('/', async (req, res) => {
  try {
    const tamanho = new Tamanho(req.body);
    const novoTamanho = await tamanho.save();
    res.status(201).json(novoTamanho);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar tamanho', error: error.message });
  }
});

// PUT /api/tamanhos/:id - Atualizar tamanho
router.put('/:id', async (req, res) => {
  try {
    const tamanho = await Tamanho.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tamanho) {
      return res.status(404).json({ message: 'Tamanho não encontrado' });
    }
    res.json(tamanho);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar tamanho', error: error.message });
  }
});

// DELETE /api/tamanhos/:id - Deletar tamanho (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const tamanho = await Tamanho.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!tamanho) {
      return res.status(404).json({ message: 'Tamanho não encontrado' });
    }
    res.json({ message: 'Tamanho removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover tamanho', error: error.message });
  }
});

module.exports = router;