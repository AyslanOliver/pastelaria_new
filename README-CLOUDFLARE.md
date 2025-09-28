# Pastelaria API - Cloudflare D1 & Workers

## 🚀 Migração para Cloudflare D1 - Otimizado para Dispositivos Móveis Android

Esta é uma versão completamente otimizada da API da Pastelaria, projetada especificamente para dispositivos móveis Android usando **Cloudflare D1** (banco de dados serverless) e **Cloudflare Workers**.

## 🎯 Principais Benefícios para Dispositivos Móveis

### ✅ **Sem Consumo de Armazenamento Local**
- Banco de dados 100% na nuvem (Cloudflare D1)
- Dados armazenados nos edge servers da Cloudflare
- Cache inteligente que se adapta à conectividade do dispositivo
- Sincronização automática quando online

### 🔒 **Segurança Avançada**
- Autenticação JWT com tokens seguros
- Validação rigorosa de dados de entrada
- Rate limiting para prevenir ataques
- Headers de segurança automáticos
- Criptografia end-to-end

### ⚡ **Performance Otimizada**
- Latência ultra-baixa (< 50ms globalmente)
- Cache inteligente baseado no tipo de conexão
- Compressão automática de dados
- Imagens otimizadas por dispositivo
- Sincronização offline-first

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   App Android   │───▶│ Cloudflare Edge  │───▶│  Cloudflare D1  │
│                 │    │    (Workers)     │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────┐
        └──────────────▶│  Cache Local     │
                        │  (Offline Mode)  │
                        └──────────────────┘
```

## 📱 Funcionalidades Específicas para Mobile

### 🔄 **Sincronização Offline**
- Funciona sem internet
- Sincronização automática quando conecta
- Resolução inteligente de conflitos
- Fila de operações offline

### 📊 **Cache Inteligente**
- Adapta-se ao tipo de conexão (WiFi, 4G, 3G, 2G)
- Cache agressivo em conexões lentas
- Invalidação automática de dados antigos
- Compressão de dados para economizar banda

### 🖼️ **Otimização de Imagens**
- Redimensionamento automático por dispositivo
- Compressão baseada na qualidade da conexão
- Formato WebP para dispositivos compatíveis
- Lazy loading inteligente

## 🛠️ Configuração e Deploy

### 1. **Pré-requisitos**
```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Fazer login na Cloudflare
wrangler login
```

### 2. **Configurar Banco de Dados**
```bash
# Criar banco D1
wrangler d1 create pastelaria-db

# Executar schema
wrangler d1 execute pastelaria-db --file=./cloudflare/schema.sql

# Inserir dados de exemplo
wrangler d1 execute pastelaria-db --file=./cloudflare/seed.sql
```

### 3. **Configurar Variáveis de Ambiente**
```bash
# Adicionar no wrangler.toml ou via dashboard
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
```

### 4. **Deploy**
```bash
# Instalar dependências
npm install

# Deploy para desenvolvimento
npm run deploy:staging

# Deploy para produção
npm run deploy:production
```

## 📡 Endpoints da API

### 🍕 **Produtos**
```http
GET    /api/v1/produtos              # Listar produtos (com paginação)
GET    /api/v1/produtos/:id          # Buscar produto específico
POST   /api/v1/produtos              # Criar produto
PUT    /api/v1/produtos/:id          # Atualizar produto
DELETE /api/v1/produtos/:id          # Remover produto (soft delete)
```

### 🎯 **Sabores**
```http
GET    /api/v1/sabores               # Listar sabores
GET    /api/v1/sabores/:id           # Buscar sabor específico
POST   /api/v1/sabores               # Criar sabor
PUT    /api/v1/sabores/:id           # Atualizar sabor
DELETE /api/v1/sabores/:id           # Remover sabor
```

### 📏 **Tamanhos**
```http
GET    /api/v1/tamanhos              # Listar tamanhos
GET    /api/v1/tamanhos/:id          # Buscar tamanho específico
POST   /api/v1/tamanhos              # Criar tamanho
PUT    /api/v1/tamanhos/:id          # Atualizar tamanho
DELETE /api/v1/tamanhos/:id          # Remover tamanho
```

### 📋 **Pedidos**
```http
GET    /api/v1/pedidos               # Listar pedidos
GET    /api/v1/pedidos/:id           # Buscar pedido específico
POST   /api/v1/pedidos               # Criar pedido
PUT    /api/v1/pedidos/:id           # Atualizar pedido
DELETE /api/v1/pedidos/:id           # Cancelar pedido
```

### 🔄 **Sincronização Offline**
```http
POST   /api/v1/sync/upload           # Upload de dados offline
GET    /api/v1/sync/download         # Download de dados atualizados
GET    /api/v1/sync/status           # Status de sincronização
POST   /api/v1/sync/resolve-conflict # Resolver conflitos
```

### 📊 **Estatísticas**
```http
GET    /api/v1/stats                 # Estatísticas do dashboard
GET    /api/v1/health                # Health check
```

## 🔧 Parâmetros de Consulta para Mobile

### **Paginação Otimizada**
```http
GET /api/v1/produtos?page=1&limit=20&device=mobile
```

### **Filtros Inteligentes**
```http
GET /api/v1/produtos?categoria=Pizza&ativo=true&search=margherita
```

### **Cache Control**
```http
GET /api/v1/produtos
Headers:
  X-Device-Type: mobile
  X-Connection-Type: 4g
  X-App-Version: 1.0.0
