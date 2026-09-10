import Project from "../models/Project.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import MatchHistory from "../models/MatchHistory.js";
import Validation from "../models/Validation.js";
import Favorite from "../models/Favorite.js";
import Timeline from "../models/Timeline.js";
import CaseStudy from "../models/CaseStudy.js";
import ProfileView from "../models/ProfileView.js";
import { notify } from "../services/notificationService.js";
import { recomputeProfileFromPortfolio } from "../services/portfolioProfile.js";

export function getMe(req, res) {
  res.json(req.user);
}

/**
 * Portabilidade de dados (LGPD, art. 18): exporta tudo que o próprio usuário
 * gerou na plataforma em um único JSON.
 */
export async function exportMyData(req, res) {
  const userId = req.user.id;
  const [messages, matchHistory, validations, projects, reviewsGiven, reviewsReceived, favorites, timelines, caseStudies] =
    await Promise.all([
      Message.find({ $or: [{ from: userId }, { to: userId }] }).sort("createdAt"),
      req.user.role === "client" ? MatchHistory.find({ client: userId }).sort("createdAt") : [],
      Validation.find({ $or: [{ client: userId }, { architect: userId }] }),
      req.user.role === "client" ? Project.find({ client: userId }) : [],
      req.user.role === "client" ? Review.find({ client: userId }) : [],
      req.user.role === "architect" ? Review.find({ architect: userId }) : [],
      req.user.role === "client" ? Favorite.find({ client: userId }) : [],
      Timeline.find({ $or: [{ client: userId }, { architect: userId }] }),
      CaseStudy.find({ $or: [{ client: userId }, { architect: userId }] }),
    ]);

  res.setHeader("Content-Disposition", "attachment; filename=matchia-meus-dados.json");
  res.json({
    exportedAt: new Date().toISOString(),
    conta: req.user,
    projetos: projects,
    mensagens: messages,
    historicoDeBuscas: matchHistory,
    validacoesDeResumo: validations,
    avaliacoesEnviadas: reviewsGiven,
    avaliacoesRecebidas: reviewsReceived,
    arquitetosFavoritados: favorites,
    timelinesDeProjeto: timelines,
    casesDeSucesso: caseStudies,
  });
}

/**
 * Direito ao esquecimento (LGPD, art. 18, VI): apaga a conta e tudo que
 * referencia esse usuário nas outras coleções.
 */
export async function deleteMyAccount(req, res) {
  const userId = req.user.id;
  await Promise.all([
    Project.deleteMany({ client: userId }),
    Message.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
    Review.deleteMany({ $or: [{ client: userId }, { architect: userId }] }),
    MatchHistory.deleteMany({ client: userId }),
    Validation.deleteMany({ $or: [{ client: userId }, { architect: userId }] }),
    Favorite.deleteMany({ $or: [{ client: userId }, { architect: userId }] }),
    Timeline.deleteMany({ $or: [{ client: userId }, { architect: userId }] }),
    CaseStudy.deleteMany({ $or: [{ client: userId }, { architect: userId }] }),
    ProfileView.deleteMany({ architect: userId }),
  ]);
  await req.user.deleteOne();
  res.json({ ok: true });
}

export async function updateMe(req, res) {
  const allowed = ["name", "phone", "city", "state"];
  for (const key of allowed)
    if (req.body[key] !== undefined) req.user[key] = req.body[key];

  const wasUnavailable = req.user.role === "architect" && req.user.architectProfile?.availability === "unavailable";

  const profileKey = req.user.role + "Profile";
  if (req.body[profileKey]) {
    if (
      req.user.role === "architect" &&
      req.body[profileKey].favoriteMaterials?.length > 5
    )
      return res
        .status(400)
        .json({ error: "Architects can select at most five materials" });

    req.user[profileKey] = {
      ...req.user[profileKey].toObject(),
      ...req.body[profileKey],
    };
  }

  await req.user.save();
  res.json(req.user);

  if (wasUnavailable && req.user.architectProfile?.availability !== "unavailable") {
    notifyClientsArchitectAvailableAgain(req.user).catch((err) =>
      console.error("Falha ao notificar clientes sobre disponibilidade:", err.message),
    );
  }
}

/**
 * Um arquiteto que estava "indisponível" some da categoria principal do
 * match — o cliente só o vê na aba "compatível, mas indisponível". Quando
 * ele libera agenda de novo, avisa quem tinha esse arquiteto nessa categoria
 * numa busca recente, em vez de deixar essa mudança passar em silêncio.
 */
