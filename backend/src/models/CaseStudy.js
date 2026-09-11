import mongoose from "mongoose";

const caseStudySchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1500 },
    images: [String],
    testimonial: { type: String, trim: true, maxlength: 800 },
    style: String,
    areaM2: Number,
    compatibilityScore: Number,
    architectApproved: { type: Boolean, default: false },
    clientApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);
caseStudySchema.index({ client: 1, architect: 1 }, { unique: true });
caseStudySchema.virtual("published").get(function () {
  return Boolean(this.architectApproved && this.clientApproved && this.title);
});
caseStudySchema.set("toJSON", { virtuals: true });

export default mongoose.model("CaseStudy", caseStudySchema);
