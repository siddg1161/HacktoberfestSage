import { Request, Response } from "express";
import { query } from "../config/db.js";

// Helper to ensure the workers table exists automatically
let workersTableEnsured = false;
async function ensureWorkersTable(): Promise<void> {
  if (workersTableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL,
        name TEXT NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        role VARCHAR(64) NOT NULL DEFAULT 'Technician',
        pin_code VARCHAR(16) NOT NULL DEFAULT '1234',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE workers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE workers ALTER COLUMN phone DROP NOT NULL;
    `);

    // Insert initial seed workers if table is empty
    const countRes = await query("SELECT COUNT(*) as count FROM workers;");
    if (Number(countRes.rows[0].count) === 0) {
      await query(`
        INSERT INTO workers (business_id, name, email, phone, role, pin_code) VALUES
        ('biz-electrical', 'Sameer Khan', 'sameer@sharmaelectricals.com', '+91 99770 33219', 'Lead Electrician', '1234'),
        ('biz-electrical', 'Arjun Mehta', 'arjun@sharmaelectricals.com', '+91 88170 22019', 'Junior Electrician', '1234'),
        ('biz-plumbing', 'Vikram Verma', 'vikram@vermaplumbing.com', '+91 98765 43210', 'Master Plumber', '1234'),
        ('biz-hvac', 'Rohit Sharma', 'rohit@coolcarehvac.com', '+91 98270 66114', 'AC Specialist', '1234'),
        ('biz-auto', 'Karan Patel', 'karan@patelmotors.com', '+91 91234 56789', 'Auto Technician', '1234'),
        ('biz-general', 'Suresh Kumar', 'suresh@kumarcontracting.com', '+91 90000 11111', 'General Contractor', '1234');
      `);
    } else {
      // Ensure seed workers have emails populated if previously null
      await query(`
        UPDATE workers SET email = 'sameer@sharmaelectricals.com' WHERE name = 'Sameer Khan' AND (email IS NULL OR email = '');
        UPDATE workers SET email = 'arjun@sharmaelectricals.com' WHERE name = 'Arjun Mehta' AND (email IS NULL OR email = '');
        UPDATE workers SET email = 'vikram@vermaplumbing.com' WHERE name = 'Vikram Verma' AND (email IS NULL OR email = '');
        UPDATE workers SET email = 'rohit@coolcarehvac.com' WHERE name = 'Rohit Sharma' AND (email IS NULL OR email = '');
        UPDATE workers SET email = 'karan@patelmotors.com' WHERE name = 'Karan Patel' AND (email IS NULL OR email = '');
        UPDATE workers SET email = 'suresh@kumarcontracting.com' WHERE name = 'Suresh Kumar' AND (email IS NULL OR email = '');
      `);
    }
    workersTableEnsured = true;
  } catch (err: any) {
    console.error("[ensureWorkersTable error]:", err);
  }
}

export class BusinessController {
  /**
   * GET /api/business
   * Returns all registered business profiles with worker count and industry stats.
   */
  static async getAllBusinesses(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();

      const result = await query(`
        SELECT 
          b.id,
          b.business_id,
          b.business_name,
          b.industry,
          b.tagline,
          b.owner_name,
          b.email,
          b.phone,
          b.address,
          b.tax_id,
          b.currency_symbol,
          b.created_at,
          COALESCE(w.worker_count, 0) as worker_count,
          COALESCE(c.item_count, 0) as item_count
        FROM business_profiles b
        LEFT JOIN (
          SELECT business_id, COUNT(*) as worker_count 
          FROM workers 
          WHERE status = 'ACTIVE' 
          GROUP BY business_id
        ) w ON b.business_id = w.business_id
        LEFT JOIN (
          SELECT industry, COUNT(*) as item_count 
          FROM catalog_items 
          GROUP BY industry
        ) c ON LOWER(b.industry) = LOWER(c.industry)
        ORDER BY b.id ASC;
      `);

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      console.error("[BusinessController.getAllBusinesses error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch business profiles.",
      });
    }
  }

  /**
   * GET /api/business/:businessId
   * Returns details of a specific business profile.
   */
  static async getBusinessById(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const { businessId } = req.params;

      const result = await query(
        "SELECT * FROM business_profiles WHERE business_id = $1;",
        [businessId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: `Business '${businessId}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("[BusinessController.getBusinessById error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch business profile.",
      });
    }
  }

  /**
   * POST /api/business
   * Registers a new business profile.
   */
  static async createBusiness(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const {
        business_name,
        industry = "General",
        tagline = "",
        owner_name = "",
        email = "",
        phone = "",
        address = "",
        tax_id = "",
        currency_symbol = "₹",
      } = req.body;

      if (!business_name) {
        res.status(400).json({
          success: false,
          error: "business_name is required.",
        });
        return;
      }

      // Generate a slug-like business_id
      const slug = business_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30);
      const business_id = `biz-${slug}-${Date.now().toString().slice(-4)}`;

      const result = await query(
        `INSERT INTO business_profiles (
          business_id, business_name, industry, tagline, owner_name, email, phone, address, tax_id, currency_symbol
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;`,
        [business_id, business_name, industry, tagline, owner_name, email, phone, address, tax_id, currency_symbol]
      );

      // If owner provided an owner name & (email or phone), automatically create them as the primary manager worker
      if (owner_name && (email || phone)) {
        await query(
          `INSERT INTO workers (business_id, name, email, phone, role, pin_code) VALUES ($1, $2, $3, $4, 'Owner / Manager', '1234');`,
          [business_id, owner_name, email || null, phone || null]
        );
      }

      res.status(201).json({
        success: true,
        message: "Business profile registered successfully.",
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("[BusinessController.createBusiness error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create business profile.",
      });
    }
  }

  /**
   * GET /api/business/:businessId/workers
   * Returns all active workers for a business.
   */
  static async getWorkers(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const { businessId } = req.params;

      const result = await query(
        `SELECT id, business_id, name, email, phone, role, status, created_at 
         FROM workers 
         WHERE business_id = $1 
         ORDER BY id ASC;`,
        [businessId]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      console.error("[BusinessController.getWorkers error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch workers.",
      });
    }
  }

  /**
   * POST /api/business/:businessId/workers
   * Adds a new worker under a business.
   */
  static async addWorker(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const { businessId } = req.params;
      const { name, email, phone, role = "Field Technician", pin_code = "1234" } = req.body;

      if (!name || (!email && !phone)) {
        res.status(400).json({
          success: false,
          error: "Worker name and email address are required.",
        });
        return;
      }

      const result = await query(
        `INSERT INTO workers (business_id, name, email, phone, role, pin_code) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, business_id, name, email, phone, role, pin_code, status, created_at;`,
        [businessId, name.trim(), email ? email.trim() : null, phone ? phone.trim() : null, role, pin_code || "1234"]
      );

      res.status(201).json({
        success: true,
        message: "Worker added successfully.",
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error("[BusinessController.addWorker error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to add worker.",
      });
    }
  }

  /**
   * POST /api/business/workers/signup
   * Technician self-registration with name, email, PIN, and business.
   */
  static async technicianSignup(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const { name, email, phone, role = "Field Technician", pin_code = "1234", business_id } = req.body;

      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: "Full name and email address are required for technician signup.",
        });
        return;
      }

      // Check if email already registered
      const existing = await query(
        "SELECT id FROM workers WHERE LOWER(email) = LOWER($1);",
        [email.trim()]
      );
      if (existing.rows.length > 0) {
        res.status(400).json({
          success: false,
          error: "A technician account with this email address already exists. Please log in.",
        });
        return;
      }

      // Resolve business_id
      let targetBizId = business_id;
      if (!targetBizId) {
        const bizList = await query("SELECT business_id FROM business_profiles ORDER BY id ASC LIMIT 1;");
        targetBizId = bizList.rows.length > 0 ? bizList.rows[0].business_id : "biz-electrical";
      }

      const insertRes = await query(
        `INSERT INTO workers (business_id, name, email, phone, role, pin_code)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [targetBizId, name.trim(), email.trim(), phone ? phone.trim() : null, role, pin_code || "1234"]
      );

      const worker = insertRes.rows[0];

      // Fetch business profile details
      const bizRes = await query(
        "SELECT business_name, industry, tagline, currency_symbol, address, tax_id FROM business_profiles WHERE business_id = $1;",
        [targetBizId]
      );
      const biz = bizRes.rows[0] || {};

      res.status(201).json({
        success: true,
        message: `Technician account created! Welcome ${worker.name}.`,
        data: {
          worker: {
            id: worker.id,
            name: worker.name,
            email: worker.email,
            phone: worker.phone,
            role: worker.role,
          },
          business: {
            businessId: targetBizId,
            businessName: biz.business_name || "General Trade Services",
            industry: biz.industry || "General",
            tagline: biz.tagline || "",
            currencySymbol: biz.currency_symbol || "₹",
            address: biz.address || "",
            taxId: biz.tax_id || "",
          },
        },
      });
    } catch (error: any) {
      console.error("[BusinessController.technicianSignup error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create technician account.",
      });
    }
  }

  /**
   * POST /api/business/workers/login
   * Authenticates a technician/worker using email address (or phone number) and 4-digit PIN.
   */
  static async workerLogin(req: Request, res: Response): Promise<void> {
    try {
      await ensureWorkersTable();
      const { email, phone, pin_code } = req.body;
      const identifier = (email || phone || "").trim();

      if (!identifier) {
        res.status(400).json({
          success: false,
          error: "Email address is required.",
        });
        return;
      }

      // Normalize identifier for phone fallback
      const cleanPhone = identifier.replace(/[\s-]/g, "");

      const workerRes = await query(
        `SELECT w.*, b.business_name, b.industry, b.tagline, b.currency_symbol, b.address, b.tax_id
         FROM workers w
         LEFT JOIN business_profiles b ON w.business_id = b.business_id
         WHERE (
           (w.email IS NOT NULL AND LOWER(w.email) = LOWER($1))
           OR (w.phone IS NOT NULL AND REPLACE(REPLACE(w.phone, ' ', ''), '-', '') LIKE '%' || $2 || '%')
         )
           AND w.status = 'ACTIVE'
         LIMIT 1;`,
        [identifier, cleanPhone.length >= 7 ? cleanPhone.slice(-10) : identifier]
      );

      if (workerRes.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: "Technician email address not recognized. Please verify or use instant demo logins.",
        });
        return;
      }

      const worker = workerRes.rows[0];

      // Validate PIN if provided
      const inputPin = String(pin_code || "").trim();
      const storedPin = String(worker.pin_code || "1234").trim();
      if (inputPin && storedPin && inputPin !== storedPin) {
        res.status(401).json({
          success: false,
          error: "Invalid 4-digit PIN.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Welcome back, ${worker.name}!`,
        data: {
          worker: {
            id: worker.id,
            name: worker.name,
            email: worker.email,
            phone: worker.phone,
            role: worker.role,
          },
          business: {
            business_id: worker.business_id,
            business_name: worker.business_name || "Sharma Electricals & Automation",
            businessId: worker.business_id,
            businessName: worker.business_name || "Sharma Electricals & Automation",
            industry: worker.industry || "Electrical",
            tagline: worker.tagline || "Smart Electrical & Field Service Solutions",
            currency_symbol: worker.currency_symbol || "₹",
            currencySymbol: worker.currency_symbol || "₹",
            address: worker.address || "Indore, MP",
            tax_id: worker.tax_id || "",
            taxId: worker.tax_id || "",
          },
        },
      });
    } catch (error: any) {
      console.error("[BusinessController.workerLogin error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Worker login failed.",
      });
    }
  }
}