```

## 🔐 Autenticação

### **Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### **Usar Token**
```http
GET /api/v1/produtos
Authorization: Bearer <jwt-token>
```

## 📱 Integração com App Android

### **1. Configurar Base URL**
```kotlin
const val BASE_URL = "https://your-worker.your-subdomain.workers.dev"
```

### **2. Headers Recomendados**
```kotlin
val headers = mapOf(
    "Content-Type" to "application/json",
    "X-Device-Type" to "mobile",
    "X-Connection-Type" to getConnectionType(),
    "X-App-Version" to BuildConfig.VERSION_NAME
)
```

### **3. Implementar Cache Local**
```kotlin
// Use Room Database para cache local
// Sincronize com /api/v1/sync/download periodicamente
```

### **4. Modo Offline**
```kotlin
// Armazene operações em fila local
// Envie via /api/v1/sync/upload quando online
```

## 🚀 Otimizações Implementadas

### **Para Conexões Lentas (2G/3G)**
- Cache agressivo (30-60 minutos)
- Compressão de dados
- Imagens em baixa qualidade
- Limite de 100 itens por página

### **Para Conexões Rápidas (4G/WiFi)**
- Cache moderado (5-10 minutos)
- Imagens em alta qualidade
- Preload de dados relacionados
- Limite de 50 itens por página

### **Para Dispositivos com Pouca Memória**
- Paginação agressiva
- Limpeza automática de cache
- Compressão de responses
- Lazy loading de imagens

## 📊 Monitoramento

### **Métricas Disponíveis**
- Latência por região
- Taxa de cache hit/miss
- Uso de banda por dispositivo
- Erros de sincronização
- Performance por tipo de conexão

### **Logs**
```bash
# Ver logs em tempo real
npm run logs

# Ver logs de produção
npm run logs:production
```

## 🔧 Configurações Avançadas

### **Rate Limiting**
```javascript
// Configurável por tipo de conexão
const rateLimits = {
  wifi: 1000,    // requests/hour
  '4g': 500,     // requests/hour
  '3g': 200,     // requests/hour
  '2g': 100      // requests/hour
}
```

### **Cache TTL Dinâmico**
```javascript
// Baseado na conectividade
const cacheTTL = {
  wifi: 300,     // 5 minutos
  '4g': 600,     // 10 minutos
  '3g': 1800,    // 30 minutos
  '2g': 3600     // 1 hora
}
```

## 🆘 Troubleshooting

### **Problemas Comuns**

1. **Erro de CORS**
   - Verificar headers CORS no código
   - Confirmar origem permitida

2. **Cache não funciona**
   - Verificar headers de cache
   - Limpar cache: `POST /api/v1/admin/clear-cache`

3. **Sincronização falha**
   - Verificar conectividade
   - Verificar fila: `GET /api/v1/sync/status`

4. **Performance lenta**
   - Verificar região do Worker
   - Otimizar queries do banco
   - Verificar tamanho das responses

## 📈 Próximos Passos

- [ ] Implementar WebSockets para updates em tempo real
- [ ] Adicionar suporte a PWA
- [ ] Implementar analytics avançados
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Implementar notificações push
- [ ] Adicionar testes automatizados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para dispositivos móveis Android usando Cloudflare D1 & Workers**