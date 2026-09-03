import { GoogleGenerativeAI } from "@google/generative-ai";

// Tradução simples de fallback (sem custo, sem depender da IA) — cobre o
// vocabulário fixo de estilos e materiais usado no cadastro. Só entra em
// ação se a chamada ao Gemini falhar.
const PT_EN = {
  "moderno": "modern", "contemporâneo": "contemporary", "minimalista": "minimalist",
  "industrial": "industrial", "clássico": "classic", "rústico": "rustic",
  "escandinavo": "scandinavian", "biofílico": "biophilic", "brutalista": "brutalist",
  "alto padrão": "luxury", "concreto aparente": "exposed concrete", "madeira de demolição": "reclaimed wood",
  "vidro": "glass", "aço": "steel", "tijolo aparente": "exposed brick", "mármore carrara": "carrara marble",
  "granito": "granite", "travertino": "travertine", "ardósia": "slate", "carvalho": "oak walnut wood",
  "cortiça": "cork", "bambu": "bamboo", "porcelanato": "porcelain tile", "alumínio": "aluminum",
};

function fallbackQuery(styles = [], materials = [], keywords = []) {
  const translate = (arr) => arr.map((w) => PT_EN[w.toLowerCase()] || w).join(" ");
  const parts = [translate(styles), translate(materials), translate(keywords)].filter(Boolean);
  return `${parts.join(" ")} interior architecture`.trim();
}

export async function buildSearchQuery(styles = [], materials = [], keywords = []) {
  if (!process.env.GEMINI_API_KEY) return fallbackQuery(styles, materials, keywords);
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `Traduza estas preferências de projeto de arquitetura/interiores para uma busca curta em inglês (no máximo 8 palavras), no estilo usado em bancos de fotos como Unsplash. Responda só com a busca, sem explicações nem aspas. Estilos: ${styles.join(", ") || "não informado"}. Materiais: ${materials.join(", ") || "não informado"}. Palavras-chave: ${keywords.join(", ") || "não informado"}.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^["']|["']$/g, "");
    return text || fallbackQuery(styles, materials, keywords);
  } catch (err) {
    console.error("Gemini indisponível para traduzir busca de imagem, usando fallback:", err.message);
    return fallbackQuery(styles, materials, keywords);
  }
}

export async function searchReferenceImage(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
  });
  if (!res.ok) {
    console.error("Unsplash indisponível:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;

  const utm = "utm_source=matchia&utm_medium=referral";
  return {
    imageUrl: photo.urls.regular,
    thumbUrl: photo.urls.small,
    description: photo.alt_description || query,
    photographerName: photo.user.name,
    photographerUrl: `${photo.user.links.html}?${utm}`,
    unsplashUrl: `https://unsplash.com/?${utm}`,
  };
}
