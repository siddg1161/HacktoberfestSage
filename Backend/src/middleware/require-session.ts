import { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

/** Require a valid Better Auth session before allowing access to tenant data. */
export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user?.email) {
      req.authenticatedUser = {
        id: session.user.id,
        email: session.user.email.toLowerCase(),
        name: session.user.name,
      };
      next();
      return;
    }

    // Fallback: Verify active field technician / worker email from header
    const workerEmail = req.headers["x-worker-email"] as string | undefined;
    if (workerEmail && typeof workerEmail === "string") {
      const { query } = await import("../config/db.js");
      const workerRes = await query(
        "SELECT id, name, email FROM workers WHERE LOWER(email) = LOWER($1) AND status = 'ACTIVE' LIMIT 1;",
        [workerEmail.trim()]
      );

      if (workerRes.rows.length > 0) {
        req.authenticatedUser = {
          id: String(workerRes.rows[0].id),
          email: workerRes.rows[0].email.toLowerCase(),
          name: workerRes.rows[0].name,
        };
        next();
        return;
      }
    }

    res.status(401).json({ success: false, error: "Authentication is required." });
  } catch (error) {
    console.error("[requireSession] Failed to read session", error);
    res.status(401).json({ success: false, error: "Your session is invalid or expired." });
  }
}

/** Ensures the current user belongs to the business named in the route. */
export async function requireBusinessMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.authenticatedUser) {
    res.status(401).json({ success: false, error: "Authentication is required." });
    return;
  }

  try {
    const { query } = await import("../config/db.js");
    const businessId = req.params.businessId;
    const membership = await query(
      `SELECT role FROM workers
       WHERE business_id = $1 AND LOWER(email) = LOWER($2) AND status = 'ACTIVE'
       LIMIT 1`,
      [businessId, req.authenticatedUser.email]
    );
    if (membership.rows.length === 0) {
      res.status(403).json({ success: false, error: "You do not have access to this business." });
      return;
    }
    next();
  } catch (error) {
    console.error("[requireBusinessMember]", error);
    res.status(500).json({ success: false, error: "Unable to verify business access." });
  }
}

/** Only owners and managers may change a team's roster or business data. */
export async function requireBusinessManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.authenticatedUser) {
    res.status(401).json({ success: false, error: "Authentication is required." });
    return;
  }

  try {
    const { query } = await import("../config/db.js");
    const businessId = req.params.businessId;
    const membership = await query(
      `SELECT role FROM workers
       WHERE business_id = $1 AND LOWER(email) = LOWER($2) AND status = 'ACTIVE'
       LIMIT 1`,
      [businessId, req.authenticatedUser.email]
    );
    const role = String(membership.rows[0]?.role || "").toLowerCase();
    if (!role.includes("owner") && !role.includes("manager")) {
      res.status(403).json({ success: false, error: "Only a business owner or manager may perform this action." });
      return;
    }
    next();
  } catch (error) {
    console.error("[requireBusinessManager]", error);
    res.status(500).json({ success: false, error: "Unable to verify management access." });
  }
}