async function notifyClientsArchitectAvailableAgain(architect) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMatches = await MatchHistory.find({
    "results.architect": architect._id,
    "results.category": "unavailable",
    createdAt: { $gte: thirtyDaysAgo },
  })
    .sort("-createdAt")
    .limit(50);

  const clientIds = [...new Set(recentMatches.map((m) => String(m.client)))];
  await Promise.all(
    clientIds.map((clientId) =>
      notify(
        clientId,
        "availability",
        `${architect.name} está disponível de novo — pode valer a pena entrar em contato.`,
        `arquiteto.html?id=${architect.id}`,
      ),
    ),
  );
}

export async function addPortfolio(req, res) {
  req.user.architectProfile.portfolio.push(req.body);
  recomputeProfileFromPortfolio(req.user);
  await req.user.save();
  res.status(201).json(req.user.architectProfile.portfolio.at(-1));
}

/**
 * Edita uma peça de portfólio já existente (usada pelo drawer do painel).
 * Mesma lógica de casar por _id, título ou link do `deletePortfolio` — o
 * portfólio pré-existe a esse recurso e nem toda peça antiga ganhou um _id.
 */
export async function updatePortfolio(req, res) {
  if (req.user.role !== "architect")
    return res.status(403).json({ error: "Only architects can edit projects" });

  const targetId = String(req.params.id || "");
  const portfolio = req.user.architectProfile?.portfolio || [];
  const item = portfolio.find((project) =>
    String(project?._id || "") === targetId ||
    String(project?.title || "") === targetId ||
    String(project?.projectUrl || "") === targetId,
  );
  if (!item) return res.status(404).json({ error: "Project not found" });

  const allowed = ["title", "description", "imageUrl", "projectUrl", "status", "styles", "materials", "areaM2"];
  for (const key of allowed) if (req.body[key] !== undefined) item[key] = req.body[key];

  recomputeProfileFromPortfolio(req.user);
  await req.user.save();
  res.json(item);
}

export async function deletePortfolio(req, res) {
  if (req.user.role !== "architect")
    return res.status(403).json({ error: "Only architects can delete projects" });

  const targetId = String(req.params.id || "");
  const portfolio = req.user.architectProfile?.portfolio || [];
  const match = portfolio.find((project) =>
    String(project?._id || "") === targetId ||
    String(project?.title || "") === targetId ||
    String(project?.projectUrl || "") === targetId,
  );

  if (!match)
    return res.status(404).json({ error: "Project not found" });

  req.user.architectProfile.portfolio = portfolio.filter((project) =>
    String(project?._id || "") !== targetId &&
    String(project?.title || "") !== targetId &&
    String(project?.projectUrl || "") !== targetId,
  );

  recomputeProfileFromPortfolio(req.user);
  await req.user.save();
  res.status(200).json({ ok: true });
}

/**
 * Métricas do arquiteto (visualizações, taxa de resposta, aparições em
 * match, projetos validados) — hoje exibidas no painel como recurso Pro,
 * mas a checagem de plano é só visual no front-end (mesmo modelo dos outros
 * limites de plano do projeto, ver assets/js/extras.js).
 */
export async function getMyStats(req, res) {
  if (req.user.role !== "architect")
    return res.status(403).json({ error: "Métricas disponíveis só para arquitetos" });

  const architectId = req.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [views30d, matchAppearances, validationsConfirmed, receivedFrom, repliedTo] = await Promise.all([
    ProfileView.countDocuments({ architect: architectId, createdAt: { $gte: thirtyDaysAgo } }),
    MatchHistory.countDocuments({ "results.architect": architectId }),
    Validation.countDocuments({ architect: architectId, clientConfirmed: true, architectConfirmed: true }),
    Message.distinct("from", { to: architectId }),
    Message.distinct("to", { from: architectId }),
  ]);

  const repliedSet = new Set(repliedTo.map(String));
  const respondedCount = receivedFrom.filter((id) => repliedSet.has(String(id))).length;
  const responseRate = receivedFrom.length ? Math.round((respondedCount / receivedFrom.length) * 100) : null;

  res.json({
    views30d,
    matchAppearances,
    validationsConfirmed,
    conversationsReceived: receivedFrom.length,
    responseRate,
  });
}
