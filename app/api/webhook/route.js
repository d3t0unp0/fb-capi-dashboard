import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
import axios from 'axios';

function hashData(data) {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(req) {
  try {
    const payload = await req.json();
    console.log("Payload recibido de MailerLite:", JSON.stringify(payload));

    let subscriber = null;
    if (payload.events && Array.isArray(payload.events) && payload.events.length > 0) {
      subscriber = payload.events[0].data?.subscriber;
    } else if (payload.subscriber) {
      subscriber = payload.subscriber;
    }

    if (!subscriber || !subscriber.email) {
      return NextResponse.json({ message: 'No subscriber data found, ignoring.' }, { status: 200 });
    }

    const email = subscriber.email;
    const ip_address = subscriber.ip_address || null;
    const fields = subscriber.fields || {};
    
    const firstName = fields.name || fields.first_name || null;
    const phone = fields.phone || null;
    
    const event_id = fields.event_id || `ml_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const event_name = fields.event_name || 'Lead';
    const event_time = Math.floor(Date.now() / 1000);

    // Leer credenciales de la base de datos (Vercel KV)
    const PIXEL_ID = await kv.get('fb_pixel_id');
    const ACCESS_TOKEN = await kv.get('fb_access_token');

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error("Faltan configurar el Pixel ID o el Token en el Dashboard");
      return NextResponse.json({ error: 'Configuración de CAPI incompleta en el Dashboard' }, { status: 500 });
    }

    const fbPayload = {
      data: [
        {
          event_name: event_name,
          event_time: event_time,
          action_source: "website",
          event_id: event_id,
          user_data: {
            em: [hashData(email)],
            fn: firstName ? [hashData(firstName)] : undefined,
            ph: phone ? [hashData(phone)] : undefined,
            client_ip_address: ip_address
          },
          custom_data: {
            source: 'MailerLite'
          }
        }
      ]
    };

    const fbApiUrl = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const fbResponse = await axios.post(fbApiUrl, fbPayload);
    
    console.log("Evento enviado exitosamente a FB CAPI:", fbResponse.data);
    return NextResponse.json({ success: true, event_name, event_id });

  } catch (error) {
    console.error("Error al procesar el webhook:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
