import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Función auxiliar para verificar la contraseña
function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envPassword) {
    // Si no hay contraseña configurada en Vercel, permitimos el acceso por defecto (aunque es peligroso en prod)
    return true; 
  }

  if (!authHeader || authHeader !== `Bearer ${envPassword}`) {
    return false;
  }
  return true;
}

export async function GET(req) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const pixelId = await kv.get('fb_pixel_id');
    const accessToken = await kv.get('fb_access_token');
    const rules = await kv.get('url_rules') || [];

    return NextResponse.json({ pixelId, accessToken, rules });
  } catch (error) {
    console.error('KV Error:', error);
    return NextResponse.json({ error: 'Error de conexión con la base de datos' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { pixelId, accessToken, rules } = await req.json();

    if (pixelId !== undefined) await kv.set('fb_pixel_id', pixelId);
    if (accessToken !== undefined) await kv.set('fb_access_token', accessToken);
    if (rules !== undefined) await kv.set('url_rules', rules);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV Error:', error);
    return NextResponse.json({ error: 'Error guardando en la base de datos' }, { status: 500 });
  }
}
