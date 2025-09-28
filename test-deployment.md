# 🧪 Guia de Testes - Pastelaria API Cloudflare

## 🎯 Visão Geral dos Testes

Este guia fornece uma estratégia completa de testes para validar o funcionamento da API da Pastelaria otimizada para dispositivos móveis.

## 📋 Checklist de Testes

### ✅ **1. Testes de Infraestrutura**

#### **1.1 Cloudflare D1 Database**
```bash
# Verificar se o banco foi criado
wrangler d1 list

# Testar conexão com o banco
wrangler d1 execute pastelaria-db --command "SELECT 1 as test"

# Verificar tabelas criadas
wrangler d1 execute pastelaria-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Verificar dados de exemplo
wrangler d1 execute pastelaria-db --command "SELECT COUNT(*) as total_produtos FROM produtos"
```

#### **1.2 Cloudflare Workers**
```bash
# Deploy local para testes
wrangler dev

# Deploy para staging
wrangler deploy --env staging

# Deploy para produção
wrangler deploy --env production
```

### ✅ **2. Testes de API Endpoints**

#### **2.1 Health Check**
```bash
# Teste básico de conectividade
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/health" \
  -H "Content-Type: application/json"

# Resposta esperada:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "timestamp": "2024-01-15T10:30:00Z",
#     "version": "1.0.0",
#     "database": "connected"
#   }
# }
```

#### **2.2 Produtos API**
```bash
# Listar produtos
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "X-Device-Type: mobile" \
  -H "X-Connection-Type: wifi"

# Buscar produto específico
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos/1" \
  -H "Content-Type: application/json"

# Criar novo produto (requer autenticação)
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "Pastel de Teste",
    "categoria": "doce",
    "preco": 8.50,
    "descricao": "Produto para teste",
    "ativo": true
  }'

# Atualizar produto
curl -X PUT "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "Pastel Atualizado",
    "preco": 9.00
  }'

# Deletar produto
curl -X DELETE "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos/1" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

#### **2.3 Sabores API**
```bash
# Listar sabores
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sabores" \
  -H "Content-Type: application/json"

# Listar categorias de sabores
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sabores/categorias" \
  -H "Content-Type: application/json"

# Criar sabor
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sabores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "Chocolate Teste",
    "categoria": "doce",
    "ativo": true,
    "preco_adicional": 1.50
  }'
```

#### **2.4 Tamanhos API**
```bash
# Listar tamanhos
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/tamanhos" \
  -H "Content-Type: application/json"

# Calcular preço
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/tamanhos/calcular-preco" \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": "1",
    "tamanho_id": "1",
    "sabores": ["1", "2"],
    "quantidade": 2
  }'
```

#### **2.5 Pedidos API**
```bash
# Listar pedidos
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"

# Criar pedido
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "cliente_nome": "João Teste",
    "cliente_telefone": "(11) 99999-9999",
    "itens": [
      {
        "produto_id": "1",
        "tamanho_id": "1",
        "quantidade": 2,
        "preco_unitario": 8.50,
        "sabores": ["1", "2"]
      }
    ],
    "observacoes": "Pedido de teste"
  }'

# Atualizar status do pedido
curl -X PUT "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/pedidos/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "status": "preparando"
  }'
```

#### **2.6 Sincronização API**
```bash
# Upload de dados offline
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sync/upload" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "operations": [
      {
        "type": "CREATE",
        "table": "produtos",
        "data": "{\"nome\":\"Produto Offline\",\"categoria\":\"salgado\",\"preco\":7.50}",
        "timestamp": 1642234567890
      }
    ]
  }'

# Download de dados atualizados
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sync/download?last_sync=1642234567890" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"

# Status de sincronização
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/sync/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### ✅ **3. Testes de Performance Mobile**

#### **3.1 Teste de Compressão**
```bash
# Testar resposta comprimida
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Accept-Encoding: gzip" \
  -H "X-Device-Type: mobile" \
  -H "X-Connection-Type: 2g" \
  --compressed -w "Size: %{size_download} bytes, Time: %{time_total}s\n"
```

#### **3.2 Teste de Cache**
```bash
# Primeira requisição (sem cache)
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "X-Device-Type: mobile" \
  -w "Time: %{time_total}s\n"

# Segunda requisição (com cache)
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "X-Device-Type: mobile" \
  -w "Time: %{time_total}s\n"
```

