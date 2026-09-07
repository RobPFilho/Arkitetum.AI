import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
favoriteSchema.index({ client: 1, architect: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
