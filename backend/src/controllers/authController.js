import jwt from "jsonwebtoken";
import User from "../models/User.js";

const tokenFor = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const common = (body) => ({
  name: body.name,
  email: body.email,
  phone: body.phone,
  passwordHash: body.password,
  city: body.city,
  state: body.state,
});

const normalizeStringArray = (value) =>
  Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      : [];

const normalizeBudget = (body) => {
  const min = body.budgetMin !== undefined && body.budgetMin !== ""
    ? Number(body.budgetMin)
    : undefined;
  const max = body.budgetMax !== undefined && body.budgetMax !== ""
    ? Number(body.budgetMax)
    : undefined;

  if (min === undefined && max === undefined) return undefined;

  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
};

export async function register(req, res) {
  const role = req.params.role;
  if (!["client", "architect"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  const { password, confirmPassword } = req.body;
  if (!password || password !== confirmPassword)
    return res.status(400).json({ error: "Passwords do not match" });

  const email = String(req.body.email || "").toLowerCase();
  if (await User.exists({ email }))
    return res.status(409).json({ error: "Email is already registered" });

  const profile =
    role === "client"
      ? {
        preferredStyles: normalizeStringArray(req.body.preferredStyles),
        preferredMaterials: req.body.preferredMaterials || [],
        budget: normalizeBudget(req.body),
        propertyType: req.body.propertyType,
        familySize: req.body.familySize ? Number(req.body.familySize) : undefined,
        projectGoals: req.body.projectGoals,
        preferences: req.body.preferences,
      }
      : {
        styles: normalizeStringArray(req.body.styles),
        specialties: normalizeStringArray(req.body.specialties),
        yearsExperience: req.body.yearsExperience
          ? Number(req.body.yearsExperience)
          : undefined,
        workingAreas: normalizeStringArray(req.body.workingAreas),
        favoriteMaterials: (req.body.favoriteMaterials || []).slice(0, 5),
        bio: req.body.bio,
        website: req.body.website,
        instagram: req.body.instagram,
        availability: req.body.availability || "available",
      };

  const user = await User.create({
    ...common({ ...req.body, email }),
    role,
    [role + "Profile"]: profile,
  });

  res.status(201).json({
    token: tokenFor(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
}

export async function login(req, res) {
  const user = await User.findOne({
    email: req.body.email?.toLowerCase(),
  }).select("+passwordHash");
  if (!user || !(await user.verifyPassword(req.body.password || "")))
    return res.status(401).json({ error: "Invalid email or password" });

  res.json({
    token: tokenFor(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
}
