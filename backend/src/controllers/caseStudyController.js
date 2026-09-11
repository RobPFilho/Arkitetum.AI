import CaseStudy from "../models/CaseStudy.js";
import Validation from "../models/Validation.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import MatchHistory from "../models/MatchHistory.js";
import { notify } from "../services/notificationService.js";
import { scoreToPercent } from "../services/scoringEngine.js";

const pairFor = (req) => {
  const otherId = req.params.otherId;
  return req.user.role === "client"
    ? { client: req.user.id, architect: otherId }
    : { client: otherId, architect: req.user.id };
};

async function requireValidated(pair, res) {
  const validation = await Validation.findOne(pair);
  if (!validation?.clientConfirmed || !validation?.architectConfirmed) {
    res.status(403).json({
      error: "O resumo do projeto precisa estar confirmado pelos dois lados antes de propor um case de sucesso.",
    });
    return false;
  }
  return true;
}

export async function getCaseStudy(req, res) {
  const pair = pairFor(req);
  const caseStudy = await CaseStudy.findOne(pair);
  res.json(caseStudy || null);
}

/** Preenche estilo/m²/compatibilidade a partir do projeto/peça de portfólio
 * indicados, melhor esforço — nunca bloqueia a publicação do case se algum
 * dado faltar. Compatibilidade vem do histórico de match mais recente entre
 * o par, já normalizada (0-100). */
async function deriveCaseStudyFields(pair, projectId, portfolioItemId) {
  const fields = {};
  if (projectId) {
    const project = await Project.findOne({ _id: projectId, client: pair.client });
    if (project?.areaM2) fields.areaM2 = project.areaM2;
  }
  if (portfolioItemId) {
    const architect = await User.findById(pair.architect);
    const item = architect?.architectProfile?.portfolio?.find((p) => String(p._id) === String(portfolioItemId));
    if (item?.styles?.length) fields.style = item.styles[0];
  }
  if (!fields.style) {
    const architect = await User.findById(pair.architect);
    if (architect?.architectProfile?.styles?.length) fields.style = architect.architectProfile.styles[0];
  }
  const history = await MatchHistory.findOne({ client: pair.client, "results.architect": pair.architect }).sort("-createdAt");
  const result = history?.results.find((r) => String(r.architect) === String(pair.architect));
  if (typeof result?.score === "number") fields.compatibilityScore = scoreToPercent(result.score);
  return fields;
}

// Só o arquiteto propõe conteúdo (título/descrição/imagens) — é o dono do
// portfólio. O cliente só entra com o testemunho e a aprovação do lado dele.
export async function proposeCaseStudy(req, res) {
  if (req.user.role !== "architect") return res.status(403).json({ error: "Só o arquiteto pode propor o case." });
  const pair = pairFor(req);
  if (!(await requireValidated(pair, res))) return;

  const { title, description, images, projectId, portfolioItemId } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Título é obrigatório." });

  const derived = await deriveCaseStudyFields(pair, projectId, portfolioItemId);

  const caseStudy = await CaseStudy.findOneAndUpdate(
    pair,
    {
      $set: {
        title: title.trim(),
        description: (description || "").trim(),
        images: Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [],
        architectApproved: true,
        clientApproved: false,
        ...derived,
      },
      $setOnInsert: pair,
    },
    { upsert: true, new: true },
  );
  res.json(caseStudy);

  notify(pair.client, "case-study", `${req.user.name} propôs um case de sucesso do projeto de vocês`, "dashboard.html");
}

export async function submitTestimonial(req, res) {
  if (req.user.role !== "client") return res.status(403).json({ error: "Só o cliente pode adicionar o testemunho." });
  const pair = pairFor(req);
  const { testimonial } = req.body || {};
  const caseStudy = await CaseStudy.findOneAndUpdate(
    pair,
    { $set: { testimonial: (testimonial || "").trim() } },
    { new: true },
  );
  if (!caseStudy) return res.status(404).json({ error: "O arquiteto ainda não propôs um case para este projeto." });
  res.json(caseStudy);
}

export async function approveCaseStudy(req, res) {
  const pair = pairFor(req);
  const field = req.user.role === "client" ? "clientApproved" : "architectApproved";
  const caseStudy = await CaseStudy.findOneAndUpdate(pair, { $set: { [field]: true } }, { new: true });
  if (!caseStudy) return res.status(404).json({ error: "Nenhum case proposto ainda." });
  res.json(caseStudy);

  if (caseStudy.clientApproved && caseStudy.architectApproved) {
    const otherId = req.user.role === "client" ? pair.architect : pair.client;
    const other = await User.findById(otherId);
    if (other) notify(otherId, "case-study", `Seu case de sucesso com ${req.user.name} foi publicado`, "dashboard.html");
  }
}

export async function listPublished(req, res) {
  const caseStudies = await CaseStudy.find({
    architect: req.params.architectId,
    architectApproved: true,
    clientApproved: true,
  })
    .populate("client", "name")
    .sort("-updatedAt");
  res.json(
    caseStudies
      .filter((c) => c.title)
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        images: c.images,
        testimonial: c.testimonial,
        clientName: c.client?.name,
        style: c.style,
        areaM2: c.areaM2,
        compatibilityScore: c.compatibilityScore,
      })),
  );
}

/**
 * Vitrine pública site-wide de "projetos que já viraram match" — usada no
 * lugar do showcase 3D em index.html/projetos.html. Só publicados
 * (aprovação mútua), sem exigir autenticação.
 */
export async function listFeatured(req, res) {
  const limit = Math.min(Number(req.query.limit) || 12, 24);
  const caseStudies = await CaseStudy.find({ architectApproved: true, clientApproved: true, title: { $ne: null } })
    .populate("architect", "name city state")
    .sort({ compatibilityScore: -1, updatedAt: -1 })
    .limit(limit);

  res.json(
    caseStudies
      .filter((c) => c.architect)
      .map((c) => ({
        id: c.id,
        title: c.title,
        image: c.images?.[0] || null,
        style: c.style,
        areaM2: c.areaM2,
        compatibilityScore: c.compatibilityScore,
        architectId: c.architect.id,
        architectName: c.architect.name,
        architectCity: [c.architect.city, c.architect.state].filter(Boolean).join(" · "),
      })),
  );
}
