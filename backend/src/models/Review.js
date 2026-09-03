import mongoose from "mongoose";

export default mongoose.model(
  "Review",
  new mongoose.Schema(
    {
      client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true },
  ),
);
