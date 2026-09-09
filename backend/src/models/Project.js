import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    preferredStyles: [String],
    preferredMaterials: [String],
    budget: {
      min: { type: Number, default: undefined },
      max: { type: Number, default: undefined },
    },
    propertyType: String,
    // O que o cliente quer fazer (construir do zero ou reformar) — pergunta
    // própria porque é uma decisão diferente do tipo de imóvel.
    interventionType: { type: String, enum: ["Construção", "Reforma"] },
    // Critério de match principal (no lugar de orçamento como pergunta de
    // entrada) — ver scoringEngine.js.
    areaM2: Number,
    familySize: Number,
    projectGoals: String,
    preferences: String,
  },
  { timestamps: true },
);

export default mongoose.model("Project", projectSchema);
