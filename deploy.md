# 🚀 Guia de Deploy - Pastelaria API Cloudflare

## 📋 Pré-requisitos

### 1. **Conta Cloudflare**
- Criar conta gratuita em [cloudflare.com](https://cloudflare.com)
- Verificar email e configurar 2FA (recomendado)

### 2. **Instalar Wrangler CLI**
```bash
# Instalar globalmente
npm install -g wrangler

# Verificar instalação
wrangler --version
```

### 3. **Fazer Login na Cloudflare**
```bash
# Login interativo
wrangler login

# Ou usar API Token (mais seguro para CI/CD)
wrangler auth login
```

## 🗄️ Configuração do Banco de Dados D1

### 1. **Criar Banco de Dados**
```bash
# Navegar para o diretório do projeto
cd e:\pastelaria_new

# Criar banco D1
wrangler d1 create pastelaria-db
```

**Importante:** Copie o `database_id` retornado e atualize o `wrangler.toml`

### 2. **Atualizar wrangler.toml**
```toml
# Substituir os IDs pelos valores reais
[[d1_databases]]
binding = "DB"
database_name = "pastelaria-db"
database_id = "SEU_DATABASE_ID_AQUI"  # ← Substituir
```

### 3. **Executar Schema**
```bash
# Aplicar schema ao banco
wrangler d1 execute pastelaria-db --file=./cloudflare/schema.sql

# Verificar se foi criado
wrangler d1 execute pastelaria-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 4. **Inserir Dados de Exemplo (Opcional)**
```bash
# Inserir dados de seed
wrangler d1 execute pastelaria-db --file=./cloudflare/seed.sql

# Verificar dados
wrangler d1 execute pastelaria-db --command="SELECT COUNT(*) FROM produtos;"
```

## 🔐 Configuração de Variáveis de Ambiente

### 1. **Definir Secrets**
```bash
# JWT Secret (gerar uma chave forte)
wrangler secret put JWT_SECRET
# Quando solicitado, inserir: minha-chave-jwt-super-secreta-123456

# Senha do Admin
wrangler secret put ADMIN_PASSWORD  
# Quando solicitado, inserir: admin123

# Opcional: Chave para APIs externas
wrangler secret put API_KEY
```

### 2. **Verificar Secrets**
```bash
# Listar secrets configurados
wrangler secret list
```

## 📦 Instalação de Dependências

### 1. **Instalar Pacotes**
```bash
# Usar o package.json do Cloudflare
cp cloudflare-package.json package.json

# Instalar dependências
npm install
```

### 2. **Verificar Dependências**
```bash
# Verificar se tudo está instalado
npm list --depth=0
```

## 🧪 Teste Local

### 1. **Executar em Desenvolvimento**
```bash
# Iniciar servidor local
npm run dev

# Ou usando wrangler diretamente
wrangler dev --local
```

### 2. **Testar Endpoints**
```bash
# Health check
curl http://localhost:8787/api/v1/health

# Listar produtos
curl http://localhost:8787/api/v1/produtos

# Login (para testar autenticação)
curl -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. **Testar com Dados Móveis**
```bash
# Simular dispositivo móvel
curl http://localhost:8787/api/v1/produtos \
  -H "X-Device-Type: mobile" \
  -H "X-Connection-Type: 4g" \
  -H "X-App-Version: 1.0.0"
```

## 🌐 Deploy para Staging

### 1. **Deploy de Desenvolvimento**
```bash
# Deploy para ambiente de staging
npm run deploy:staging

# Ou usando wrangler
wrangler deploy --env staging
```

### 2. **Testar Staging**
```bash
# Substituir YOUR_SUBDOMAIN pelo seu subdomínio
curl https://pastelaria-staging.YOUR_SUBDOMAIN.workers.dev/api/v1/health
```

### 3. **Verificar Logs**
```bash
# Ver logs em tempo real
wrangler tail --env staging
```

## 🚀 Deploy para Produção

### 1. **Deploy Final**
```bash
# Deploy para produção
npm run deploy:production

# Ou usando wrangler
wrangler deploy --env production
```

### 2. **Configurar Domínio Customizado (Opcional)**
```bash
# Adicionar rota customizada
wrangler route add "api.meusite.com/*" pastelaria-api-production
```

### 3. **Verificar Deploy**
```bash
# Testar produção
curl https://pastelaria-api.YOUR_SUBDOMAIN.workers.dev/api/v1/health

# Verificar performance
curl -w "@curl-format.txt" https://pastelaria-api.YOUR_SUBDOMAIN.workers.dev/api/v1/produtos
```

## 📊 Monitoramento e Manutenção

### 1. **Verificar Métricas**
- Acessar [Cloudflare Dashboard](https://dash.cloudflare.com)
- Ir para Workers & Pages > Seu Worker
- Verificar métricas de requests, latência e erros

### 2. **Backup do Banco**
```bash
# Fazer backup regular
npm run db:backup

# Ou manualmente
wrangler d1 execute pastelaria-db --command=".backup backup-$(date +%Y%m%d).db"
```

### 3. **Logs e Debugging**
```bash
# Ver logs em tempo real
npm run logs

# Ver logs de produção
npm run logs:production

# Debug específico
wrangler tail --format=pretty --env production
```

## 🔧 Troubleshooting

### **Erro: "Database not found"**
```bash
# Verificar se o banco existe
wrangler d1 list

# Recriar se necessário
wrangler d1 create pastelaria-db
```

### **Erro: "Authentication failed"**
```bash
# Refazer login
wrangler logout
wrangler login
```

### **Erro: "Module not found"**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### **Erro: "CORS blocked"**
```bash
# Verificar se o CORS está configurado
curl -H "Origin: https://meuapp.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://sua-api.workers.dev/api/v1/produtos
```

### **Performance Lenta**
```bash
# Verificar região do Worker
wrangler whoami

# Limpar cache se necessário
curl -X POST https://sua-api.workers.dev/api/v1/admin/clear-cache \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📱 Integração com App Android

### 1. **Configurar Base URL**
```kotlin
// No seu app Android
const val BASE_URL = "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev"
```

### 2. **Headers Recomendados**
```kotlin
val headers = mapOf(
    "Content-Type" to "application/json",
    "X-Device-Type" to "mobile",
    "X-Connection-Type" to getConnectionType(), // wifi, 4g, 3g, 2g
    "X-App-Version" to BuildConfig.VERSION_NAME,
    "User-Agent" to "PastelariaMobile/1.0 Android"
)
```

### 3. **Implementar Cache Local**
```kotlin
// Use Room Database para cache offline
@Entity(tableName = "produtos_cache")
data class ProdutoCache(
    @PrimaryKey val id: String,
    val data: String, // JSON do produto
    val lastSync: Long,
    val expiresAt: Long
)
```

### 4. **Sincronização Offline**
```kotlin
// Implementar fila de operações offline
class OfflineQueue {
    suspend fun addOperation(operation: OfflineOperation) {
        // Salvar operação localmente
    }
    
    suspend fun syncWhenOnline() {
        // Enviar para /api/v1/sync/upload
    }
}
```

## 🔄 Atualizações e Versionamento

### 1. **Atualizar Código**
```bash
# Fazer alterações no código
# Testar localmente
npm run dev

# Deploy para staging
npm run deploy:staging

# Testar staging
# Deploy para produção
npm run deploy:production
```

### 2. **Migração de Schema**
```bash
# Criar arquivo de migração
echo "ALTER TABLE produtos ADD COLUMN nova_coluna TEXT;" > migration-001.sql

# Aplicar migração
wrangler d1 execute pastelaria-db --file=migration-001.sql
```

### 3. **Rollback (se necessário)**
```bash
# Fazer rollback para versão anterior
wrangler rollback --env production

# Ou deploy de versão específica
git checkout v1.0.0
npm run deploy:production
```

## 📈 Otimizações de Performance

### 1. **Cache Strategy**
- Produtos: 10-30 minutos
- Sabores/Tamanhos: 30-60 minutos  
- Pedidos: 2-5 minutos
- Estatísticas: 5-10 minutos

### 2. **Compressão**
- Responses > 1KB são comprimidas automaticamente
- Imagens otimizadas por dispositivo
- JSON minificado em produção

### 3. **Rate Limiting**
- 1000 req/hora para WiFi
- 500 req/hora para 4G
- 200 req/hora para 3G
- 100 req/hora para 2G

## 🎯 Próximos Passos

1. **Monitoramento Avançado**
   - Configurar alertas no Cloudflare
   - Implementar métricas customizadas
   - Configurar logs estruturados

2. **Segurança**
   - Implementar WAF rules
   - Configurar DDoS protection
   - Adicionar rate limiting por IP

3. **Performance**
   - Implementar CDN para imagens
   - Otimizar queries do banco
   - Adicionar cache de segundo nível

4. **Features**
   - WebSockets para updates em tempo real
   - Push notifications
   - Analytics avançados
   - Multi-tenancy

---

**🎉 Parabéns! Sua API está rodando na Cloudflare com otimizações para dispositivos móveis Android!**

Para suporte, consulte:
- [Documentação Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentação D1](https://developers.cloudflare.com/d1/)
- [README-CLOUDFLARE.md](./README-CLOUDFLARE.md) para detalhes técnicos