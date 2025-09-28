# API da Pastelaria - Cloudflare Workers

Esta é a API da Pastelaria adaptada para rodar no Cloudflare Workers, proporcionando alta performance e disponibilidade global.

## 🚀 Configuração e Deploy

### 1. Pré-requisitos
- Node.js instalado
- Conta no Cloudflare
- Wrangler CLI instalado (`npm install -g wrangler`)

### 2. Configuração das Variáveis de Ambiente

#### 2.1 Fazer login no Cloudflare
```bash
wrangler login
```

#### 2.2 Configurar a string de conexão do MongoDB
```bash
wrangler secret put MONGODB_URI
```
Quando solicitado, cole sua string de conexão do MongoDB Atlas:
```
mongodb+srv://usuario:senha@cluster.mongodb.net/pastelaria?retryWrites=true&w=majority
```

### 3. Deploy da API

#### 3.1 Deploy para produção
```bash
npm run deploy
```

#### 3.2 Testar localmente (desenvolvimento)
```bash
npm run dev
```

### 4. Endpoints da API

A API estará disponível em: `https://pastelaria-api.SEU-USUARIO.workers.dev`

#### Produtos
- `GET /api/produtos` - Listar produtos ativos
- `GET /api/produtos/:id` - Buscar produto por ID
- `POST /api/produtos` - Criar novo produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Desativar produto

#### Sabores
- `GET /api/sabores` - Listar sabores ativos
- `GET /api/sabores/:id` - Buscar sabor por ID
- `POST /api/sabores` - Criar novo sabor
- `PUT /api/sabores/:id` - Atualizar sabor
- `DELETE /api/sabores/:id` - Desativar sabor

#### Tamanhos
- `GET /api/tamanhos` - Listar tamanhos ativos
- `GET /api/tamanhos/:id` - Buscar tamanho por ID
- `POST /api/tamanhos` - Criar novo tamanho
- `PUT /api/tamanhos/:id` - Atualizar tamanho
- `DELETE /api/tamanhos/:id` - Desativar tamanho

#### Pedidos
- `GET /api/pedidos` - Listar últimos 50 pedidos
- `GET /api/pedidos/:id` - Buscar pedido por ID
- `POST /api/pedidos` - Criar novo pedido
- `PUT /api/pedidos/:id` - Atualizar pedido
- `DELETE /api/pedidos/:id` - Cancelar pedido

#### Teste
- `GET /api/test` - Verificar se a API está funcionando

### 5. Estrutura do Projeto

```
pastelaria-api/
├── src/
│   ├── index.ts      # Handler principal da API
│   └── models.ts     # Modelos Mongoose
├── package.json      # Dependências
├── wrangler.jsonc    # Configuração do Cloudflare Workers
└── README.md         # Este arquivo
```

### 6. Recursos Implementados

✅ **CORS configurado** - Permite acesso de qualquer origem  
✅ **MongoDB Atlas** - Conexão com banco de dados na nuvem  
✅ **Operações CRUD** - Create, Read, Update, Delete para todos os recursos  
✅ **Validação de dados** - Usando schemas Mongoose  
✅ **Tratamento de erros** - Respostas padronizadas  
✅ **TypeScript** - Tipagem completa  
✅ **Auto-incremento** - Numeração automática de pedidos  

### 7. Vantagens do Cloudflare Workers

- 🌍 **Global**: Deploy em 200+ cidades mundialmente
- ⚡ **Rápido**: Latência ultra-baixa (< 10ms)
- 💰 **Gratuito**: 100.000 requests/dia no plano gratuito
- 🔒 **Seguro**: HTTPS nativo e proteção DDoS
- 📈 **Escalável**: Auto-scaling automático
- 🛠️ **Simples**: Deploy com um comando

### 8. Próximos Passos

Após o deploy bem-sucedido:

1. **Testar a API**: Acesse `https://sua-api.workers.dev/api/test`
2. **Atualizar o frontend**: Alterar `API_BASE_URL` no arquivo `api.js`
3. **Testar integração**: Verificar se o dashboard carrega os dados
4. **Gerar APK**: O app funcionará perfeitamente no mobile

### 9. Comandos Úteis

```bash
# Ver logs em tempo real
wrangler tail

# Listar Workers deployados
wrangler list

# Ver configurações
wrangler whoami

# Atualizar dependências
npm update
```

### 10. Troubleshooting

**Erro de conexão MongoDB:**
- Verifique se a string de conexão está correta
- Confirme se o IP está liberado no MongoDB Atlas
- Teste a conexão localmente primeiro

**Erro de CORS:**
- A API já está configurada para aceitar qualquer origem
- Verifique se está fazendo requests para a URL correta

**Erro de deploy:**
- Execute `wrangler login` novamente
- Verifique se tem permissões na conta Cloudflare
- Tente `wrangler whoami` para confirmar autenticação