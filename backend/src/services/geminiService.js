import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_TIMEOUT_MS = 8000;

// O SDK do Gemini não tem timeout embutido — se a chamada travar em vez de
// falhar rápido (visto em produção sob alta demanda), o match inteiro fica
// pendurado esperando pra sempre. Corrida contra um timeout garante que o
// cliente sempre recebe uma resposta (a explicação padrão, na pior das
// hipóteses) em vez de nunca receber nada.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), ms)),
  ]);
}

export async function explainCompatibility(client, architect, reasons) {
  const fallback = `${architect.name} ${reasons.length ? `é uma ótima opção por ${reasons.join(", ")}` : "é uma opção promissora com base nas informações disponíveis no perfil"}.`;
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `Escreva em português do Brasil uma explicação amigável e concisa de compatibilidade, com no máximo 55 palavras. Não invente fatos, contatos ou pontuações. Preferências do cliente: ${JSON.stringify(client.clientProfile)}. Perfil do arquiteto: ${JSON.stringify(architect.architectProfile)}. Motivos de compatibilidade verificados: ${reasons.join(", ")}.`;
    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini indisponível, usando explicação padrão:", err.message);
    return fallback;
  }
}
