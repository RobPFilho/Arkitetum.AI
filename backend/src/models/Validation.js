import mongoose from "mongoose";

const validationSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientConfirmed: { type: Boolean, default: false },
    architectConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true },
);
validationSchema.index({ client: 1, architect: 1 }, { unique: true });

export default mongoose.model("Validation", validationSchema);
