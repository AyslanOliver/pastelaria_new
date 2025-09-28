/**
 * API da Pastelaria para Cloudflare Workers
 * Adaptada do servidor Express.js original
 */

import { connect } from 'mongoose';
import { Produto, Sabor, Tamanho, Pedido, IProduto, ISabor, ITamanho, IPedido } from './models';

// Interfaces para tipagem
interface Env {
  MONGODB_URI: string;
}

// Função para conectar ao MongoDB
async function connectDB(mongoUri: string) {
  try {
    await connect(mongoUri);
    console.log('MongoDB conectado via Workers');
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error);
    throw error;
  }
}

// Função para configurar CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Função para resposta com CORS
function corsResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

// Handler principal
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Tratar OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Conectar ao MongoDB
      await connectDB(env.MONGODB_URI);

      // Roteamento da API
      if (path === '/api/test') {
        return corsResponse({
          message: 'API da Pastelaria funcionando no Cloudflare Workers!',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        });
      }

      // Rotas de Produtos
      if (path.startsWith('/api/produtos')) {
        return handleProdutos(request, path, method);
      }

      // Rotas de Sabores
      if (path.startsWith('/api/sabores')) {
        return handleSabores(request, path, method);
      }

      // Rotas de Tamanhos
      if (path.startsWith('/api/tamanhos')) {
        return handleTamanhos(request, path, method);
      }

      // Rotas de Pedidos
      if (path.startsWith('/api/pedidos')) {
        return handlePedidos(request, path, method);
      }

      // Rota não encontrada
      return corsResponse({ error: 'Rota não encontrada' }, 404);

    } catch (error) {
      console.error('Erro na API:', error);
      return corsResponse({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// Handlers para cada recurso
async function handleProdutos(request: Request, path: string, method: string): Promise<Response> {
  try {
    if (method === 'GET') {
      if (path === '/api/produtos') {
        // Listar todos os produtos
        const produtos = await Produto.find({ ativo: true }).sort({ nome: 1 });
        return corsResponse(produtos);
      }
      
      // Buscar produto por ID
      const id = path.split('/')[3];
      if (id) {
        const produto = await Produto.findById(id);
        if (!produto) {
          return corsResponse({ error: 'Produto não encontrado' }, 404);
        }
        return corsResponse(produto);
      }
    }

    if (method === 'POST') {
      const body = await request.json();
      const produto = new Produto(body);
      await produto.save();
      return corsResponse(produto, 201);
    }

    if (method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      const produto = await Produto.findByIdAndUpdate(id, body, { new: true });
      if (!produto) {
        return corsResponse({ error: 'Produto não encontrado' }, 404);
      }
      return corsResponse(produto);
    }

    if (method === 'DELETE') {
      const id = path.split('/')[3];
      const produto = await Produto.findByIdAndUpdate(id, { ativo: false }, { new: true });
      if (!produto) {
        return corsResponse({ error: 'Produto não encontrado' }, 404);
      }
      return corsResponse({ message: 'Produto desativado com sucesso' });
    }

    return corsResponse({ error: 'Método não permitido' }, 405);
  } catch (error) {
    console.error('Erro em produtos:', error);
    return corsResponse({ error: 'Erro interno do servidor' }, 500);
  }
}

async function handleSabores(request: Request, path: string, method: string): Promise<Response> {
  try {
    if (method === 'GET') {
      if (path === '/api/sabores') {
        const sabores = await Sabor.find({ ativo: true }).sort({ nome: 1 });
        return corsResponse(sabores);
      }
      
      const id = path.split('/')[3];
      if (id) {
        const sabor = await Sabor.findById(id);
        if (!sabor) {
          return corsResponse({ error: 'Sabor não encontrado' }, 404);
        }
        return corsResponse(sabor);
      }
    }

    if (method === 'POST') {
      const body = await request.json();
      const sabor = new Sabor(body);
      await sabor.save();
      return corsResponse(sabor, 201);
    }

    if (method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      const sabor = await Sabor.findByIdAndUpdate(id, body, { new: true });
      if (!sabor) {
        return corsResponse({ error: 'Sabor não encontrado' }, 404);
      }
      return corsResponse(sabor);
    }

    if (method === 'DELETE') {
      const id = path.split('/')[3];
      const sabor = await Sabor.findByIdAndUpdate(id, { ativo: false }, { new: true });
      if (!sabor) {
        return corsResponse({ error: 'Sabor não encontrado' }, 404);
      }
      return corsResponse({ message: 'Sabor desativado com sucesso' });
    }

    return corsResponse({ error: 'Método não permitido' }, 405);
  } catch (error) {
    console.error('Erro em sabores:', error);
    return corsResponse({ error: 'Erro interno do servidor' }, 500);
  }
}

async function handleTamanhos(request: Request, path: string, method: string): Promise<Response> {
  try {
    if (method === 'GET') {
      if (path === '/api/tamanhos') {
        const tamanhos = await Tamanho.find({ ativo: true }).sort({ nome: 1 });
        return corsResponse(tamanhos);
      }
      
      const id = path.split('/')[3];
      if (id) {
        const tamanho = await Tamanho.findById(id);
        if (!tamanho) {
          return corsResponse({ error: 'Tamanho não encontrado' }, 404);
        }
        return corsResponse(tamanho);
      }
    }

    if (method === 'POST') {
      const body = await request.json();
      const tamanho = new Tamanho(body);
      await tamanho.save();
      return corsResponse(tamanho, 201);
    }

    if (method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      const tamanho = await Tamanho.findByIdAndUpdate(id, body, { new: true });
      if (!tamanho) {
        return corsResponse({ error: 'Tamanho não encontrado' }, 404);
      }
      return corsResponse(tamanho);
    }

    if (method === 'DELETE') {
      const id = path.split('/')[3];
      const tamanho = await Tamanho.findByIdAndUpdate(id, { ativo: false }, { new: true });
      if (!tamanho) {
        return corsResponse({ error: 'Tamanho não encontrado' }, 404);
      }
      return corsResponse({ message: 'Tamanho desativado com sucesso' });
    }

    return corsResponse({ error: 'Método não permitido' }, 405);
  } catch (error) {
    console.error('Erro em tamanhos:', error);
    return corsResponse({ error: 'Erro interno do servidor' }, 500);
  }
}

async function handlePedidos(request: Request, path: string, method: string): Promise<Response> {
  try {
    if (method === 'GET') {
      if (path === '/api/pedidos') {
        const pedidos = await Pedido.find().sort({ createdAt: -1 }).limit(50);
        return corsResponse(pedidos);
      }
      
      const id = path.split('/')[3];
      if (id) {
        const pedido = await Pedido.findById(id);
        if (!pedido) {
          return corsResponse({ error: 'Pedido não encontrado' }, 404);
        }
        return corsResponse(pedido);
      }
    }

    if (method === 'POST') {
      const body = await request.json();
      const pedido = new Pedido(body);
      await pedido.save();
      return corsResponse(pedido, 201);
    }

    if (method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      const pedido = await Pedido.findByIdAndUpdate(id, body, { new: true });
      if (!pedido) {
        return corsResponse({ error: 'Pedido não encontrado' }, 404);
      }
      return corsResponse(pedido);
    }

    if (method === 'DELETE') {
      const id = path.split('/')[3];
      const pedido = await Pedido.findByIdAndUpdate(id, { status: 'Cancelado' }, { new: true });
      if (!pedido) {
        return corsResponse({ error: 'Pedido não encontrado' }, 404);
      }
      return corsResponse({ message: 'Pedido cancelado com sucesso' });
    }

    return corsResponse({ error: 'Método não permitido' }, 405);
  } catch (error) {
    console.error('Erro em pedidos:', error);
    return corsResponse({ error: 'Erro interno do servidor' }, 500);
  }
}
