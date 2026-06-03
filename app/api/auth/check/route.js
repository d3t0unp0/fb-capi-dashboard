import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hash = await kv.get('admin_password_hash');
    if (!hash) {
      return NextResponse.json({ needsSetup: true });
    }
    return NextResponse.json({ needsSetup: false });
  } catch (error) {
    console.error('Error verificando auth:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
