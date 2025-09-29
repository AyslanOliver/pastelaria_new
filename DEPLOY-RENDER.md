# 🚀 Deploy da API no Render - Guia Completo

## 📋 Pré-requisitos
- Conta no GitHub
- Conta no Render (gratuita)
- Projeto já preparado (✅ Feito!)

## 🔧 Passo 1: Preparar o Repositório GitHub

### 1.1 Criar repositório no GitHub
1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `pastelaria-api`
4. Marque como "Public" (necessário para plano gratuito)
5. Clique em "Create repository"

### 1.2 Fazer upload do código
```bash
# No terminal, dentro da pasta server:
git init
git add .
git commit -m "Initial commit - Pastelaria API"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/pastelaria-api.git
git push -u origin main
```

## 🌐 Passo 2: Deploy no Render

### 2.1 Criar conta no Render
1. Acesse [render.com](https://render.com)
2. Clique em "Get Started for Free"
3. Faça login com sua conta GitHub

### 2.2 Criar Web Service
1. No dashboard, clique em "New +"
2. Selecione "Web Service"
3. Conecte seu repositório `pastelaria-api`
4. Clique em "Connect"

### 2.3 Configurar o serviço
**Configurações básicas:**
- **Name**: `pastelaria-api`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Root Directory**: deixe vazio
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plano:**
- Selecione "Free" (gratuito)

### 2.4 Configurar Variáveis de Ambiente
Na seção "Environment Variables", adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://ayslano37:Walkingtonn1@demolicao.fk6aapp.mongodb.net/pastelaria` |
| `PORT` | (deixe vazio - Render define automaticamente) |

### 2.5 Finalizar Deploy
1. Clique em "Create Web Service"
2. Aguarde o build (5-10 minutos)
3. Sua API estará disponível em: `https://pastelaria-api-XXXX.onrender.com`

## ✅ Passo 3: Testar a API

Após o deploy, teste os endpoints:
- **Health Check**: `https://sua-url.onrender.com/api/v1/health`
- **Produtos**: `https://sua-url.onrender.com/api/v1/produtos`
- **Pedidos**: `https://sua-url.onrender.com/api/v1/pedidos`

## 📱 Passo 4: Atualizar o APK

Depois do deploy bem-sucedido, atualize o arquivo `api-config.js` com a URL do Render e reconstrua o APK.

## 🔍 Troubleshooting

### Problemas Comuns:
1. **Build falha**: Verifique se o `package.json` está correto
2. **Variáveis de ambiente**: Certifique-se de que `MONGODB_URI` está correto
3. **App não responde**: Aguarde alguns minutos - apps gratuitos "dormem"

### Logs:
- Acesse o dashboard do Render
- Clique no seu serviço
- Vá em "Logs" para ver erros

## 💡 Dicas Importantes

- ⚠️ **App dorme**: Após 15min sem uso, demora ~30s para "acordar"
- 🔄 **Auto-deploy**: Qualquer push no GitHub faz deploy automático
- 📊 **Monitoramento**: Use o dashboard do Render para monitorar
- 🆓 **Limites**: 750 horas/mês no plano gratuito

---

**Próximo passo**: Após o deploy, me informe a URL gerada para atualizarmos o APK! 🎯