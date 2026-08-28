export function getMe(req, res) {
  res.json(req.user);
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
