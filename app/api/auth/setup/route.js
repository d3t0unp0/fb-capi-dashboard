import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req) {
  try {
    const existingHash = await kv.get('admin_password_hash');
    if (existingHash) {
      return NextResponse.json({ error: 'La contraseña ya fue configurada previamente' }, { status: 400 });
    }

    const { password } = await req.json();
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    await kv.set('admin_password_hash', hashed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error configurando auth:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
