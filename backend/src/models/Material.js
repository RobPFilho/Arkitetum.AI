import mongoose from "mongoose";
export default mongoose.model(
  "Material",
  new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      category: String,
      description: String,
      imageUrl: String,
    },
    { timestamps: true },
  ),
);
