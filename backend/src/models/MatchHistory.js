import mongoose from "mongoose";
export default mongoose.model(
  "MatchHistory",
  new mongoose.Schema(
    {
      client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      results: [
        {
          architect: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          score: Number,
          explanation: String,
        },
      ],
    },
    { timestamps: true },
  ),
);
