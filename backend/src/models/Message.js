import mongoose from "mongoose";

export default mongoose.model(
  "Message",
  new mongoose.Schema(
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true, trim: true, maxlength: 2000 },
      read: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
