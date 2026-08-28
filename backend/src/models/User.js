import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    imageUrl: String,
    projectUrl: String,
    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "completed",
    },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["client", "architect"] },
    city: String,
    state: String,
    clientProfile: {
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
    },
    architectProfile: {
      styles: [String],
      specialties: [String],
      yearsExperience: Number,
      workingAreas: [String],
      favoriteMaterials: [String],
      bio: String,
      website: String,
      instagram: String,
      availability: {
        type: String,
        enum: ["available", "limited", "unavailable"],
        default: "available",
      },
      portfolio: [projectSchema],
    },
  },
  { timestamps: true },
);

userSchema.pre("validate", function (next) {
  if (this.role === "client" && !this.clientProfile) this.clientProfile = {};
  if (this.role === "architect" && !this.architectProfile)
    this.architectProfile = {};
  next();
});

userSchema.pre("save", async function (next) {
  if (this.isModified("passwordHash"))
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", userSchema);
