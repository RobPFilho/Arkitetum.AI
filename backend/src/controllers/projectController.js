import Project from "../models/Project.js";

const normalizeStringArray = (value) =>
  Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

const normalizeBudget = (body) => {
  const min = body.budgetMin !== undefined && body.budgetMin !== "" ? Number(body.budgetMin) : undefined;
  const max = body.budgetMax !== undefined && body.budgetMax !== "" ? Number(body.budgetMax) : undefined;
  if (min === undefined && max === undefined) return undefined;
  return { min: Number.isFinite(min) ? min : undefined, max: Number.isFinite(max) ? max : undefined };
};

export async function listProjects(req, res) {
  const projects = await Project.find({ client: req.user.id }).sort("-createdAt");
  res.json(projects);
}

export async function createProject(req, res) {
  if (!req.body.name?.trim())
    return res.status(400).json({ error: "Nome do projeto é obrigatório" });

  const project = await Project.create({
    client: req.user.id,
    name: req.body.name.trim(),
    preferredStyles: normalizeStringArray(req.body.preferredStyles),
    preferredMaterials: normalizeStringArray(req.body.preferredMaterials),
    budget: normalizeBudget(req.body),
    propertyType: req.body.propertyType,
    interventionType: req.body.interventionType,
    areaM2: req.body.areaM2 ? Number(req.body.areaM2) : undefined,
    familySize: req.body.familySize ? Number(req.body.familySize) : undefined,
    projectGoals: req.body.projectGoals,
    preferences: req.body.preferences,
  });
  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, client: req.user.id });
  if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

  const allowed = ["name", "propertyType", "interventionType", "projectGoals", "preferences"];
  for (const key of allowed) if (req.body[key] !== undefined) project[key] = req.body[key];
  if (req.body.familySize !== undefined) project.familySize = Number(req.body.familySize);
  if (req.body.areaM2 !== undefined) project.areaM2 = Number(req.body.areaM2);
  if (req.body.preferredStyles !== undefined) project.preferredStyles = normalizeStringArray(req.body.preferredStyles);
  if (req.body.preferredMaterials !== undefined) project.preferredMaterials = normalizeStringArray(req.body.preferredMaterials);
  if (req.body.budgetMin !== undefined || req.body.budgetMax !== undefined) project.budget = normalizeBudget(req.body);

  await project.save();
  res.json(project);
}

export async function deleteProject(req, res) {
  const project = await Project.findOneAndDelete({ _id: req.params.id, client: req.user.id });
  if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
  res.json({ ok: true });
}
