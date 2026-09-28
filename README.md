# Cowork Criativo

Workspace de operação criativa para e-commerce: cada ideia vira um CR que atravessa copy → editor → revisão → media buyer, com permissões por papel e o aprendizado do teste voltando para quem escreve o próximo brief.

## Stack

- **Next.js 16** (App Router), React 19, Tailwind 4 e shadcn/ui
- **Neon Postgres** via `@neondatabase/serverless`, schema e migrações com Drizzle
- **Neon Auth** (Better Auth gerenciado) para login por e-mail e senha
- Deploy na **Vercel**

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha as três variáveis
pnpm db:migrate
pnpm dev
```

As três variáveis estão documentadas no próprio `.env.example`: a conexão do banco, a URL do Neon Auth e um segredo de cookie que você gera. Nenhuma delas fica no código.

O passo a passo detalhado, em português e sem pressupor familiaridade com o terminal, está em [COMECE-AQUI-VSCODE.md](COMECE-AQUI-VSCODE.md).

## Como funciona o acesso

A **primeira pessoa que cria conta vira administradora**. É ela quem cadastra as demais na aba Equipe e define a função de cada uma: copy, editor ou media buyer. Quem cria conta antes de ser cadastrado entra como pendente e precisa pedir acesso.

As permissões são checadas no servidor, por etapa e por responsável — o front apenas reflete o que a API permite.

## Onde mexer

| Caminho | O que é |
|---|---|
| `app/page.tsx` | Telas, navegação e interações do workspace |
| `app/api/workspace/route.ts` | Regras de negócio, permissões e transições de etapa |
| `db/schema.ts` · `drizzle/` | Schema e migrações |
| `db/index.ts` | Conexão com o Neon |
| `lib/auth/` · `app/entrar` · `app/criar-conta` | Login |

Mudou o schema? `pnpm db:generate` cria a migração e `pnpm db:migrate` aplica. Nunca edite uma migração já aplicada.

## Deploy

Importe o repositório na Vercel e cadastre as mesmas três variáveis em **Settings → Environment Variables**. O build padrão (`next build`) funciona sem configuração extra.

`drizzle-d1-legacy/` guarda as migrações do banco anterior (Cloudflare D1) apenas por histórico; nada no app as usa.
