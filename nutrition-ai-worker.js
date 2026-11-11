const ALLOWED_ORIGIN = "https://faulixx11.github.io";
const MODEL = "@cf/zai-org/glm-4.7-flash";

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
    });
    if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "Origin nicht erlaubt." }, 403);
    if (request.method !== "POST") return json({ error: "Nur POST ist erlaubt." }, 405);
    if (!env.ACCESS_TOKEN) return json({ error: "Worker ist noch nicht vollständig eingerichtet." }, 503);
    const auth = request.headers.get("Authorization") || "";
    if (auth !== "Bearer " + env.ACCESS_TOKEN) return json({ error: "Zugriffscode ungültig." }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Ungültiges JSON." }, 400); }
    const message = String(body.message || "").trim();
    if (!message || message.length > 2500) return json({ error: "Nachricht fehlt oder ist zu lang (max. 2500 Zeichen)." }, 400);

    const context = body.context && typeof body.context === "object" ? body.context : {};
    const safeContext = {
      diet: String(context.diet || "vegan").slice(0, 30),
      avoidNuts: Boolean(context.avoidNuts),
      dislikes: String(context.dislikes || "").slice(0, 300),
      allergies: String(context.allergies || "").slice(0, 300),
      recipes: Array.isArray(context.recipes) ? context.recipes.slice(0, 15) : [],
      pantry: Array.isArray(context.pantry) ? context.pantry.slice(0, 30) : []
    };

    const system = [
      "Du bist der sachliche, freundliche Ernährungsassistent der Lernplattform StudySpace.",
      "Der Nutzer ist minderjährig. Gib altersgerechte, ausgewogene und nicht restriktive Ernährungshinweise.",
      "Keine Gewichtsabnahmeziele, Kalorienrestriktionen, Körperbewertungen oder extremen Ernährungsregeln.",
      "Bevorzuge die im Profil angegebene Ernährungsweise; beachte Allergien, Unverträglichkeiten und Abneigungen strikt.",
      "Gib bei veganer Ernährung praktische Hinweise zu B12 und einer abwechslungsreichen Versorgung, ohne Diagnosen oder Dosierungsanweisungen zu geben.",
      "Erfinde keine Nährwerte. Kennzeichne Schätzungen und Unsicherheiten. Bei medizinischen Fragen verweise auf eine qualifizierte medizinische Fachperson und eine erwachsene Vertrauensperson.",
      "Nutze Rezept- und Vorratsdaten nur als Kontext. Antworte auf Deutsch, klar und praktisch."
    ].join(" ");

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: system + "\nProfil- und Vorratskontext: " + JSON.stringify(safeContext) },
          { role: "user", content: message }
        ],
        max_tokens: 750,
        temperature: 0.35
      });
      const answer = result?.response || result?.result?.response || "";
      if (!answer) return json({ error: "Das KI-Modell hat keine Antwort zurückgegeben." }, 502);
      return json({ answer: String(answer).slice(0, 7000), model: MODEL });
    } catch (error) {
      return json({ error: "KI-Anfrage fehlgeschlagen. Bitte später erneut versuchen." }, 502);
    }
  }
};
