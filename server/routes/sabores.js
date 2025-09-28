const express = require('express');
const router = express.Router();
const Sabor = require('../models/Sabor');

// GET /api/sabores - Listar todos os sabores
router.get('/', async (req, res) => {
  try {
    const sabores = await Sabor.find({ ativo: true }).sort({ nome: 1 });
    res.json(sabores);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sabores', error: error.message });
  }
});

// GET /api/sabores/:id - Buscar sabor por ID
router.get('/:id', async (req, res) => {
  try {
    const sabor = await Sabor.findById(req.params.id);
    if (!sabor) {
      return res.status(404).json({ message: 'Sabor não encontrado' });
    }
    res.json(sabor);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sabor', error: error.message });
  }
});

// POST /api/sabores - Criar novo sabor
router.post('/', async (req, res) => {
  try {
    const sabor = new Sabor(req.body);
    const novoSabor = await sabor.save();
    res.status(201).json(novoSabor);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar sabor', error: error.message });
  }
});

// PUT /api/sabores/:id - Atualizar sabor
router.put('/:id', async (req, res) => {
  try {
    const sabor = await Sabor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!sabor) {
      return res.status(404).json({ message: 'Sabor não encontrado' });
    }
    res.json(sabor);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar sabor', error: error.message });
  }
});

// DELETE /api/sabores/:id - Deletar sabor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const sabor = await Sabor.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!sabor) {
      return res.status(404).json({ message: 'Sabor não encontrado' });
    }
    res.json({ message: 'Sabor removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover sabor', error: error.message });
  }
});

// GET /api/sabores/categoria/:categoria - Buscar sabores por categoria
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const sabores = await Sabor.find({ 
      categoria: req.params.categoria,
      ativo: true 
    }).sort({ nome: 1 });
    res.json(sabores);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sabores por categoria', error: error.message });
  }
});

module.exports = router;