import User from "../models/User.js";
import MatchHistory from "../models/MatchHistory.js";
import { scoreToPercent } from "../services/scoringEngine.js";

export async function getPublicStats(req, res) {
  const [architects, clients, scoreAgg] = await Promise.all([
    User.countDocuments({ role: "architect" }),
    User.countDocuments({ role: "client" }),
    MatchHistory.aggregate([
      { $unwind: "$results" },
      { $group: { _id: null, avgScore: { $avg: "$results.score" }, count: { $sum: 1 } } },
    ]),
  ]);

  const avg = scoreAgg[0]?.avgScore;
  res.json({
    architects,
    clients,
    // Normalizado pelo teto real do motor de scoring (115, não 100 — ver
    // scoreToPercent) pra nunca mostrar mais de 100% de compatibilidade.
    avgCompatibility: avg ? scoreToPercent(avg) : null,
    totalMatches: scoreAgg[0]?.count || 0,
  });
}
