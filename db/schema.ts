import { pgTable, text, integer, bigint, doublePrecision } from 'drizzle-orm/pg-core';

// created_at/updated_at guardam epoch em milissegundos, que estoura integer (4 bytes)
// no Postgres: por isso bigint. O driver devolve int8 como string e db/index.ts converte.
const epochMs = (name: string) => bigint(name, { mode: 'number' });

export const creatives = pgTable('creatives', {
  id: text('id').primaryKey(),
  number: integer('number').notNull(),
  product: text('product').notNull().default('BLIVE'),
  title: text('title').notNull().default('Novo criativo'),
  parent: text('parent').notNull().default(''),
  kind: text('kind').notNull().default('Novo conceito'),
  status: text('status').notNull().default('brief'),
  owner: text('owner').notNull(),
  ownerEmail: text('owner_email').notNull(),
  hypothesis: text('hypothesis').notNull().default(''),
  offer: text('offer').notNull().default(''),
  angle: text('angle').notNull().default(''),
  message: text('message').notNull().default(''),
  hook: text('hook').notNull().default(''),
  hookCopy: text('hook_copy').notNull().default(''),
  hookVisual: text('hook_visual').notNull().default(''),
  concept: text('concept').notNull().default(''),
  script: text('script').notNull().default(''),
  editorNotes: text('editor_notes').notNull().default(''),
  variable: text('variable').notNull().default('Hook'),
  keep: text('keep').notNull().default(''),
  change: text('change').notNull().default(''),
  version: text('version').notNull().default('V01'),
  assetUrl: text('asset_url').notNull().default(''),
  copyAssignee: text('copy_assignee').notNull().default(''),
  editorAssignee: text('editor_assignee').notNull().default(''),
  mediaAssignee: text('media_assignee').notNull().default(''),
  dueAt: text('due_at').notNull().default(''),
  editorResponse: text('editor_response').notNull().default(''),
  editorChecklist: text('editor_checklist').notNull().default(''),
  reviewFeedback: text('review_feedback').notNull().default(''),
  spend: doublePrecision('spend'), cpa: doublePrecision('cpa'), roas: doublePrecision('roas'), ctr: doublePrecision('ctr'), cvr: doublePrecision('cvr'),
  result: text('result').notNull().default(''),
  learning: text('learning').notNull().default(''),
  nextAction: text('next_action').notNull().default(''),
  createdAt: epochMs('created_at').notNull(), updatedAt: epochMs('updated_at').notNull(),
});
export const comments = pgTable('comments', {
  id: text('id').primaryKey(), creativeId: text('creative_id').notNull(),
  author: text('author').notNull(), email: text('email').notNull(),
  body: text('body').notNull(), createdAt: epochMs('created_at').notNull(),
});
export const activity = pgTable('activity', {
  id: text('id').primaryKey(), creativeId: text('creative_id').notNull(),
  actor: text('actor').notNull(), text: text('text').notNull(), createdAt: epochMs('created_at').notNull(),
});
export const sequence = pgTable('sequence', { key: text('key').primaryKey(), value: integer('value').notNull() });
export const teamMembers = pgTable('team_members', {
  email: text('email').primaryKey(),
  name: text('name').notNull().default(''),
  role: text('role').notNull(),
  createdAt: epochMs('created_at').notNull(),
});

// O PDF do briefing fica em uma tabela separada, em base64, para que a leitura do
// workspace continue trazendo só os metadados do arquivo e nunca o conteúdo.
export const briefFiles = pgTable('brief_files', {
  id: text('id').primaryKey(),
  creativeId: text('creative_id').notNull(),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  data: text('data').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: epochMs('created_at').notNull(),
});
