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
    familySize: Number,
    projectGoals: String,
    preferences: String,
    areaM2: Number,
    status: {
      type: String,
      enum: ["draft", "matching", "in_progress", "completed"],
      default: "draft",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Project", projectSchema);
