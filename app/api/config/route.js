import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Función auxiliar para verificar la contraseña
async function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  const storedHash = await kv.get('admin_password_hash');

  if (!storedHash) {
    // Si no hay contraseña configurada en la BD, bloqueamos el acceso por seguridad hasta que configuren
    return false; 
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedPassword = authHeader.replace('Bearer ', '');
  const providedHash = await hashPassword(providedPassword);

  return providedHash === storedHash;
}

export async function GET(req) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const pixelId = await kv.get('fb_pixel_id');
    const accessToken = await kv.get('fb_access_token');
    const rules = await kv.get('url_rules');

    return NextResponse.json({
      pixelId: pixelId || '',
      accessToken: accessToken || '',
      rules: rules || []
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { pixelId, accessToken, rules } = await req.json();

    await kv.set('fb_pixel_id', pixelId);
    await kv.set('fb_access_token', accessToken);
    await kv.set('url_rules', rules);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
