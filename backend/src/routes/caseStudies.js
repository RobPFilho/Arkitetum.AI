import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getCaseStudy,
  proposeCaseStudy,
  submitTestimonial,
  approveCaseStudy,
  listPublished,
} from "../controllers/caseStudyController.js";

const router = Router();
router.get("/architect/:architectId", asyncHandler(listPublished));
router.use(requireAuth);
router.get("/:otherId", asyncHandler(getCaseStudy));
router.post("/:otherId", asyncHandler(proposeCaseStudy));
router.post("/:otherId/testimonial", asyncHandler(submitTestimonial));
router.post("/:otherId/approve", asyncHandler(approveCaseStudy));
export default router;
