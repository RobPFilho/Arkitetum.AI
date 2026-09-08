import Timeline from "../models/Timeline.js";
import User from "../models/User.js";
import { notify } from "../services/notificationService.js";

const pairFor = (req) => {
  const otherId = req.params.otherId;
  return req.user.role === "client"
    ? { client: req.user.id, architect: otherId }
    : { client: otherId, architect: req.user.id };
};

export async function getTimeline(req, res) {
  const pair = pairFor(req);
  const timeline = await Timeline.findOne(pair);
  res.json({ phase: timeline?.phase || 0, phases: Timeline.PHASES });
}

export async function advanceTimeline(req, res) {
  const pair = pairFor(req);
  const existing = await Timeline.findOne(pair);
  const nextPhase = Math.min((existing?.phase || 0) + 1, Timeline.PHASES.length - 1);

  const timeline = await Timeline.findOneAndUpdate(
    pair,
    {
      $set: { phase: nextPhase },
      $push: { history: { phase: nextPhase, changedBy: req.user.id } },
      $setOnInsert: pair,
    },
    { upsert: true, new: true },
  );

  res.json({ phase: timeline.phase, phases: Timeline.PHASES });

  const otherId = req.user.role === "client" ? pair.architect : pair.client;
  const other = await User.findById(otherId);
  if (other) {
    notify(
      otherId,
      "timeline",
      `${req.user.name} avançou o projeto para a etapa "${Timeline.PHASES[nextPhase]}"`,
      "dashboard.html",
    );
  }
}
