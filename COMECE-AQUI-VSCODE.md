# Cowork Criativo — abrir no VS Code (Windows)

Esta pasta é o código-fonte do site. Não inclui senhas, dependências instaladas ou dados reais.

O banco de dados é **Neon (Postgres)**. A conexão vem sempre da variável de ambiente `DATABASE_URL` — nunca do código.

## 1. Preparar

Instale o VS Code e o Node.js 22.13 ou superior. Extraia este ZIP para uma pasta, por exemplo `Documentos\Cowork-Criativo`. Abra essa pasta no VS Code em **Arquivo > Abrir Pasta** e abra **Terminal > Novo Terminal** (PowerShell).

## 2. Instalar e conectar no banco

Crie um projeto no [Neon](https://neon.tech), copie a connection string e rode:

```powershell
node --version
npx --yes pnpm@10 install --frozen-lockfile
Copy-Item .env.example .env.local
```

Abra `.env.local` e cole a sua connection string em `DATABASE_URL`. Depois:

```powershell
npm run db:migrate
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

`.env.local` está no `.gitignore`: a senha do banco não entra no repositório nem no ZIP. Rode `npm run db:migrate` só quando houver migração nova.

**Atenção:** diferente do banco local antigo, o Neon é um banco só. Se você apontar o `.env.local` para o mesmo banco que o site usa em produção, o que você criar testando aqui aparece para a equipe. Para testar à vontade, crie um segundo projeto (ou um branch) no Neon e use essa string no `.env.local`.

## 3. Mudar o banco de dados

Depois de editar `db/schema.ts`:

```powershell
npm run db:generate   # cria o arquivo de migração novo
npm run db:migrate    # aplica no banco
```

Nunca edite nem apague um arquivo de migração já aplicado — toda mudança entra como arquivo novo.

## Onde editar

- `app/page.tsx` — telas, navegação e interações.
- `app/globals.css` — visual e responsividade.
- `app/api/workspace/route.ts` — regras, permissões e dados da operação.
- `db/schema.ts` e `drizzle/` — banco de dados e migrações.
- `db/index.ts` — conexão com o Neon.
- `public/favicon.svg` — ícone.

## Pastas que você pode ignorar

- `drizzle-d1-legacy/` — migrações do banco antigo (Cloudflare D1), guardadas só por histórico.
- `examples/`, `build/`, `scripts/` — apoio do template original.

## Publicação

Editar esta cópia e rodar `npm run dev` não altera nenhum site publicado. Ao publicar (GitHub → Vercel), cadastre `DATABASE_URL` em **Settings > Environment Variables** no projeto da Vercel. Não envie `node_modules`, `dist`, `.wrangler`, `.sites-runtime` ou `.env.local`.
