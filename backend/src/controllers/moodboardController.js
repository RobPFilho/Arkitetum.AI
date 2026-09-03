import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSearchQuery, searchReferenceImage } from "../services/imageSearchService.js";

export async function generateReferenceImage(req, res) {
  const { styles = [], materials = [], keywords = [] } = req.body;
  const query = await buildSearchQuery(styles, materials, keywords);
  const photo = await searchReferenceImage(query);
  if (!photo) {
    return res.status(404).json({ error: "Não encontramos uma referência visual para esse estilo agora." });
  }
  res.json(photo);
}

export async function generateMoodboard(req, res) {
  const { styles = [], materials = [], keywords = [], colorTones = [] } = req.body;
  const fallback = {
    concept: `Um espaço ${styles[0] || "contemporâneo"} que combina ${materials.slice(0, 2).join(" e ") || "materiais naturais"}, com ${keywords.join(", ") || "luz natural e linhas limpas"}.`,
  };
  if (!process.env.GEMINI_API_KEY) return res.json(fallback);
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `Você é um assistente de arquitetura de interiores. Escreva em português do Brasil um parágrafo curto (máximo 60 palavras) descrevendo o conceito visual de um moodboard para um projeto com estas informações — estilos: ${styles.join(", ") || "não informado"}; materiais: ${materials.join(", ") || "não informado"}; palavras-chave: ${keywords.join(", ") || "não informado"}; tons de cor: ${colorTones.join(", ") || "não informado"}. Seja descritivo e inspirador, mas não invente materiais, cores ou estilos que não foram informados.`;
    const result = await model.generateContent(prompt);
    res.json({ concept: result.response.text().trim() });
  } catch (err) {
    console.error("Gemini indisponível, usando moodboard padrão:", err.message);
    res.json(fallback);
  }
}
