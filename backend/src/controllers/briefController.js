import User from "../models/User.js";
import { generateProjectBrief } from "../services/geminiService.js";

export async function getBrief(req, res) {
  const architect = await User.findOne({ _id: req.params.architectId, role: "architect" });
  if (!architect) return res.status(404).json({ error: "Arquiteto não encontrado" });
  const brief = await generateProjectBrief(req.user, architect);
  res.json(brief);
}
