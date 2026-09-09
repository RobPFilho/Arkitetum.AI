import Validation from "../models/Validation.js";
import User from "../models/User.js";
import { validationClosedEmail } from "../services/emailService.js";
import { notify } from "../services/notificationService.js";

// Comissão de sucesso — segunda proposta de monetização da mentoria final
// (Teresa/Adriano): cobrar uma fração só quando um match vira projeto
// fechado, em vez de depender só de assinatura fixa. Simulada (mesmo nível
// de acabamento do checkout de planos, que também não processa pagamento
// real) — usa o orçamento informado no cadastro do cliente como estimativa
// de valor do projeto; sem orçamento informado, não há número pra estimar.
const COMMISSION_RATE = 0.03;
function estimateCommission(client) {
  const budget = client.clientProfile?.budget;
  if (!budget?.min && !budget?.max) return null;
  const mid = budget.min && budget.max ? (budget.min + budget.max) / 2 : budget.min || budget.max;
  return Math.round(mid * COMMISSION_RATE);
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

      const commission = estimateCommission(client);
      const commissionMessage = commission
        ? `Projeto fechado pela plataforma com ${client.name} — comissão de sucesso simulada (${COMMISSION_RATE * 100}%): R$ ${commission.toLocaleString("pt-BR")}`
        : `Projeto fechado pela plataforma com ${client.name} — comissão de sucesso se aplicaria aqui (sem orçamento informado para estimar).`;
      notify(architect.id, "commission", commissionMessage, "dashboard.html");
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
