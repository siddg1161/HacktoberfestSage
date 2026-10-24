import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";

function requireUser(req: Request, res: Response) {
  if (!req.authenticatedUser) {
    res.status(401).json({ success: false, error: "Authentication is required." });
    return null;
  }
  return req.authenticatedUser;
}

function publicWorker(row: Record<string, unknown>) {
  const { pin_code: _pinCode, ...worker } = row;
  return worker;
}

/** Session-aware business/worker endpoints. These never trust a business ID supplied by the browser. */
export class SessionController {
  static async me(req: Request, res: Response): Promise<void> {
    const user = requireUser(req, res);
    if (!user) return;

    try {
      const result = await query(
        `SELECT w.id, w.business_id, w.name, w.email, w.phone, w.role, w.status, w.created_at,
                b.business_name, b.industry, b.tagline, b.owner_name, b.email AS business_email,
                b.address, b.tax_id, b.currency_symbol
         FROM workers w
         JOIN business_profiles b ON b.business_id = w.business_id
         WHERE LOWER(w.email) = LOWER($1) AND w.status = 'ACTIVE'
         ORDER BY w.id ASC
         LIMIT 1`,
        [user.email]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "No active DukaanPay workspace is linked to this account. Ask your business owner to add this email to the team.",
        });
        return;
      }

      const row = result.rows[0];
      res.json({
        success: true,
        data: {
          user,
          worker: publicWorker(row),
          business: {
            business_id: row.business_id,
            business_name: row.business_name,
            industry: row.industry,
            tagline: row.tagline,
            owner_name: row.owner_name,
            email: row.business_email,
            address: row.address,
            tax_id: row.tax_id,
            currency_symbol: row.currency_symbol,
          },
        },
      });
    } catch (error) {
      console.error("[SessionController.me]", error);
      res.status(500).json({ success: false, error: "Unable to load your workspace." });
    }
  }

  static async createBusiness(req: Request, res: Response): Promise<void> {
    const user = requireUser(req, res);
    if (!user) return;

    const { business_name, industry = "General", tagline = "", address = "", phone = "", tax_id = "", currency_symbol = "₹" } = req.body ?? {};
    if (typeof business_name !== "string" || !business_name.trim()) {
      res.status(400).json({ success: false, error: "A business name is required." });
      return;
    }

    try {
      const existing = await query(
        "SELECT business_id FROM business_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [user.email]
      );
      if (existing.rows.length > 0) {
        const business = await query(
          "SELECT * FROM business_profiles WHERE business_id = $1 LIMIT 1",
          [existing.rows[0].business_id]
        );
        res.status(200).json({ success: true, data: business.rows[0] });
        return;
      }

      const slug = business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) || "business";
      const businessId = `biz-${slug}-${randomUUID().slice(0, 8)}`;
      const businessResult = await query(
        `INSERT INTO business_profiles
          (business_id, business_name, industry, tagline, owner_name, email, phone, address, tax_id, currency_symbol)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [businessId, business_name.trim(), String(industry).slice(0, 100), String(tagline).slice(0, 500), user.name, user.email, String(phone).slice(0, 64), String(address).slice(0, 500), String(tax_id).slice(0, 64), String(currency_symbol).slice(0, 8)]
      );
      await query(
        `INSERT INTO workers (business_id, name, email, phone, role, status)
         VALUES ($1, $2, $3, $4, 'Owner / Manager', 'ACTIVE')`,
        [businessId, user.name, user.email, String(phone).slice(0, 64)]
      );

      res.status(201).json({ success: true, data: businessResult.rows[0] });
    } catch (error) {
      console.error("[SessionController.createBusiness]", error);
      res.status(500).json({ success: false, error: "Unable to create the business profile." });
    }
  }
}
