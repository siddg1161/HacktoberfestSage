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

    if (!session?.user?.email) {
      res.status(401).json({ success: false, error: "Authentication is required." });
      return;
    }

    req.authenticatedUser = {
      id: session.user.id,
      email: session.user.email.toLowerCase(),
      name: session.user.name,
    };
    next();
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

/** Only owners and managers may change a team's roster, warehouse, or inventory data. */
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
       WHERE ($1::text IS NULL OR business_id = $1)
         AND LOWER(email) = LOWER($2)
         AND status = 'ACTIVE'
       ORDER BY id ASC
       LIMIT 1`,
      [businessId || null, req.authenticatedUser.email]
    );

    if (membership.rows.length === 0) {
      res.status(403).json({ success: false, error: "Access denied: You do not belong to an active business workspace." });
      return;
    }

    const role = String(membership.rows[0]?.role || "").toLowerCase();
    if (!role.includes("owner") && !role.includes("manager")) {
      res.status(403).json({
        success: false,
        error: "Access denied. Warehouse inventory, purchase orders, and admin controls are restricted to business owners and managers.",
      });
      return;
    }
    next();
  } catch (error) {
    console.error("[requireBusinessManager]", error);
    res.status(500).json({ success: false, error: "Unable to verify management access." });
  }
}
