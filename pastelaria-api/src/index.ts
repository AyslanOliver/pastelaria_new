/**
 * API da Pastelaria para Cloudflare Workers
 * Adaptada do servidor Express.js original
 */

// Interfaces para tipagem
interface Env {
  MONGODB_URI: string;
}

interface IProduto {
  _id?: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao?: string;
  ativo: boolean;
  imagem?: string;
}

interface ISabor {
  _id?: string;
  nome: string;
  categoria: string;
  ativo: boolean;
}

interface ITamanho {
  _id?: string;
  nome: string;
  tamanho: string;
  preco: number;
  ativo: boolean;
}

interface IPedido {
  _id?: string;
  numero: number;
  cliente: string;
  telefone: string;
  endereco: string;
  itens: Array<{
    produto: string;
    sabor: string;
    tamanho: string;
    quantidade: number;
    preco: number;
  }>;
  total: number;
  status: string;
  dataPedido: Date;
}

// Classe para gerenciar conexão com MongoDB via fetch
class MongoDBClient {
  private baseUrl: string;
  private database: string;
  
  constructor(mongoUri: string) {
    // Extrair informações da URI do MongoDB
    const url = new URL(mongoUri);
    this.database = url.pathname.substring(1); // Remove a barra inicial
    this.baseUrl = `${url.protocol}//${url.host}`;
  }

