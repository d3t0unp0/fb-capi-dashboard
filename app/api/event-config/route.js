import { kv } from '@/app/lib/kv';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  try {
    // Leer configuracion de la base de datos
    const pixelId = await kv.get('fb_pixel_id');
    const rules = await kv.get('url_rules') || [];

    // Protocolo de la URL origen (nuestro panel) para saber adonde hacer POST
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host');
    const apiUrl = `${protocol}://${host}/api/webhook`;

    if (!pixelId) {
      return new NextResponse('console.warn("CAPI Dashboard: No se ha configurado el ID del Pixel.");', {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          ...corsHeaders
        }
      });
    }

    // Generar el codigo JavaScript que se ejecutara en el navegador del cliente
    const scriptCode = `
      (function() {
        try {
          // 1. Configuracion embebida desde el servidor
          var pixelId = "${pixelId}";
          var rules = ${JSON.stringify(rules)};
          var webhookUrl = "${apiUrl}";
          var currentUrl = window.location.href;
          
          // 2. Determinar evento basado en las reglas
          var eventName = 'Lead'; // Evento por defecto
          for (var i = 0; i < rules.length; i++) {
            if (rules[i].url && currentUrl.toLowerCase().indexOf(rules[i].url.toLowerCase()) !== -1) {
              eventName = rules[i].event;
              break;
            }
          }

          // 3. Generar un Event ID unico para deduplicacion (Pixeles + API)
          var eventId = 'evt_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);

          // 4. Inyectar el codigo base del Pixel de Facebook (si no existe ya)
          if (typeof fbq === 'undefined') {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('init', pixelId);
            fbq('track', 'PageView'); // Rastreamos la visita general a la pagina
          }

          // 5. Enviar el evento especifico por el Pixel (Navegador)
          fbq('track', eventName, { source: 'CAPI_Universal_Script' }, { eventID: eventId });
          console.log("CAPI Dashboard: Pixel disparado - " + eventName + " - EventID: " + eventId);

          // Función auxiliar para leer cookies
          function getCookie(name) {
            var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
            return null;
          }

          var fbp = getCookie('_fbp');
          var fbc = getCookie('_fbc');

          // 6. Enviar el evento por la API (Servidor) de forma silenciosa
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventName: eventName,
              eventId: eventId,
              url: currentUrl,
              fbp: fbp,
              fbc: fbc,
              source: 'browser_script'
            })
          }).catch(function(e) { console.error("Error CAPI", e); });

        } catch(e) {
          console.error("Error ejecutando CAPI Script:", e);
        }
      })();
    `;

    return new NextResponse(scriptCode, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error generando script universal:', error);
    return new NextResponse('console.error("Error interno generando script universal");', {
      status: 500,
      headers: { 'Content-Type': 'application/javascript', ...corsHeaders }
    });
  }
}
