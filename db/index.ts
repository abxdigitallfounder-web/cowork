import { neon } from '@neondatabase/serverless';

// O Postgres devolve int8 (bigint) como string para não perder precisão. As datas
// do app são epoch em milissegundos e o resto do código as trata como número, então
// convertemos as colunas int8 de volta para number ao ler.
const INT8_OID = 20;

export type Database = {
  first<T>(sql: string, params?: unknown[]): Promise<T | null>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
};

export function database(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada.');
  const sql = neon(url, { fullResults: true });
  const query = (text: string, params: unknown[] = []) => sql.query(text, params as unknown[]);
  const all = async <T>(text: string, params?: unknown[]): Promise<T[]> => {
    const result = await query(text, params);
    const bigintColumns = result.fields.filter((f) => f.dataTypeID === INT8_OID).map((f) => f.name);
    if (!bigintColumns.length) return result.rows as T[];
    return result.rows.map((row) => {
      const copy: Record<string, unknown> = { ...row };
      for (const column of bigintColumns) if (copy[column] !== null && copy[column] !== undefined) copy[column] = Number(copy[column]);
      return copy;
    }) as T[];
  };
  return {
    all,
    async first<T>(text: string, params?: unknown[]) { return (await all<T>(text, params))[0] ?? null },
    async run(text: string, params?: unknown[]) { return { changes: (await query(text, params)).rowCount ?? 0 } },
  };
}
