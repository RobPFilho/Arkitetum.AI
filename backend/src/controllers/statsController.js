import User from "../models/User.js";
import MatchHistory from "../models/MatchHistory.js";

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
    // O motor de scoring soma até 100 pontos (30+15+20+15+10+10), então a
    // pontuação já equivale diretamente a uma porcentagem de compatibilidade.
    avgCompatibility: avg ? Math.round(avg) : null,
    totalMatches: scoreAgg[0]?.count || 0,
  });
}
