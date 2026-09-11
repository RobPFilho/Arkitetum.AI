import Commission from "../models/Commission.js";

export async function listMine(req, res) {
  const commissions = await Commission.find({ architect: req.user.id })
    .populate("client", "name")
    .populate("project", "name")
    .sort("-createdAt");

  res.json({
    total: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
    count: commissions.length,
    commissions: commissions.map((c) => ({
      id: c.id,
      clientName: c.client?.name,
      projectName: c.project?.name,
      amount: c.amount,
      rate: c.rate,
      estimatedValue: c.estimatedValue,
      createdAt: c.createdAt,
    })),
  });
}
