import { Router } from "express";
import { BusinessController } from "../controllers/business.controller.js";
import { SessionController } from "../controllers/session.controller.js";
import { requireSession } from "../middleware/require-session.js";

const router = Router();

// 1. Technician Authentication & Self-Signup
router.post("/workers/login", BusinessController.workerLogin);
router.post("/workers/signup", BusinessController.technicianSignup);

// 2. Better Auth-backed account workspace and business creation.
router.get("/me", requireSession, SessionController.me);
router.post("/", requireSession, SessionController.createBusiness);

// 3. Business Profiles
router.get("/", BusinessController.getAllBusinesses);
router.get("/:businessId", BusinessController.getBusinessById);

// 4. Team & Workers Management
router.get("/:businessId/workers", BusinessController.getWorkers);
router.post("/:businessId/workers", BusinessController.addWorker);

export default router;
