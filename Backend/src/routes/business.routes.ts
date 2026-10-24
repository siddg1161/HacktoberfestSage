import { Router } from "express";
import { BusinessController } from "../controllers/business.controller.js";
import { SessionController } from "../controllers/session.controller.js";
import { requireBusinessManager, requireBusinessMember, requireSession } from "../middleware/require-session.js";

const router = Router();

// Better Auth-backed account workspace and business creation.
router.get("/me", requireSession, SessionController.me);
router.post("/", requireSession, SessionController.createBusiness);

// Team data is tenant-scoped and only managers can invite a worker.
router.get("/:businessId/workers", requireSession, requireBusinessMember, BusinessController.getWorkers);
router.post("/:businessId/workers", requireSession, requireBusinessManager, BusinessController.addWorker);

// The legacy PIN endpoints were intentionally removed. Sign in through
// /api/auth/* and then load the account workspace from /api/business/me.

export default router;
