import mongoose from "mongoose";

const PHASES = ["Contato inicial", "Briefing", "Conceito", "Desenvolvimento", "Entrega"];

const timelineSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phase: { type: Number, default: 0, min: 0, max: PHASES.length - 1 },
    history: [
      {
        phase: Number,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
timelineSchema.index({ client: 1, architect: 1 }, { unique: true });

timelineSchema.statics.PHASES = PHASES;

export default mongoose.model("Timeline", timelineSchema);
