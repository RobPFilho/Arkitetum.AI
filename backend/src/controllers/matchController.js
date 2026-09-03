import User from "../models/User.js";
import Project from "../models/Project.js";
import MatchHistory from "../models/MatchHistory.js";
import { rankArchitects } from "../services/scoringEngine.js";
import { explainCompatibility } from "../services/geminiService.js";

export async function runMatch(req, res) {
  const { projectId } = req.body || {};
  let project = null;
  if (projectId) {
    project = await Project.findOne({ _id: projectId, client: req.user.id });
    if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
  }

  const clientForScoring = project
    ? {
        city: req.user.city,
        state: req.user.state,
        clientProfile: {
          preferredStyles: project.preferredStyles,
          preferredMaterials: project.preferredMaterials,
          budget: project.budget,
          propertyType: project.propertyType,
          familySize: project.familySize,
          projectGoals: project.projectGoals,
          preferences: project.preferences,
        },
      }
    : req.user;

  const architects = await User.find({
    role: "architect",
    "architectProfile.availability": { $ne: "unavailable" },
  }).populate("architectProfile.favoriteMaterials");
  const ranked = rankArchitects(clientForScoring, architects);
  const results = await Promise.all(
    ranked.map(async ({ architect, score, reasons, breakdown }) => ({
      architect: {
        id: architect.id,
        name: architect.name,
        email: architect.email,
        phone: architect.phone,
        city: architect.city,
        state: architect.state,
        profile: architect.architectProfile,
      },
      score,
      breakdown,
      explanation: await explainCompatibility(clientForScoring, architect, reasons),
    })),
  );
  await MatchHistory.create({
    client: req.user.id,
    project: project?.id,
    results: results.map((r) => ({
      architect: r.architect.id,
      score: r.score,
      explanation: r.explanation,
    })),
  });
  res.json({ results, project: project ? { id: project.id, name: project.name } : null });
}

export async function listMatchHistory(req, res) {
  const history = await MatchHistory.find({ client: req.user.id })
    .populate("project", "name")
    .populate("results.architect", "name city state")
    .sort("-createdAt")
    .limit(20);
  res.json(history);
}