#### **3.3 Teste de Paginação**
```bash
# Testar diferentes tamanhos de página baseado na conexão
curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos?page=1&limit=5" \
  -H "X-Connection-Type: 2g"

curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos?page=1&limit=20" \
  -H "X-Connection-Type: wifi"
```

### ✅ **4. Testes de Segurança**

#### **4.1 Teste de CORS**
```bash
# Testar preflight request
curl -X OPTIONS "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Origin: https://meuapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

#### **4.2 Teste de Rate Limiting**
```bash
# Fazer múltiplas requisições rapidamente
for i in {1..10}; do
  curl -X GET "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
    -H "X-Forwarded-For: 192.168.1.100" \
    -w "Request $i: %{http_code}\n"
done
```

#### **4.3 Teste de Autenticação**
```bash
# Tentar acessar endpoint protegido sem token
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste"}' \
  -w "Status: %{http_code}\n"

# Tentar com token inválido
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_invalido" \
  -d '{"nome":"Teste"}' \
  -w "Status: %{http_code}\n"
```

### ✅ **5. Testes de Validação de Dados**

#### **5.1 Teste de Validação de Produto**
```bash
# Dados inválidos - nome vazio
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "",
    "categoria": "salgado",
    "preco": 8.50
  }' \
  -w "Status: %{http_code}\n"

# Dados inválidos - preço negativo
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "Produto Teste",
    "categoria": "salgado",
    "preco": -5.00
  }' \
  -w "Status: %{http_code}\n"

# Dados inválidos - categoria inexistente
curl -X POST "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "nome": "Produto Teste",
    "categoria": "categoria_inexistente",
    "preco": 8.50
  }' \
  -w "Status: %{http_code}\n"
```

### ✅ **6. Testes de Conectividade Mobile**

#### **6.1 Script de Teste Automatizado**
```bash
#!/bin/bash

# test-mobile-api.sh
API_BASE="https://pastelaria-api.SEU_SUBDOMAIN.workers.dev"
JWT_TOKEN="SEU_JWT_TOKEN_AQUI"

echo "🧪 Iniciando testes da API Mobile..."

# Teste 1: Health Check
echo "📊 Testando Health Check..."
HEALTH_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/health")
if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Health Check: OK"
else
    echo "❌ Health Check: FALHOU"
    echo "$HEALTH_RESPONSE"
fi

# Teste 2: Produtos (sem autenticação)
echo "📦 Testando listagem de produtos..."
PRODUTOS_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/produtos" \
    -H "X-Device-Type: mobile" \
    -H "X-Connection-Type: wifi")
if echo "$PRODUTOS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Listagem de produtos: OK"
else
    echo "❌ Listagem de produtos: FALHOU"
    echo "$PRODUTOS_RESPONSE"
fi

# Teste 3: Cache (segunda requisição deve ser mais rápida)
echo "🚀 Testando cache..."
START_TIME=$(date +%s%N)
curl -s -X GET "$API_BASE/api/v1/produtos" -H "X-Device-Type: mobile" > /dev/null
FIRST_TIME=$(($(date +%s%N) - START_TIME))

START_TIME=$(date +%s%N)
curl -s -X GET "$API_BASE/api/v1/produtos" -H "X-Device-Type: mobile" > /dev/null
SECOND_TIME=$(($(date +%s%N) - START_TIME))

if [ $SECOND_TIME -lt $FIRST_TIME ]; then
    echo "✅ Cache funcionando: Segunda requisição mais rápida"
else
    echo "⚠️  Cache: Não detectada melhoria significativa"
fi

# Teste 4: Diferentes tipos de conexão
echo "📶 Testando otimizações por tipo de conexão..."
for CONNECTION_TYPE in "2g" "3g" "4g" "wifi"; do
    RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/produtos?limit=5" \
        -H "X-Connection-Type: $CONNECTION_TYPE" \
        -w "Time: %{time_total}s")
    echo "  $CONNECTION_TYPE: $(echo "$RESPONSE" | tail -1)"
done

# Teste 5: CORS
echo "🌐 Testando CORS..."
CORS_RESPONSE=$(curl -s -X OPTIONS "$API_BASE/api/v1/produtos" \
    -H "Origin: https://meuapp.com" \
    -H "Access-Control-Request-Method: GET" \
    -I)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS: OK"
else
    echo "❌ CORS: FALHOU"
fi

