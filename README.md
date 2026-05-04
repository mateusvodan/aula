# Funquiz — SaaS de funis de quiz

Aplicação **Next.js 16** (App Router) com **Tailwind v4**, **Shadcn UI**, **Supabase Auth + Postgres**, construtor visual com **React Flow**, páginas públicas em **`/q/[slug]`**, captura de leads e analytics simples.

## Pré-requisitos

- Node.js 18+
- Conta Supabase ([supabase.com](https://supabase.com/dashboard))

## 1. Instalação local

```bash
npm install
cp .env.example .env.local
```

Preencha em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — use a chave **anon** em Project API keys (**nunca** `service_role` no frontend).

Opcional (útil para links absolutos):

- `NEXT_PUBLIC_SITE_URL` — exemplo: `http://localhost:3000`

Reinicie `npm run dev` depois de criar ou alterar `.env.local` (variáveis `NEXT_PUBLIC_*` são aplicadas ao arranque).

## 2. Base de dados Supabase

1. Crie um projeto no Supabase.
2. Na raiz deste repo, rode a migração SQL (Dashboard → SQL → New query) com o conteúdo de  
   [`supabase/migrations/20260504123000_init.sql`](supabase/migrations/20260504123000_init.sql).

   Ou use a CLI (`supabase db push`), se já tiver o projeto ligado.

3. Configure **Redirect URLs** em Authentication → URL Configuration (ex.:  
   `http://localhost:3000/auth/callback` e o URL de produção).

## 3. Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

- Landing: `/`
- Registo/login: `/signup`, `/login`, `/forgot-password`
- Callback OAuth / magic links: `/auth/callback`
- Painel (autenticado): `/dashboard`
- Editor de funil: `/dashboard/funnels/[id]/edit`
- Analytics: `/dashboard/funnels/[id]/analytics`
- Quiz público: `/q/[slug]` (requer **publicar** o funil no editor)

## 4. Fluxo rápido

1. Registar utilizador → perfil criado por trigger (`profiles`).
2. Criar funil ou usar **template** no painel.
3. Configurar blocos no canvas → **Guardar fluxo**.
4. **Publicar** o funil para permitir página pública, leads e eventos anon.
5. Partilhar `https://<teu-domínio>/q/<slug>`.

## 5. Integrações (estrutura)

- **Webhook**: campo no painel de integrações do editor (`settings.webhook_url`) — disparo no servidor ao submeter lead.
- **WhatsApp / checkout**: `whatsapp_phone`, `checkout_base_url` nos mesmos settings; link de exemplo na página de redirect público (`redirect`).

## 6. Deploy (Vercel)

1. Ligar o repo à Vercel.
2. Definir as mesmas variáveis de ambiente.
3. Adicionar URL de produção nas Redirect URLs do Supabase (`/auth/callback`).

## Scripts

```bash
npm run dev    # servidor de desenvolvimento
npm run build  # build de produção
npm run start  # após build
npm run lint   # ESLint
```

## Stack

Next.js • TypeScript • Tailwind CSS • Shadcn • Supabase Auth/Postgres • RLS • React Flow • Recharts • Vercel (recomendado)