  async find(collection: string, filter: any = {}) {
    // Dados mock para demonstração
    const mockData = {
      produtos: [
        { _id: '4', nome: 'Pizza Tradicional', categoria: 'Pizza', preco: 25.00, descricao: 'Pizza tradicional com massa artesanal', ativo: true },
        { _id: '5', nome: 'Pizza Premium', categoria: 'Pizza', preco: 35.00, descricao: 'Pizza premium com ingredientes especiais', ativo: true },
        { _id: '6', nome: 'Pizza Doce', categoria: 'Pizza', preco: 28.00, descricao: 'Pizza doce para sobremesa', ativo: true }
      ],
      sabores: [
        { _id: '1', nome: 'Carne', categoria: 'Salgado', ativo: true },
        { _id: '2', nome: 'Queijo', categoria: 'Salgado', ativo: true },
        { _id: '3', nome: 'Frango', categoria: 'Salgado', ativo: true },
        { _id: '4', nome: 'Chocolate', categoria: 'Doce', ativo: true },
        { _id: '5', nome: 'Margherita', categoria: 'Salgado', ativo: true },
        { _id: '6', nome: 'Pepperoni', categoria: 'Salgado', ativo: true },
        { _id: '7', nome: 'Calabresa', categoria: 'Salgado', ativo: true },
        { _id: '8', nome: 'Portuguesa', categoria: 'Salgado', ativo: true },
        { _id: '9', nome: 'Quatro Queijos', categoria: 'Salgado', ativo: true },
        { _id: '10', nome: 'Frango com Catupiry', categoria: 'Salgado', ativo: true },
        { _id: '11', nome: 'Brigadeiro', categoria: 'Doce', ativo: true },
        { _id: '12', nome: 'Banana com Canela', categoria: 'Doce', ativo: true }
      ],
      tamanhos: [
        { _id: '4', nome: 'Pizza Pequena', tamanho: 'P', preco: 0, ativo: true, categoria: 'Pizza' },
        { _id: '5', nome: 'Pizza Média', tamanho: 'M', preco: 5.00, ativo: true, categoria: 'Pizza' },
        { _id: '6', nome: 'Pizza Grande', tamanho: 'G', preco: 10.00, ativo: true, categoria: 'Pizza' },
        { _id: '7', nome: 'Pizza Família', tamanho: 'GG', preco: 15.00, ativo: true, categoria: 'Pizza' }
      ],
      pedidos: [
        { 
          _id: '1', 
          numero: 1001, 
          cliente: { nome: 'João Silva', telefone: '(11) 99999-9999' },
          telefone: '(11) 99999-9999', 
          endereco: 'Rua das Flores, 123',
          itens: [
            { produto: 'Pizza Tradicional', sabor: 'Margherita', tamanho: 'Pizza Média', quantidade: 1, preco: 30.00 }
          ],
          total: 32.00,
          status: 'Pendente',
          dataPedido: new Date(),
          createdAt: new Date(),
          formaPagamento: 'PIX',
          taxaDelivery: 2.00
        },
        { 
          _id: '2', 
          numero: 1002, 
          cliente: { nome: 'Maria Santos', telefone: '(11) 88888-8888' },
          telefone: '(11) 88888-8888', 
          endereco: 'Av. Paulista, 456',
          itens: [
            { produto: 'Pizza Premium', sabor: 'Quatro Queijos', tamanho: 'Pizza Grande', quantidade: 1, preco: 45.00 },
            { produto: 'Pizza Doce', sabor: 'Brigadeiro', tamanho: 'Pizza Pequena', quantidade: 1, preco: 28.00 }
          ],
          total: 75.00,
          status: 'Preparando',
          dataPedido: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          formaPagamento: 'Dinheiro',
          taxaDelivery: 2.00
        },
        { 
          _id: '3', 
          numero: 1003, 
          cliente: { nome: 'Carlos Oliveira', telefone: '(11) 77777-7777' },
          telefone: '(11) 77777-7777', 
          endereco: 'Rua Augusta, 789',
          itens: [
            { produto: 'Pizza Tradicional', sabor: 'Calabresa', tamanho: 'Pizza Família', quantidade: 1, preco: 40.00 }
          ],
          total: 42.00,
          status: 'Pronto',
          dataPedido: new Date(Date.now() - 45 * 60 * 1000), // 45 minutos atrás
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          formaPagamento: 'Cartão',
          taxaDelivery: 2.00
        },
        { 
          _id: '4', 
          numero: 1004, 
          cliente: { nome: 'Ana Costa', telefone: '(11) 66666-6666' },
          telefone: '(11) 66666-6666', 
          endereco: 'Rua da Consolação, 321',
          itens: [
            { produto: 'Pizza Premium', sabor: 'Portuguesa', tamanho: 'Pizza Média', quantidade: 2, preco: 35.00 }
          ],
          total: 72.00,
          status: 'Entregue',
          dataPedido: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          formaPagamento: 'PIX',
          taxaDelivery: 2.00
        },
        { 
          _id: '5', 
          numero: 1005, 
          cliente: { nome: 'Pedro Lima', telefone: '(11) 55555-5555' },
          telefone: '(11) 55555-5555', 
          endereco: 'Rua Oscar Freire, 654',
          itens: [
            { produto: 'Pizza Doce', sabor: 'Banana com Canela', tamanho: 'Pizza Grande', quantidade: 1, preco: 38.00 }
          ],
          total: 40.00,
          status: 'Cancelado',
          dataPedido: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          formaPagamento: 'Dinheiro',
          taxaDelivery: 2.00
        },
        { 
          _id: '6', 
          numero: 1006, 
          cliente: { nome: 'Lucia Ferreira', telefone: '(11) 44444-4444' },
          telefone: '(11) 44444-4444', 
          endereco: 'Rua Haddock Lobo, 987',
          itens: [
            { produto: 'Pizza Tradicional', sabor: 'Pepperoni', tamanho: 'Pizza Média', quantidade: 1, preco: 30.00 },
            { produto: 'Pizza Premium', sabor: 'Frango com Catupiry', tamanho: 'Pizza Pequena', quantidade: 1, preco: 35.00 }
          ],
          total: 67.00,
          status: 'Pendente',
          dataPedido: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          formaPagamento: 'PIX',
          taxaDelivery: 2.00
        }
      ]
    };
    
    return mockData[collection as keyof typeof mockData] || [];
  }

  async findById(collection: string, id: string) {
    const items = await this.find(collection);
    return items.find((item: any) => item._id === id) || null;
  }

  async insertOne(collection: string, document: any) {
    const newId = Date.now().toString();
    return { _id: newId, ...document };
  }

  async updateOne(collection: string, id: string, update: any) {
    return { ...update, _id: id };
  }

  async deleteOne(collection: string, id: string) {
    return { deletedCount: 1 };
  }
}