# Teste 6: Autenticação (se token fornecido)
if [ ! -z "$JWT_TOKEN" ]; then
    echo "🔐 Testando autenticação..."
    AUTH_RESPONSE=$(curl -s -X GET "$API_BASE/api/v1/pedidos" \
        -H "Authorization: Bearer $JWT_TOKEN")
    if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Autenticação: OK"
    else
        echo "❌ Autenticação: FALHOU"
        echo "$AUTH_RESPONSE"
    fi
fi

echo "🎉 Testes concluídos!"
```

### ✅ **7. Testes de Carga**

#### **7.1 Teste com Apache Bench**
```bash
# Teste de carga básico
ab -n 100 -c 10 "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos"

# Teste com headers mobile
ab -n 100 -c 10 -H "X-Device-Type: mobile" -H "X-Connection-Type: wifi" \
   "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos"
```

#### **7.2 Teste com wrk**
```bash
# Instalar wrk (se não tiver)
# Ubuntu: sudo apt-get install wrk
# macOS: brew install wrk

# Teste de 30 segundos com 10 conexões
wrk -t10 -c10 -d30s --header "X-Device-Type: mobile" \
    "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/api/v1/produtos"
```

### ✅ **8. Monitoramento e Logs**

#### **8.1 Verificar Logs do Cloudflare**
```bash
# Ver logs em tempo real
wrangler tail

# Ver logs com filtros
wrangler tail --format pretty --status error
```

#### **8.2 Métricas de Performance**
```bash
# Verificar métricas no dashboard do Cloudflare
# https://dash.cloudflare.com/

# Ou usar a API do Cloudflare para métricas
curl -X GET "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/analytics/dashboard" \
  -H "Authorization: Bearer CF_API_TOKEN"
```

## 🎯 Critérios de Sucesso

### **✅ Funcionalidade**
- [ ] Todos os endpoints respondem corretamente
- [ ] Validação de dados funciona
- [ ] Autenticação e autorização funcionam
- [ ] CORS configurado corretamente

### **✅ Performance**
- [ ] Tempo de resposta < 200ms para requisições simples
- [ ] Cache reduz tempo de resposta em 50%+
- [ ] Compressão reduz tamanho da resposta em 60%+
- [ ] Paginação adapta-se ao tipo de conexão

### **✅ Segurança**
- [ ] Rate limiting funciona
- [ ] JWT tokens são validados
- [ ] Headers de segurança presentes
- [ ] Dados sensíveis não expostos

### **✅ Mobile**
- [ ] Respostas otimizadas por tipo de dispositivo
- [ ] Sincronização offline funciona
- [ ] Imagens otimizadas por conexão
- [ ] Payload mínimo para conexões lentas

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Erro 1001 - DNS Resolution Error**
```bash
# Verificar se o domínio está configurado
nslookup pastelaria-api.SEU_SUBDOMAIN.workers.dev

# Verificar configuração no Cloudflare Dashboard
```

#### **2. Erro 500 - Internal Server Error**
```bash
# Verificar logs
wrangler tail --status error

# Verificar variáveis de ambiente
wrangler secret list
```

#### **3. Erro 1015 - Rate Limited**
```bash
# Aguardar ou usar IP diferente
# Verificar configuração de rate limiting
```

#### **4. Database Connection Error**
```bash
# Verificar se o banco existe
wrangler d1 list

# Testar conexão
wrangler d1 execute pastelaria-db --command "SELECT 1"
```

## 📊 Relatório de Testes

### **Template de Relatório**
```markdown
# Relatório de Testes - Pastelaria API

**Data:** [DATA]
**Versão:** [VERSÃO]
**Ambiente:** [STAGING/PRODUCTION]

## Resumo Executivo
- ✅ Testes Passaram: X/Y
- ⚠️  Warnings: X
- ❌ Falhas: X

## Detalhes dos Testes

### Funcionalidade
- Health Check: ✅
- Produtos API: ✅
- Sabores API: ✅
- Tamanhos API: ✅
- Pedidos API: ✅
- Sync API: ✅

### Performance
- Tempo médio de resposta: Xms
- Cache hit rate: X%
- Compressão: X% redução

### Segurança
- CORS: ✅
- Rate Limiting: ✅
- Autenticação: ✅

### Mobile
- Otimização 2G: ✅
- Otimização 3G: ✅
- Otimização 4G: ✅
- Otimização WiFi: ✅

## Recomendações
[SUAS RECOMENDAÇÕES AQUI]
```

---

**🎉 Com este guia de testes, você pode validar completamente sua API antes de colocar em produção!**

Execute todos os testes sistematicamente e documente os resultados para garantir que sua aplicação funcione perfeitamente em dispositivos móveis.