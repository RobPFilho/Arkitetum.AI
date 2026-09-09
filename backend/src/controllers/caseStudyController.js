import CaseStudy from "../models/CaseStudy.js";
import Validation from "../models/Validation.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Commission from "../models/Commission.js";
import { notify } from "../services/notificationService.js";

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

// Só o arquiteto propõe conteúdo (título/descrição/imagens) — é o dono do
// portfólio. O cliente só entra com o testemunho e a aprovação do lado dele.
export async function proposeCaseStudy(req, res) {
  if (req.user.role !== "architect") return res.status(403).json({ error: "Só o arquiteto pode propor o case." });
  const pair = pairFor(req);
  if (!(await requireValidated(pair, res))) return;

  const { title, description, images, style, areaM2 } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Título é obrigatório." });

  const caseStudy = await CaseStudy.findOneAndUpdate(
    pair,
    {
      $set: {
        title: title.trim(),
        description: (description || "").trim(),
        images: Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [],
        style: style || undefined,
        areaM2: areaM2 ? Number(areaM2) : undefined,
        architectApproved: true,
        clientApproved: false,
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
      })),
  );
}

/**
 * Vitrine pública site-wide de "projetos que já viraram match" — usada no
 * lugar do showcase 3D em index.html/projetos.html. Prioridade de exibição
 * é por mérito (quantos projetos esse arquiteto já fechou pela plataforma +
 * nota média), nunca por assinatura — o cliente não paga e o arquiteto
 * também não compra posição, só ganha com volume e qualidade entregue
 * (mesma lógica do selo "Superhost" do Airbnb).
 */
export async function listAllPublished(req, res) {
  const limit = Math.min(Number(req.query.limit) || 12, 24);
  const caseStudies = await CaseStudy.find({ architectApproved: true, clientApproved: true, title: { $ne: null } })
    .populate("architect", "name city state")
    .sort("-updatedAt")
    .limit(60);

  const architectIds = [...new Map(caseStudies.filter((c) => c.architect).map((c) => [String(c.architect._id), c.architect._id])).values()];
  const [ratings, closedCounts] = await Promise.all([
    Review.aggregate([
      { $match: { architect: { $in: architectIds } } },
      { $group: { _id: "$architect", avg: { $avg: "$rating" } } },
    ]),
    Commission.aggregate([
      { $match: { architect: { $in: architectIds } } },
      { $group: { _id: "$architect", count: { $sum: 1 } } },
    ]),
  ]);
  const ratingMap = new Map(ratings.map((r) => [String(r._id), r.avg]));
  const closedMap = new Map(closedCounts.map((c) => [String(c._id), c.count]));

  const shaped = caseStudies
    .filter((c) => c.architect)
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      image: c.images?.[0] || null,
      style: c.style,
      areaM2: c.areaM2,
      architectName: c.architect.name,
      architectCity: [c.architect.city, c.architect.state].filter(Boolean).join(" · "),
      closedProjects: closedMap.get(String(c.architect._id)) || 0,
      rating: ratingMap.get(String(c.architect._id)) || 0,
      updatedAt: c.updatedAt,
    }))
    .sort((a, b) => {
      if (b.closedProjects !== a.closedProjects) return b.closedProjects - a.closedProjects;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .slice(0, limit);

  res.json(shaped);
}
