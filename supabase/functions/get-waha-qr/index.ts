const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { waha_url, waha_api_key, session_name } = body;
    
    const wahaUrl = String(waha_url || "").trim().replace(/\/$/, '');
    const sessionName = String(session_name || "default").trim();
    const apiKey = String(waha_api_key || "").trim();

    if (!wahaUrl) {
      return new Response(JSON.stringify({ error: "WAHA URL is missing." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // WAHA uses X-Api-Key header for API authentication
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    // 1. Check Session Status
    console.log(`[get-waha-qr] Checking session "${sessionName}" at ${wahaUrl}`);
    const statusRes = await fetch(`${wahaUrl}/api/sessions/${sessionName}`, { headers }).catch(e => {
      throw new Error(`WAHA server unreachable: ${e.message}`);
    });

    if (statusRes.status === 401) {
      return new Response(JSON.stringify({ error: "Authentication failed (401). Check your WAHA_API_KEY." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (statusRes.status === 404) {
      console.log("[get-waha-qr] Session not found, creating...");
      await fetch(`${wahaUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: sessionName })
      }).catch(() => {});
      
      return new Response(JSON.stringify({ status: 'STARTING', message: 'Initializing session...' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionData = await statusRes.json().catch(() => ({}));
    const status = sessionData.status || 'UNKNOWN';
    console.log(`[get-waha-qr] Session status: ${status}`);

    if (status === 'WORKING' || status === 'CONNECTED') {
      return new Response(JSON.stringify({ status: 'WORKING' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (status === 'STOPPED') {
      // Restart the session
      console.log("[get-waha-qr] Session stopped, restarting...");
      await fetch(`${wahaUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: sessionName })
      }).catch(() => {});
      
      return new Response(JSON.stringify({ status: 'STARTING', message: 'Restarting session...' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (status !== 'SCAN_QR_CODE') {
      // Not ready for QR yet, return status so frontend keeps polling
      return new Response(JSON.stringify({ status, message: `Session is ${status}, waiting...` }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch QR Code (session is in SCAN_QR_CODE status)
    console.log(`[get-waha-qr] Fetching QR code...`);
    
    const fetchQR = async (format: string) => {
      const fetchHeaders = { ...headers };
      // For raw format, we prefer text or image. For base64, we prefer JSON.
      fetchHeaders['Accept'] = format === 'raw' 
        ? 'text/plain, image/*, application/json' 
        : 'application/json, text/plain, image/*';

      const res = await fetch(`${wahaUrl}/api/${sessionName}/auth/qr?format=${format}`, { headers: fetchHeaders }).catch(e => {
        throw new Error(`QR fetch failed: ${e.message}`);
      });
      
      const contentType = res.headers.get('content-type') || '';
      console.log(`[get-waha-qr] Fetching ${format} - Content-Type: ${contentType}, Status: ${res.status}`);
      
      if (contentType.includes('image/')) {
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return { qrImage: `data:${contentType};base64,${base64}` };
      }
      
      const text = await res.text().catch(() => "");
      try {
        const json = JSON.parse(text);
        // Common WAHA fields: qr, value, data, qrImage
        const rawValue = json.qr || json.value || (format === 'raw' ? text : null);
        const imageValue = json.qrImage || (json.data && typeof json.data === 'string' && json.data.length > 500 ? json.data : null);
        
        let qr = null;
        let qrImage = null;

        // If we have a potential image value
        if (imageValue && typeof imageValue === 'string') {
          if (imageValue.startsWith('data:') || imageValue.length > 500) {
            qrImage = imageValue;
          } else {
            qr = imageValue;
          }
        }

        // If we have a potential raw value (and it's not the same as image value)
        if (rawValue && typeof rawValue === 'string' && rawValue !== imageValue) {
          if (rawValue.startsWith('data:') || rawValue.length > 500) {
            qrImage = rawValue;
          } else {
            qr = rawValue;
          }
        }

        // Final cleanup for qrImage
        if (qrImage && typeof qrImage === 'string' && !qrImage.startsWith('data:')) {
          qrImage = `data:image/png;base64,${qrImage}`;
        }
        
        // Final cleanup for qr: if it looks like an image, move it to qrImage
        if (qr && typeof qr === 'string' && (qr.startsWith('data:') || qr.length > 500)) {
          if (!qrImage) qrImage = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
          qr = null;
        }

        return { qr, qrImage };
      } catch {
        // Not JSON
        const looksLikeImage = text.startsWith('data:') || text.length > 500;
        if (looksLikeImage) {
          return { qrImage: text.startsWith('data:') ? text : `data:image/png;base64,${text}` };
        } else {
          return { qr: text };
        }
      }
    };

    // Try raw first
    let result = await fetchQR('raw');
    
    // If no QR found in raw, try base64
    if (!result.qr && !result.qrImage) {
      result = await fetchQR('base64');
    }

    console.log(`[get-waha-qr] Final Result - QR length: ${result.qr?.length || 0}, QR Image length: ${result.qrImage?.length || 0}`);

    return new Response(JSON.stringify({ 
      status,
      qr: result.qr,
      qrImage: result.qrImage
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(`[get-waha-qr] Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
