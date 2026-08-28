import User from "../models/User.js";
import MatchHistory from "../models/MatchHistory.js";
import { rankArchitects } from "../services/scoringEngine.js";
import { explainCompatibility } from "../services/geminiService.js";
export async function runMatch(req, res) {
  const architects = await User.find({
    role: "architect",
    "architectProfile.availability": { $ne: "unavailable" },
  }).populate("architectProfile.favoriteMaterials");
  const ranked = rankArchitects(req.user, architects);
  const results = await Promise.all(
    ranked.map(async ({ architect, score, reasons }) => ({
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
      explanation: await explainCompatibility(req.user, architect, reasons),
    })),
  );
  await MatchHistory.create({
    client: req.user.id,
    results: results.map((r) => ({
      architect: r.architect.id,
      score: r.score,
      explanation: r.explanation,
    })),
  });
  res.json({ results });
}
