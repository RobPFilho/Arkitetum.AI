import User from "../models/User.js";

export async function getArchitectProfile(req, res) {
  const architect = await User.findOne({
    _id: req.params.id,
    role: "architect",
  }).populate("architectProfile.favoriteMaterials");
  if (!architect)
    return res.status(404).json({ error: "Arquiteto não encontrado" });
  res.json({
    id: architect.id,
    name: architect.name,
    email: architect.email,
    phone: architect.phone,
    city: architect.city,
    state: architect.state,
    profile: architect.architectProfile,
  });
}
