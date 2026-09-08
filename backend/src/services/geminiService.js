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

function fallbackBrief(client, architect) {
  const p = client.clientProfile || {};
  return {
    resumo: `${client.name} busca um projeto ${p.propertyType ? `de ${p.propertyType.toLowerCase()}` : ""} com ${architect.name}, no estilo ${(p.preferredStyles || []).join(", ") || "a definir"}.`,
    objetivos: p.projectGoals || "Não informado pelo cliente ainda — combine isso na primeira conversa.",
    estiloEMateriais: [...(p.preferredStyles || []), ...(p.preferredMaterials || [])].join(", ") || "Não informado.",
    orcamento: p.budget?.min || p.budget?.max ? `R$${p.budget.min || 0} a R$${p.budget.max || "?"}` : "Não informado.",
    restricoes: p.preferences || "Nenhuma restrição adicional informada.",
    proximosPassos: "Marcar uma primeira conversa para alinhar expectativas e cronograma.",
  };
}

/**
 * Brief estruturado pro arquiteto começar o projeto sem precisar reconstruir
 * o contexto do zero a partir do questionário espalhado — mesmo padrão de
 * timeout/fallback do explainCompatibility, porque isso roda a partir de um
 * clique do usuário no painel (precisa responder rápido ou falhar rápido).
 */
export async function generateProjectBrief(client, architect) {
  const fallback = fallbackBrief(client, architect);
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });
    const prompt = `Você é um assistente que transforma o questionário de um cliente em um brief estruturado para o arquiteto começar o projeto. Responda em português do Brasil, APENAS com um objeto JSON válido (sem markdown, sem texto fora do JSON) com estas chaves de string: resumo (2-3 frases), objetivos, estiloEMateriais, orcamento, restricoes, proximosPassos (uma sugestão prática de primeiro passo). Não invente fatos que não estejam nos dados abaixo. Dados do cliente: ${JSON.stringify(client.clientProfile)}. Dados do arquiteto: ${JSON.stringify({ name: architect.name, styles: architect.architectProfile?.styles })}.`;
    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    const parsed = JSON.parse(result.response.text());
    return { ...fallback, ...parsed };
  } catch (err) {
    console.error("Gemini indisponível, usando brief padrão:", err.message);
    return fallback;
  }
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
