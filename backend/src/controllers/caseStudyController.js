import CaseStudy from "../models/CaseStudy.js";
import Validation from "../models/Validation.js";
import User from "../models/User.js";
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

  const { title, description, images } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Título é obrigatório." });

  const caseStudy = await CaseStudy.findOneAndUpdate(
    pair,
    {
      $set: {
        title: title.trim(),
        description: (description || "").trim(),
        images: Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [],
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