let mongoClient: MongoDBClient;

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
  async fetch(request: Request, env: Env): Promise<Response> {
    // Tratar OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Roteamento
      if (path === '/api/test') {
        return corsResponse({ 
          message: 'API da Pastelaria funcionando!', 
          timestamp: new Date().toISOString(),
          environment: 'Cloudflare Workers',
          mongoConfigured: !!env.MONGODB_URI
        });
      }

      // Inicializar cliente MongoDB (sempre funciona com dados mock)
      if (!mongoClient) {
        mongoClient = new MongoDBClient(env.MONGODB_URI || 'mock://localhost/pastelaria');
      }

      if (path.startsWith('/api/produtos')) {
        return handleProdutos(request, path, method, mongoClient);
      }

      if (path.startsWith('/api/sabores')) {
        return handleSabores(request, path, method, mongoClient);
      }

      if (path.startsWith('/api/tamanhos')) {
        return handleTamanhos(request, path, method, mongoClient);
      }

      if (path.startsWith('/api/pedidos')) {
        return handlePedidos(request, path, method, mongoClient);
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
};

// Handlers para cada recurso
async function handleProdutos(request: Request, path: string, method: string, client: MongoDBClient): Promise<Response> {
  try {
    const segments = path.split('/');
    const id = segments[3]; // /api/produtos/{id}

    switch (method) {
      case 'GET':
        if (id) {
          // Buscar produto por ID
          const produto = await client.findById('produtos', id);
          if (!produto) {
            return corsResponse({ error: 'Produto não encontrado' }, 404);
          }
          return corsResponse(produto);
        } else {
          // Listar todos os produtos
          const produtos = await client.find('produtos');
          return corsResponse(produtos);
        }

      case 'POST':
        // Criar novo produto
        const body = await request.json() as Partial<IProduto>;
        const novoProduto = await client.insertOne('produtos', {
          ...body,
          ativo: body.ativo !== undefined ? body.ativo : true,
        });
        return corsResponse(novoProduto, 201);

      case 'PUT':
        if (!id) {
          return corsResponse({ error: 'ID do produto é obrigatório' }, 400);
        }
        // Atualizar produto
        const updateBody = await request.json() as Partial<IProduto>;
        const produtoAtualizado = await client.updateOne('produtos', id, updateBody);
        return corsResponse(produtoAtualizado);

      case 'DELETE':
        if (!id) {
          return corsResponse({ error: 'ID do produto é obrigatório' }, 400);
        }
        // Deletar produto
        await client.deleteOne('produtos', id);
        return corsResponse({ message: 'Produto deletado com sucesso' });

      default:
        return corsResponse({ error: 'Método não permitido' }, 405);
    }
  } catch (error) {
    console.error('Erro em handleProdutos:', error);
    return corsResponse({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
}

async function handleSabores(request: Request, path: string, method: string, client: MongoDBClient): Promise<Response> {
  try {
    const segments = path.split('/');
    const id = segments[3]; // /api/sabores/{id}

    switch (method) {
      case 'GET':
        if (id) {
          // Buscar sabor por ID
          const sabor = await client.findById('sabores', id);
          if (!sabor) {
            return corsResponse({ error: 'Sabor não encontrado' }, 404);
          }
          return corsResponse(sabor);
        } else {
          // Listar todos os sabores
          const sabores = await client.find('sabores');
          return corsResponse(sabores);
        }

      case 'POST':
        // Criar novo sabor
        const body = await request.json() as Partial<ISabor>;
        const novoSabor = await client.insertOne('sabores', {
          ...body,
          ativo: body.ativo !== undefined ? body.ativo : true,
        });
        return corsResponse(novoSabor, 201);

      case 'PUT':
        if (!id) {
          return corsResponse({ error: 'ID do sabor é obrigatório' }, 400);
        }
        // Atualizar sabor
        const updateBody = await request.json() as Partial<ISabor>;
        const saborAtualizado = await client.updateOne('sabores', id, updateBody);
        return corsResponse(saborAtualizado);

      case 'DELETE':
        if (!id) {
          return corsResponse({ error: 'ID do sabor é obrigatório' }, 400);
        }
        // Deletar sabor
        await client.deleteOne('sabores', id);
        return corsResponse({ message: 'Sabor deletado com sucesso' });

      default:
        return corsResponse({ error: 'Método não permitido' }, 405);
    }
  } catch (error) {
    console.error('Erro em handleSabores:', error);
    return corsResponse({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
}

async function handleTamanhos(request: Request, path: string, method: string, client: MongoDBClient): Promise<Response> {
  try {
    const segments = path.split('/');
    const id = segments[3]; // /api/tamanhos/{id}

    switch (method) {
      case 'GET':
        if (id) {
          // Buscar tamanho por ID
          const tamanho = await client.findById('tamanhos', id);
          if (!tamanho) {
            return corsResponse({ error: 'Tamanho não encontrado' }, 404);
          }
          return corsResponse(tamanho);
        } else {
          // Listar todos os tamanhos
          const tamanhos = await client.find('tamanhos');
          return corsResponse(tamanhos);
        }

      case 'POST':
        // Criar novo tamanho
        const body = await request.json() as Partial<ITamanho>;
        const novoTamanho = await client.insertOne('tamanhos', {
          ...body,
          ativo: body.ativo !== undefined ? body.ativo : true,
        });
        return corsResponse(novoTamanho, 201);

      case 'PUT':
        if (!id) {
          return corsResponse({ error: 'ID do tamanho é obrigatório' }, 400);
        }
        // Atualizar tamanho
        const updateBody = await request.json() as Partial<ITamanho>;
        const tamanhoAtualizado = await client.updateOne('tamanhos', id, updateBody);
        return corsResponse(tamanhoAtualizado);

      case 'DELETE':
        if (!id) {
          return corsResponse({ error: 'ID do tamanho é obrigatório' }, 400);
        }
        // Deletar tamanho
        await client.deleteOne('tamanhos', id);
        return corsResponse({ message: 'Tamanho deletado com sucesso' });

      default:
        return corsResponse({ error: 'Método não permitido' }, 405);
    }
  } catch (error) {
    console.error('Erro em handleTamanhos:', error);
    return corsResponse({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
}

async function handlePedidos(request: Request, path: string, method: string, client: MongoDBClient): Promise<Response> {
  try {
    const segments = path.split('/');
    const id = segments[3]; // /api/pedidos/{id}

    switch (method) {
      case 'GET':
        if (id) {
          // Buscar pedido por ID
          const pedido = await client.findById('pedidos', id);
          if (!pedido) {
            return corsResponse({ error: 'Pedido não encontrado' }, 404);
          }
          return corsResponse(pedido);
        } else {
          // Listar todos os pedidos
          const pedidos = await client.find('pedidos');
          return corsResponse(pedidos);
        }

      case 'POST':
        // Criar novo pedido
        const body = await request.json() as Partial<IPedido>;
        const numeroGerado = Date.now();
        const novoPedido = await client.insertOne('pedidos', {
          ...body,
          numero: numeroGerado, // Número sequencial simples
          numeroPedido: numeroGerado, // Compatibilidade com frontend
          dataPedido: new Date(),
          status: body.status || 'pendente',
        });
        return corsResponse(novoPedido, 201);

      case 'PUT':
        if (!id) {
          return corsResponse({ error: 'ID do pedido é obrigatório' }, 400);
        }
        // Verificar se é uma atualização de status específica
        const url = new URL(request.url);
        if (url.pathname.includes('/status')) {
          // Atualizar apenas o status do pedido
          const { status } = await request.json() as { status: string };
          const pedidoAtualizado = await client.updateOne('pedidos', id, { status });
          return corsResponse(pedidoAtualizado);
        } else {
          // Atualizar pedido completo
          const updateBody = await request.json() as Partial<IPedido>;
          const pedidoAtualizado = await client.updateOne('pedidos', id, updateBody);
          return corsResponse(pedidoAtualizado);
        }

      case 'DELETE':
        if (!id) {
          return corsResponse({ error: 'ID do pedido é obrigatório' }, 400);
        }
        // Deletar pedido
        await client.deleteOne('pedidos', id);
        return corsResponse({ message: 'Pedido deletado com sucesso' });

      default:
        return corsResponse({ error: 'Método não permitido' }, 405);
    }
  } catch (error) {
    console.error('Erro em handlePedidos:', error);
    return corsResponse({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, 500);
  }
}
