# MXM Cimentos

Gestão de transações de cimento — Parceria Ivo Menezes.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Tailwind CSS**
- **Supabase** (PostgreSQL via service_role — server-side only)
- **Vercel** (deploy)

## Como rodar localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/licitacaoalpes/mxmcimentos.git
cd mxmcimentos
npm install
```

### 2. Criar `.env.local`

Copie o exemplo e preencha:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zkhiofrnwgvwtrttuaqm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
APP_PASSWORD=uma-senha-que-voce-e-o-ivo-sabem
```

> **Importante:** `APP_PASSWORD` é a senha compartilhada entre você e o Ivo para acessar o app. Pode ser qualquer palavra simples — ex: `cimento2024`.

### 3. Criar a tabela no Supabase

No painel do Supabase:
- Vá em **SQL Editor** → **New query**
- Cole o conteúdo de `supabase/schema.sql`
- Execute

### 4. Rodar o app

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Deploy no Vercel (produção)

### 1. Importe o repositório no Vercel

- Acesse https://vercel.com/new
- Clique em **Import Git Repository**
- Selecione `licitacaoalpes/mxmcimentos`

### 2. Configure as variáveis de ambiente

No painel de configuração do projeto no Vercel, adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zkhiofrnwgvwtrttuaqm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service role) |
| `APP_PASSWORD` | a senha compartilhada |

### 3. Deploy

Clique em **Deploy**. Após o deploy, o Vercel fornece uma URL como `mxmcimentos.vercel.app`.

### 4. Compartilhe com o Ivo

Envie a URL e a `APP_PASSWORD` para o Ivo. Os dois acessam a mesma base de dados em tempo real.

---

## Estrutura do projeto

```
app/
├── login/page.tsx          # Tela de login (senha compartilhada)
├── dashboard/page.tsx      # Dashboard principal
├── api/auth/route.ts       # POST login / DELETE logout
├── api/transacoes/         # GET listar / POST criar
└── api/transacoes/[id]/    # PUT editar / DELETE excluir

components/
├── Dashboard.tsx           # Client component principal
├── MetricCards.tsx         # Cards de resumo financeiro
├── TransacaoTable.tsx      # Tabela com filtros e ações
├── TransacaoForm.tsx       # Formulário criar/editar
└── StatusBadge.tsx         # Badge de status

lib/
├── supabase.ts             # Client server-side (service_role)
├── types.ts                # TypeScript interfaces
├── utils.ts                # Formatação, cálculos, status
└── auth.ts                 # Hash de senha (Web Crypto)

middleware.ts               # Proteção de rotas (verifica cookie)
supabase/schema.sql         # SQL para criar a tabela
```

## Segurança

- `APP_PASSWORD` nunca vai para o cliente
- `SUPABASE_SERVICE_ROLE_KEY` só existe no servidor (Next.js API routes)
- Cookie de sessão é `httpOnly` + `secure` + `sameSite=lax`
- RLS habilitado no Supabase — acesso direto bloqueado (só via service_role)
