# MXM Cimentos — Gestão Financeira

Sistema de gestão de transações financeiras da parceria entre MXM e Ivo Menezes. Controla investimentos em cimento, acompanha pendências, registra clientes e gera análises visuais.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React + Tailwind CSS + CSS Variables |
| Banco de dados | Supabase (PostgreSQL) |
| Gráficos | Recharts |
| Autenticação | Cookie com senha compartilhada |
| Tipagem | TypeScript |
| Fonte | Plus Jakarta Sans |

---

## Funcionalidades

### Transações
- Cadastrar, editar e excluir transações de investimento em cimento
- Campos: cliente, marca, quantidade de sacos, valor por saco, lucro combinado, data e observações
- Cálculo automático de valor transferido, retorno total e lucro esperado
- Marcação de pagamento recebido com registro da data de retorno
- Status automático: **Pendente** (dentro do prazo), **Atrasado** (>21 dias sem retorno), **Retornado** (pago)

### Clientes
- Cadastro completo com nome, telefone, e-mail e cidade
- Autocomplete no formulário de transação vinculando cliente ao cadastro
- Cidades cobertas: Salvador e toda a Região Metropolitana (RMS)
- Busca por nome, cidade, telefone ou e-mail

### Métricas (cards do dashboard)
- **Investido pendente** — capital total ainda em aberto
- **Lucro recebido** — ganho confirmado nas transações retornadas
- **Não pagos** — contagem de transações pendentes + atrasadas
- **Atrasadas** — contagem de cobranças vencidas com alerta visual

### Análises
- **5 KPIs**: Total transacionado, Lucro realizado, A receber (c/ lucro), Ticket médio, Tempo médio de retorno
- **Gráfico de barras mensal**: investimento × lucro por mês
- **Donut de status**: proporção retornado / pendente / atrasado
- **Ranking de clientes**: top 7 por volume investido
- **Por marca de cimento**: volume e sacos por fabricante
- **Por cidade**: distribuição geográfica (requer cliente vinculado)
- Filtros de período: 30d · 90d · 6 meses · 1 ano · Todo o histórico

### Temas
- **Modo escuro** (padrão) — fundo navy premium `#07111E`
- **Modo claro** — fundo azul-acinzentado suave com cards brancos
- Sidebar sempre escura em ambos os modos (visual premium)
- Persistência da preferência via `localStorage`
- Transição suave entre temas (`0.2s ease`)
- Botão de toggle na sidebar (desktop) e no header (mobile)

### Autenticação
- Senha compartilhada configurada via variável de ambiente
- Cookie de sessão (`mxm_auth`) com validade de 7 dias
- Middleware Next.js protege todas as rotas (exceto `/login`)
- Tela de login sempre clara/branca independente do tema

### Responsividade
- **Desktop**: sidebar fixa lateral com navegação completa
- **Mobile**: header fixo + bottom navigation + FAB para nova transação
- Tabelas viram cards empilhados em telas pequenas

---

## Estrutura do projeto

```
mxmcimentos/
├── app/
│   ├── api/
│   │   ├── auth/route.ts          # Login / logout (POST/DELETE)
│   │   ├── clientes/
│   │   │   ├── route.ts           # GET (listar) / POST (criar)
│   │   │   └── [id]/route.ts      # PUT (editar) / DELETE (desativar)
│   │   ├── marcas/route.ts        # GET marcas de cimento
│   │   └── transacoes/
│   │       ├── route.ts           # GET / POST
│   │       └── [id]/route.ts      # PUT / DELETE
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── globals.css                # CSS variables dark/light + estilos base
│   └── layout.tsx
├── components/
│   ├── Analytics.tsx              # Gráficos e KPIs de análise
│   ├── CidadeSelect.tsx           # Autocomplete de cidades SSA/RMS
│   ├── ClienteCombobox.tsx        # Autocomplete de clientes cadastrados
│   ├── ClienteForm.tsx            # Formulário de cliente
│   ├── ClienteList.tsx            # Lista/tabela de clientes
│   ├── Dashboard.tsx              # Layout principal + navegação
│   ├── MetricCards.tsx            # Cards de KPIs do dashboard
│   ├── StatusBadge.tsx            # Badge colorido de status
│   ├── ThemeProvider.tsx          # Contexto dark/light + localStorage
│   ├── TransacaoForm.tsx          # Formulário de transação
│   └── TransacaoTable.tsx         # Tabela/cards de transações
├── lib/
│   ├── cidades.ts                 # Lista de cidades SSA + RMS
│   ├── supabase.ts                # Client Supabase
│   ├── types.ts                   # Interfaces TypeScript
│   └── utils.ts                   # brl(), calcularMetrics(), toComStatus()
├── supabase/
│   ├── schema.sql                 # Schema inicial
│   ├── migration_002_clientes.sql # Tabela de clientes
│   └── migration_003_marcas.sql   # Tabela de marcas de cimento
└── middleware.ts                  # Proteção de rotas via cookie
```

---

## Configuração

### Variáveis de ambiente (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
APP_PASSWORD=sua_senha_aqui
```

### Banco de dados (Supabase)

Execute os arquivos SQL na ordem:

```bash
supabase/schema.sql
supabase/migration_002_clientes.sql
supabase/migration_003_marcas.sql
```

### Rodar localmente

```bash
npm install
npm run dev
# Acesse http://localhost:3000
```

---

## Regras de negócio

| Regra | Valor |
|---|---|
| Prazo para retorno sem atraso | 21 dias |
| Status "Atrasado" | > 21 dias sem `data_retorno` |
| Status "Retornado" | `data_retorno` preenchida |
| Status "Pendente" | sem retorno, dentro do prazo |
| Valor transferido | `quantidade_sacos × valor_por_saco` |
| A receber (total) | `valor_transferido + lucro_esperado` |

---

## Marcas de cimento suportadas

Cadastradas via `migration_003_marcas.sql`. Novas marcas podem ser adicionadas diretamente na tabela `marcas` no Supabase.

---

*MXM Cimentos · Parceria Ivo Menezes · 2026*
