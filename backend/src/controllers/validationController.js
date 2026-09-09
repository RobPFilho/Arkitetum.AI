import Validation from "../models/Validation.js";
import Commission from "../models/Commission.js";
import User from "../models/User.js";
import { validationClosedEmail } from "../services/emailService.js";
import { notify } from "../services/notificationService.js";

// Comissão de sucesso — única monetização do lado do arquiteto, por pedido
// direto da mentoria final (Teresa/Adriano: "o cliente não paga"; a
// prioridade de exibição vem de mérito — nota + volume fechado, no estilo
// Superhost do Airbnb — não de assinatura). Simulada (mesmo nível de
// acabamento do resto do protótipo, sem gateway real) — usa o orçamento
// informado pelo cliente como estimativa de valor do projeto; sem
// orçamento, o fechamento ainda conta pro histórico e pro mérito, só não
// tem valor em R$ pra mostrar.
const COMMISSION_RATE = 0.03;
function estimateProjectValue(client) {
  const budget = client.clientProfile?.budget;
  if (!budget?.min && !budget?.max) return null;
  return budget.min && budget.max ? (budget.min + budget.max) / 2 : budget.min || budget.max;
}

const pairFor = (req) => {
  const otherId = req.params.otherId;
  return req.user.role === "client"
    ? { client: req.user.id, architect: otherId }
    : { client: otherId, architect: req.user.id };
};

export async function getValidation(req, res) {
  const pair = pairFor(req);
  const validation = await Validation.findOne(pair);
  res.json({
    clientConfirmed: validation?.clientConfirmed || false,
    architectConfirmed: validation?.architectConfirmed || false,
  });
}

export async function confirmValidation(req, res) {
  const pair = pairFor(req);
  const field = req.user.role === "client" ? "clientConfirmed" : "architectConfirmed";
  const before = await Validation.findOne(pair);
  const wasFullyConfirmed = Boolean(before?.clientConfirmed && before?.architectConfirmed);

  const validation = await Validation.findOneAndUpdate(
    pair,
    { $set: { [field]: true }, $setOnInsert: pair },
    { upsert: true, new: true },
  );

  res.json({
    clientConfirmed: validation.clientConfirmed,
    architectConfirmed: validation.architectConfirmed,
  });

  const nowFullyConfirmed = validation.clientConfirmed && validation.architectConfirmed;
  if (nowFullyConfirmed && !wasFullyConfirmed) {
    const [client, architect] = await Promise.all([
      User.findById(validation.client),
      User.findById(validation.architect),
    ]);
    if (client && architect) {
      validationClosedEmail(client, architect).catch(() => {});
      validationClosedEmail(architect, client).catch(() => {});
      notify(client.id, "validation", `Resumo do projeto confirmado com ${architect.name}`, `arquiteto.html?id=${architect.id}`);
      notify(architect.id, "validation", `Resumo do projeto confirmado com ${client.name}`, `dashboard.html`);

      const estimatedProjectValue = estimateProjectValue(client);
      const amount = estimatedProjectValue ? Math.round(estimatedProjectValue * COMMISSION_RATE) : null;
      await Commission.findOneAndUpdate(
        { architect: architect.id, client: client.id },
        {
          $setOnInsert: {
            architect: architect.id,
            client: client.id,
            rate: COMMISSION_RATE,
            estimatedProjectValue: estimatedProjectValue || undefined,
            amount: amount || undefined,
            estimated: true,
          },
        },
        { upsert: true },
      );

      const commissionMessage = amount
        ? `Projeto fechado pela plataforma com ${client.name} — comissão de sucesso simulada (${COMMISSION_RATE * 100}%): R$ ${amount.toLocaleString("pt-BR")}`
        : `Projeto fechado pela plataforma com ${client.name} — comissão de sucesso se aplicaria aqui (sem orçamento informado para estimar).`;
      notify(architect.id, "commission", commissionMessage, "dashboard.html#comissoes");
    }
  }
}

export async function listPendingForArchitect(req, res) {
  const pending = await Validation.find({
    architect: req.user.id,
    clientConfirmed: true,
    architectConfirmed: false,
  }).populate("client", "name");
  res.json(pending.map((v) => ({ client: { id: v.client.id, name: v.client.name } })));
}

// Pares onde os dois lados já confirmaram o resumo — pré-requisito pro
// arquiteto propor um case de sucesso (ver caseStudyController.requireValidated).
export async function listConfirmedForArchitect(req, res) {
  const confirmed = await Validation.find({
    architect: req.user.id,
    clientConfirmed: true,
    architectConfirmed: true,
  }).populate("client", "name");
  res.json(confirmed.map((v) => ({ client: { id: v.client.id, name: v.client.name } })));
}
