import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Este endpoint es PÚBLICO y es llamado por el script en la landing page
// Habilitamos CORS para que pueda ser llamado desde los dominios de MailerLite
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pageUrl = searchParams.get('url');

  if (!pageUrl) {
    return NextResponse.json({ eventName: 'Lead' }, { headers: corsHeaders });
  }

  try {
    const rules = await kv.get('url_rules') || [];
    
    // Buscar si hay alguna regla que coincida con la URL actual
    // La regla coincide si la URL de la página INCLUYE el texto de la regla
    const matchedRule = rules.find(rule => 
      rule.url && pageUrl.toLowerCase().includes(rule.url.toLowerCase())
    );

    const eventName = matchedRule ? matchedRule.event : 'Lead';

    return NextResponse.json({ eventName }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching event config:', error);
    // Si falla la base de datos, caemos en el comportamiento por defecto
    return NextResponse.json({ eventName: 'Lead' }, { headers: corsHeaders });
  }
}
