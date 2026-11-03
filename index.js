const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Use POST" }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: "Server API key is not configured." }, 500);

    try {
      const body = await request.json();
      const message = String(body.message || "").slice(0, 12000);
      const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
      const contents = [];
      for (const item of history) {
        if (!item || !["user", "model"].includes(item.role)) continue;
        const text = String(item.text || "").slice(0, 12000);
        if (text) contents.push({ role: item.role, parts: [{ text }] });
      }

      const parts = [];
      if (message) parts.push({ text: message });
      if (body.image && body.image.base64 && body.image.mimeType) {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(body.image.mimeType)) return json({ error: "Image format not supported. Use JPG, PNG or WEBP." }, 400);
        if (String(body.image.base64).length > 7_000_000) return json({ error: "Image is too large." }, 413);
        parts.push({ inline_data: { mime_type: body.image.mimeType, data: body.image.base64 } });
      }
      if (!parts.length) return json({ error: "Message or image is required." }, 400);
      contents.push({ role: "user", parts });

      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are FAI AI, a helpful, honest, friendly personal AI assistant. Reply in the language and style the user uses. If the user writes Roman Urdu, reply in Roman Urdu. Explain clearly and safely. Do not claim to perform actions you cannot perform." }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });
      const result = await upstream.json();
      if (!upstream.ok) return json({ error: result.error?.message || "AI provider error." }, upstream.status);
      const reply = (result.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
      return json({ reply: reply || "Is sawal ka jawab generate nahi ho saka." }, 200);
    } catch (error) {
      return json({ error: "Request process nahi ho saki. " + (error.message || "") }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
