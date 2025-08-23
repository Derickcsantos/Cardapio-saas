# Menu SaaS 3D - Instruções de Configuração

## 1. Configuração do Banco de Dados (Supabase)

### Passo 1: Execute o Schema SQL
1. Acesse seu painel do Supabase
2. Vá para "SQL Editor"
3. Execute o conteúdo do arquivo `database-schema.sql`

### Passo 2: Configure as Variáveis de Ambiente
Atualize seu arquivo `.env` com as seguintes correções:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tkhdhkaguuclozgdjdgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraGRoa2FndXVjbG96Z2RqZGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDk3MzEsImV4cCI6MjA3MTI4NTczMX0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraGRoa2FndXVjbG96Z2RqZGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTczMSwiZXhwIjoyMDcxMjg1NzMxfQ.d7izQ4j3BckZqT4Ap6SJO43k8naNhDXEz5rF0jFjx7U

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51QSIrULBmne67LeJ54ysLqdzOYSVQ3Nlpz5AfOjcktFprcayazf86tAcpd1HFlXkjdW6teXRp9CYWlNoAo0Sv6Db00YdhRX5cq
STRIPE_SECRET_KEY=sk_live_51•••••Fap
STRIPE_WEBHOOK_SECRET=whsec_5DSvUEqRwNSS3ZvVIbT2xiehZaHbqS0S

# Stripe Price IDs (você precisa criar estes no painel do Stripe)
STRIPE_PLUS_PRICE_ID=price_plus_monthly_id_aqui
STRIPE_PRO_PRICE_ID=price_pro_monthly_id_aqui

# App URLs
NEXT_PUBLIC_APP_URL=https://cardapio-3d.preview.emergentagent.com
NEXT_PUBLIC_BASE_URL=https://cardapio-3d.preview.emergentagent.com
CORS_ORIGINS=*
```

**IMPORTANTE**: Você precisa obter a chave ANON correta do Supabase. A que você tem parece ser a service_role_key duplicada.

## 2. Configuração do Stripe

### Passo 1: Criar Produtos no Stripe
1. Acesse seu painel do Stripe
2. Vá para "Products"
3. Crie dois produtos:
   - **Plus**: R$ 12,00/mês
   - **Pro**: R$ 25,00/mês

### Passo 2: Obter Price IDs
1. Para cada produto, copie o Price ID
2. Adicione no seu `.env`:
   - `STRIPE_PLUS_PRICE_ID=price_xxxxx`
   - `STRIPE_PRO_PRICE_ID=price_xxxxx`

### Passo 3: Configurar Webhook
1. No Stripe, vá para "Webhooks"
2. Adicione endpoint: `https://seu-dominio.com/api/webhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 3. Configuração do Storage (Supabase)

### Passo 1: Verificar Bucket
1. No Supabase, vá para "Storage"
2. Verifique se o bucket `menu-images` foi criado
3. Se não existir, crie manualmente

### Passo 2: Configurar Políticas
As políticas já estão no schema SQL, mas verifique se foram aplicadas corretamente.

## 4. Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login/Signup corrigido
- Integração com Supabase Auth
- Middleware de autenticação

### ✅ Gerenciamento de Organizações
- Criação automática na signup
- Configurações (nome, slug, redes sociais, endereço)
- URL personalizada

### ✅ Sistema de Planos
- Free: 1 imagem
- Plus: 3 imagens (R$ 12/mês)
- Pro: Ilimitadas (R$ 25/mês)
- Integração com Stripe

### ✅ Gerenciamento de Membros
- Adicionar/remover membros
- Controle de permissões (owner/admin/member)
- Interface completa

### ✅ Upload de Imagens
- Limite por plano
- Upload para Supabase Storage
- Validação de tipo e tamanho

### ✅ Cardápio Público
- Visualização em tela cheia
- Design focado nas imagens
- Botões de contato (WhatsApp, Instagram, TikTok)
- Compartilhamento

### ✅ Dashboard Completo
- Visão geral
- Gerenciamento de imagens
- Configurações da organização
- Gerenciamento de equipe
- Controle de planos

## 5. Como Testar

### Passo 1: Executar o Schema
Execute o SQL no Supabase para criar as tabelas.

### Passo 2: Configurar Variáveis
Atualize o `.env` com as chaves corretas.

### Passo 3: Testar Signup
1. Acesse a página inicial
2. Crie uma conta com organização
3. Verifique se foi criado no banco

### Passo 4: Testar Upload
1. Faça login
2. Vá para aba "Imagens"
3. Faça upload de uma imagem
4. Verifique se aparece no cardápio público

### Passo 5: Testar Cardápio Público
1. Acesse `https://seu-dominio.com/slug-da-organizacao`
2. Verifique se as imagens aparecem em tela cheia
3. Teste os botões de contato

## 6. Problemas Conhecidos e Soluções

### Problema: "Not authenticated"
**Solução**: Verifique se a SUPABASE_ANON_KEY está correta no `.env`

### Problema: Upload falha
**Solução**: Verifique se o bucket `menu-images` existe e está público

### Problema: Stripe não funciona
**Solução**: Verifique se os Price IDs estão corretos no `.env`

### Problema: Cardápio não carrega
**Solução**: Verifique se a organização existe e tem o slug correto

## 7. Próximos Passos

1. **Configurar Webhook do Stripe** para atualizar planos automaticamente
2. **Testar pagamentos** em ambiente de produção
3. **Configurar domínio personalizado** se necessário
4. **Adicionar analytics** para acompanhar uso

## 8. Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Verifique se todas as variáveis de ambiente estão corretas
4. Teste cada funcionalidade individualmente