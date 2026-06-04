import { kv } from '@/app/lib/kv';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';

function hashData(data) {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(req) {
  try {
    const payload = await req.json();
    console.log("Payload recibido en Webhook:", JSON.stringify(payload));

    // Leer credenciales de la base de datos (Vercel KV)
    const PIXEL_ID = await kv.get('fb_pixel_id');
    const ACCESS_TOKEN = await kv.get('fb_access_token');
    const TEST_EVENT_CODE = await kv.get('fb_test_event_code');

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error("Faltan configurar el Pixel ID o el Token en el Dashboard");
      return NextResponse.json({ error: 'Configuración de CAPI incompleta en el Dashboard' }, { status: 500 });
    }

    const event_time = Math.floor(Date.now() / 1000);
    let fbPayloadData = {};

    // CASO 1: Petición enviada desde nuestro Script Universal en el navegador
    if (payload.source === 'browser_script') {
      const { eventName, eventId, url, fbp, fbc } = payload;
      
      // Intentar extraer IP del request si Vercel la provee
      const client_ip_address = req.headers.get('x-forwarded-for') || req.ip || null;
      const client_user_agent = req.headers.get('user-agent') || null;

      fbPayloadData = {
        event_name: eventName || 'Lead',
        event_time: event_time,
        action_source: "website",
        event_source_url: url,
        event_id: eventId, // ID CLAVE PARA LA DEDUPLICACION CON EL PIXEL
        user_data: {
          client_ip_address: client_ip_address,
          client_user_agent: client_user_agent,
          fbp: fbp || undefined,
          fbc: fbc || undefined
        },
        custom_data: {
          source: 'CAPI_Universal_Script'
        }
      };

    } 
    // CASO 2: Petición enviada desde un Webhook puro de servidor (ej. MailerLite directo)
    else {
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

      fbPayloadData = {
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
          source: 'MailerLite_Server_Webhook'
        }
      };
    }

    const fbPayload = { data: [fbPayloadData] };
    if (TEST_EVENT_CODE) {
      fbPayload.test_event_code = TEST_EVENT_CODE;
    }

    const fbApiUrl = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    
    const fbResponse = await axios.post(fbApiUrl, fbPayload);
    
    console.log("Evento enviado exitosamente a FB CAPI:", fbResponse.data);
    return NextResponse.json({ success: true, event_name: fbPayloadData.event_name, event_id: fbPayloadData.event_id });

  } catch (error) {
    console.error("Error al procesar el webhook:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
