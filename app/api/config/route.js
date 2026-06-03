import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Función auxiliar para verificar la contraseña
export async function GET(req) {
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
