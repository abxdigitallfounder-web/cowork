import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/db';
import { auth } from '@/lib/auth/server';
export const dynamic = 'force-dynamic';

// O PDF do briefing é servido por esta rota, e não pelo GET do workspace, para que a
// listagem continue leve: aqui a coluna `data` só é lida para o arquivo pedido.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    const email = session?.user?.email?.toLowerCase();
    if (!email) return NextResponse.json({ error: 'Entre com sua conta para abrir o arquivo.' }, { status: 401 });
    const db = database();
    const member = await db.first<{ role: string }>('SELECT role FROM team_members WHERE email=$1', [email]);
    if (!member) return NextResponse.json({ error: 'Conta ainda sem acesso à equipe.' }, { status: 403 });
    const { id } = await context.params;
    const file = await db.first<{ name: string; data: string }>('SELECT name,data FROM brief_files WHERE id=$1', [id]);
    if (!file) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    const bytes = Buffer.from(file.data, 'base64');
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        // O nome vai em filename* porque briefings costumam ter acentos no título.
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Não foi possível abrir o arquivo.' }, { status: 503 });
  }
}
