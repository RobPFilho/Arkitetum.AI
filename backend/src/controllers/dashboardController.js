import Project from "../models/Project.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import MatchHistory from "../models/MatchHistory.js";
import Validation from "../models/Validation.js";

export function getMe(req, res) {
  res.json(req.user);
}

/**
 * Portabilidade de dados (LGPD, art. 18): exporta tudo que o próprio usuário
 * gerou na plataforma em um único JSON.
 */
export async function exportMyData(req, res) {
  const userId = req.user.id;
  const [messages, matchHistory, validations, projects, reviewsGiven, reviewsReceived] =
    await Promise.all([
      Message.find({ $or: [{ from: userId }, { to: userId }] }).sort("createdAt"),
      req.user.role === "client" ? MatchHistory.find({ client: userId }).sort("createdAt") : [],
      Validation.find({ $or: [{ client: userId }, { architect: userId }] }),
      req.user.role === "client" ? Project.find({ client: userId }) : [],
      req.user.role === "client" ? Review.find({ client: userId }) : [],
      req.user.role === "architect" ? Review.find({ architect: userId }) : [],
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
  ]);
  await req.user.deleteOne();
  res.json({ ok: true });
}

export async function updateMe(req, res) {
  const allowed = ["name", "phone", "city", "state"];
  for (const key of allowed)
    if (req.body[key] !== undefined) req.user[key] = req.body[key];

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
}

export async function addPortfolio(req, res) {
  req.user.architectProfile.portfolio.push(req.body);
  await req.user.save();
  res.status(201).json(req.user.architectProfile.portfolio.at(-1));
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

  await req.user.save();
  res.status(200).json({ ok: true });
}
