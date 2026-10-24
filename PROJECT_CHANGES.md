# 📜 Project Changes & Architecture Evolution Log

This document provides a comprehensive, file-by-file record of all architectural, database, backend, and frontend changes implemented across the **DukaanPay / HacktoberfestSage** project.

---

## 📌 Executive Summary of Changes

1. **Multi-Industry & Multi-Business Architecture:**
   - Evolved the application from a single hardcoded electrical contractor demo into a generalized, multi-tenant platform supporting any trade or store (*Electrical, Plumbing, HVAC, Automotive, General Contracting, etc.*).
2. **Shopkeeper & Technician Role-Based Workspaces:**
   - Redesigned the main landing page to route users distinctly into either the **Shopkeeper Portal** or **Technician Portal**.
   - Removed direct admin/warehouse links from the public landing interface.
3. **Email-Based Authentication & Registration:**
   - Replaced mobile phone number requirements with **Email Address** for technician signups/logins, shopkeeper business registrations, and team member management.
4. **Autonomous Team & Worker Management:**
   - Added staff management allowing shopkeepers to add, view, and assign field technicians with email credentials and 4-digit PINs.

---

## 📁 1. Backend Services (`/Backend`)

### 1.1. `Backend/src/controllers/business.controller.ts` *(NEW)*
- **Purpose:** Core controller for business tenant profiles and worker/technician lifecycle management.
- **Key Changes & Features:**
  - `ensureWorkersTable()`: Automatic table creation and safe database migration in Neon PostgreSQL (`ALTER TABLE workers ADD COLUMN IF NOT EXISTS email VARCHAR(255); ALTER TABLE workers ALTER COLUMN phone DROP NOT NULL;`).
  - Auto-seeds default technicians with designated emails (`sameer@sharmaelectricals.com`, `vikram@vermaplumbing.com`, etc.).
  - `getAllBusinesses()`: Fetches all registered businesses joined with real-time active worker and catalog item counts.
  - `getBusinessById()`: Fetches metadata for a specific business profile.
  - `createBusiness()`: Handles registration of a new shop/business (name, industry, owner, email, address, tagline, currency) and automatically creates a manager worker profile for the owner.
  - `getWorkers()`: Lists active technicians and estimators for a business.
  - `addWorker()`: Adds a new technician under a business with `name`, `email`, `role`, and `pin_code`.
  - `technicianSignup()`: Self-registration endpoint for field technicians using email address and 4-digit PIN.
  - `workerLogin()`: Authenticates technicians using email (with phone fallback) and 4-digit PIN, returning worker identity and business context.

### 1.2. `Backend/src/routes/business.routes.ts` *(NEW)*
- **Purpose:** Express router exposing REST endpoints for multi-business and worker operations.
- **Routes Added:**
  - `GET /api/business` — List all business profiles
  - `GET /api/business/:businessId` — Retrieve single business details
  - `POST /api/business` — Register a new business
  - `GET /api/business/:businessId/workers` — List workers for a business
  - `POST /api/business/:businessId/workers` — Add worker under a business
  - `POST /api/business/workers/signup` — Technician self-registration with email & PIN
  - `POST /api/business/workers/login` — Technician login with email & PIN

### 1.3. `Backend/src/server.ts`
- **Purpose:** Main Express application entry point.
- **Changes:**
  - Imported and mounted `businessRoutes` at `/api/business`.

### 1.4. `Backend/src/controllers/quote.controller.ts`
- **Purpose:** Handles quote initialization, slip upload, and human-in-the-loop approval.
- **Changes:**
  - Extended `startQuote` to accept business context parameters (`business_name`, `business_category`, `worker_name`, `currency_symbol`) and forward them into the LangGraph state pipeline.

### 1.5. `Backend/src/services/agent.service.ts`
- **Purpose:** Node-to-Python bridge for invoking LangGraph agent workflows.
- **Changes:**
  - Updated payload serialization to pass tenant business context and worker credentials to the Python agent daemon.

### 1.6. `Backend/src/services/invoice.service.ts`
- **Purpose:** Generates printable GST tax invoices for confirmed customer quotes.
- **Changes:**
  - Replaced hardcoded "Sharma Electricals" header with dynamic business profile data: active business name, address, tax ID (GSTIN), and active currency symbol (`₹`, `$`, etc.).

### 1.7. `Backend/src/services/inventory.service.ts` & `inventory.controller.ts`
- **Purpose:** Catalog querying and purchase order (PO) generation.
- **Changes:**
  - Added support for multi-industry catalog filtering and dynamic restock PO draft generation.

---

## 📁 2. Python Agent & Database (`/Agent`)

### 2.1. `Agent/db/schema.py`
- **Purpose:** Neon PostgreSQL schema initialization, table migrations, and multi-industry seed data.
- **Tables & Migrations Added:**
  - `business_profiles`: Stores tenant configuration (`business_id`, `business_name`, `industry`, `owner_name`, `email`, `phone`, `address`, `tax_id`, `currency_symbol`).
  - `workers`: Staff table storing `business_id`, `name`, `email`, `phone`, `role`, `pin_code`, `status`.
  - Added safe migrations:
    ```sql
    ALTER TABLE workers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE workers ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS industry VARCHAR(64) NOT NULL DEFAULT 'General';
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business';
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS business_category VARCHAR(100) DEFAULT 'General Services';
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency VARCHAR(16) DEFAULT 'INR';
    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(8) DEFAULT '₹';
    ```
  - Populated multi-industry seeds for Electrical, Plumbing, HVAC, Automotive, and General Contracting businesses and catalog items.

### 2.2. `Agent/agent/state.py`
- **Purpose:** LangGraph quote pipeline state definition.
- **Changes:**
  - Extended `QuoteFlowState` with business tenant properties:
    - `business_name: str`
    - `business_category: str`
    - `worker_name: str`
    - `currency_symbol: str`

### 2.3. `Agent/agent/nodes.py`
- **Purpose:** LangGraph execution nodes (Vision/Voice extraction, SKU matching, Add-on suggestions, Neon DB commit).
- **Changes:**
  - **Node 1 (Extraction):** Prompts dynamically inject `business_name` and `business_category` to tailor voice transcription interpretation to the specific trade.
  - **Node 2 (Catalog Matching):** Queries catalog items matching the business's industry.
  - **Node 3 (Companion Services):** Revenue expansion engine recommends trade-specific companion add-ons (e.g., pipe seals for plumbing, refrigerant top-ups for HVAC).
  - **Node 4 (Neon DB Persistence):** Saves finalized quotes and purchase orders linked with business metadata.

### 2.4. `Agent/core/prompts.py`
- **Purpose:** System instructions for LLM nodes.
- **Changes:**
  - Generalized prompts to eliminate hardcoded assumptions of electrical items; prompts now adapt dynamically to any trade.

---

## 📁 3. Frontend Web Application (`/frontend`)

### 3.1. `frontend/src/App.tsx`
- **Purpose:** Main application router, hero section, and navigation layout.
- **Changes:**
  - **Landing Page Header:** Removed "📦 Warehouse & Stock", "Admin dashboard", and "Try the demo" links. Added primary role buttons:
    - `🛠️ Login as Technician` (`#technician-auth`)
    - `🏪 Login as Shopkeeper` (`#shopkeeper-auth`)
  - **Hero Section:** Replaced generic CTA with two distinct role cards:
    - **"Sign in as Shopkeeper →"** (routes to `#shopkeeper-auth`)
    - **"Sign in as Technician →"** (routes to `#technician-auth`)
  - **Footer:** Updated portal shortcuts to "Shopkeeper portal" and "Technician portal".
  - **Routing:** Added `#shopkeeper-auth` and `#technician-auth` hash routes.

### 3.2. `frontend/src/TechnicianAuth.tsx`
- **Purpose:** Dedicated authentication portal for field technicians.
- **Changes:**
  - Replaced mobile number (`+91`) input with **"Technician Email Address \*"** (`type="email"`, placeholder `e.g. sameer@sharmaelectricals.com`).
  - Added functional **Sign Up** mode allowing technicians to register with **Full Name**, **Email Address**, and **4-digit PIN**.
  - Updated instant trade demo shortcuts to use technician emails:
    - ⚡ Sameer Khan (`sameer@sharmaelectricals.com`)
    - 🔧 Vikram Verma (`vikram@vermaplumbing.com`)
    - ❄️ Rohit Sharma (`rohit@coolcarehvac.com`)
    - 🚗 Karan Patel (`karan@patelmotors.com`)
  - Persists `dukaanpay_tech_email` and technician profile in `localStorage`.

### 3.3. `frontend/src/ShopkeeperAuth.tsx` *(NEW)*
- **Purpose:** Dedicated onboarding and login portal for business owners and shopkeepers.
- **Changes & Features:**
  - **Tab 1: Select Existing Business Profile:** Displays all registered shops as rich cards showing trade tag, owner name, owner email, technician count, and one-click "Sign In →" or "Open Dashboard" button.
  - **Tab 2: Register New Business:** Registration form requiring:
    - Shop / Business Name
    - Industry / Trade (Electrical, Plumbing, HVAC, Auto, Contractor, Clinic, etc.)
    - Owner Full Name
    - **Shopkeeper Email Address \*** (`type="email"`, required)
    - Shop City / Address
    - Tagline / Specialization
  - Redirects shopkeeper directly to the Admin Dashboard (`#admin`) upon selection or registration.

### 3.4. `frontend/src/AdminDashboard.tsx`
- **Purpose:** Shopkeeper's management dashboard.
- **Changes:**
  - Removed "📦 Warehouse & Inventory" tab and inventory hub cards.
  - Simplified navigation to:
    - `📋 Jobs & Quotes` — Reviewing field estimates and approving customer quotes.
    - `👥 Team & Workers` — Managing field technicians.
  - Added **"Sign Out"** button in top header to return to the landing page.

### 3.5. `frontend/src/WorkersTab.tsx` *(NEW)*
- **Purpose:** Team and staff management inside the Shopkeeper Dashboard.
- **Changes & Features:**
  - Displays grid of active technicians with trade badges, role, email address, status, and passcode PIN.
  - **"+ Add Technician / Worker" Modal:** Allows shopkeepers to invite/register new team members using their **Email Address** and 4-digit PIN.
  - **"Open Field Portal →":** One-click impersonation button to test the field experience as that technician.

### 3.6. `frontend/src/businessContext.ts` *(NEW)*
- **Purpose:** Central React context and state management for active business and active worker.
- **Changes & Features:**
  - Exposes `useActiveBusiness` hook.
  - Persists selected business and logged-in technician to `localStorage`.
  - Automatically loads available businesses from `GET /api/business`.

### 3.7. `frontend/src/BusinessModal.tsx` *(NEW)*
- **Purpose:** Modal dialog allowing instant switching between business profiles or editing profile details.

### 3.8. `frontend/src/TechnicianPortal.tsx`
- **Purpose:** Mobile-friendly field worker slip upload and audio recording interface.
- **Changes:**
  - Injects active worker's identity and active business profile into quote submission requests.

### 3.9. `frontend/src/api.ts`
- **Purpose:** Frontend HTTP client for backend REST APIs.
- **Changes:**
  - Added `BusinessProfile` interface.
  - Updated `WorkerProfile` interface with `email?: string;`.
  - Added client methods:
    - `getBusinesses()`
    - `getBusinessById(id)`
    - `createBusiness(payload)`
    - `getWorkers(businessId)`
    - `addWorker(businessId, payload)`
    - `technicianSignup(payload)`
    - `workerLogin(emailOrPhone, pin)`
    - `approveQuote(threadId, decisions)` — accepts `edited_po_drafts` and `accepted_addon_skus`

---

## 📁 4. Interactive Human-in-the-Loop Customization Features *(NEW)*

### 4.1. Editable AI Revenue Guard Add-ons (`TechnicianPortal.tsx`)
- **Quantity & Rate Customization:** Technicians and shopkeepers can customize quantity (`+`/`-` stepper) and rate (`₹` input) for companion charges suggested by the AI agent.
- **Selective Add-to-Quote:** Individual "+ Add to Quote" / "Remove" toggles for each recommended companion item.
- **1-Click Bulk Addition:** "⚡ Add All to Quote" quick action to bundle all suggested companion services into the quotation.
- **Live Recalculation:** Subtotal, GST totals (18%), and grand total update in real-time as companion services are toggled or modified.

### 4.2. 1-Click Modal for Supplier Restock Purchase Orders (`TechnicianPortal.tsx`)
- **Supplier PO Cards:** Enhanced PO cards displaying supplier name, urgency tag (`INSTANT_ORDER` / `STANDARD_RESTOCK`), items summary, and total PO cost.
- **Interactive Review & Edit Modal:**
  - One-click trigger from any drafted PO card.
  - Custom supplier distributor selection.
  - Urgency toggle between `STANDARD_RESTOCK` (buffer) and `INSTANT_ORDER` (emergency deficit).
  - Editable order quantities and unit prices per item with auto line totals.
  - "+ Add Additional Item to this PO" inline row to bundle extra materials.
  - Supplier delivery notes input.
  - "Delete PO" option and "Save PO Changes" button.
- **Neon DB & LangGraph State Persistence:** Updated `Backend/src/services/agent.service.ts` and `Backend/src/controllers/quote.controller.ts` to forward `edited_po_drafts` and `accepted_addon_skus` to LangGraph state, inserting the exact vendor-approved POs into `supplier_purchase_orders`.

### 4.3. Natural Language Refinement Loop (`hitl_gate_node` -> `refinement_node` -> Node 2)
- **Natural Language Revision Input:** Field technicians and shopkeepers can revise drafted quotes using plain English or Hinglish (e.g. *"Wire 3 coil kar do and modular switches hata do, and add 2 packets of PVC tape"*).
- **LLM Refinement Node (`natural_language_refinement_node`):** Interprets natural language changes against current line items and trade catalog using Gemma 4 / Gemini, outputting updated items with a concise explanation.
- **Dynamic LangGraph Loopback:** Routes directly from `refinement_node` back into **Node 2** (`inventory_and_billing_analyzer_node`), which re-evaluates 3-tier inventory shortages and exact GST math in real time.
- **Continuous Audit:** Re-evaluates **Node 3** (`revenue_and_procurement_node`) to refresh companion add-ons and drafted restock POs, pausing again before `hitl_gate_node` for human review.
- **REST Endpoints & Client Integration:**
  - `POST /api/quotes/:threadId/refine` in Express Backend and FastAPI Agent daemon.
  - Client method `api.refineQuote()` with live interactive UI bar and quick suggestion pills in `TechnicianPortal.tsx`.

---

## 📊 Summary of Modified vs. New Files

| File Path | Type | Key Responsibility |
|:---|:---:|:---|
| `Backend/src/controllers/business.controller.ts` | **NEW** | Multi-business CRUD, worker login/signup with email |
| `Backend/src/routes/business.routes.ts` | **NEW** | REST route definitions for `/api/business` |
| `Backend/src/server.ts` | Modified | Mounts `/api/business` router |
| `Backend/src/controllers/quote.controller.ts` | Modified | Injects business context & supports edited PO drafts / addon SKUs |
| `Backend/src/services/agent.service.ts` | Modified | Bridges business context & forwards edited PO drafts to LangGraph |
| `Backend/src/services/invoice.service.ts` | Modified | Dynamic business branding on GST invoice |
| `Agent/db/schema.py` | Modified | DB schema, `workers.email` migration, multi-trade seed |
| `Agent/agent/state.py` | Modified | Added business context fields to `QuoteFlowState` |
| `Agent/agent/nodes.py` | Modified | Dynamic prompt formatting & multi-trade catalog query |
| `Agent/core/prompts.py` | Modified | Industry-agnostic LLM prompt templates |
| `frontend/src/businessContext.ts` | **NEW** | Business & worker state context + local persistence |
| `frontend/src/ShopkeeperAuth.tsx` | **NEW** | Shopkeeper selection & registration with email |
| `frontend/src/WorkersTab.tsx` | **NEW** | Staff management & worker email registration |
| `frontend/src/BusinessModal.tsx` | **NEW** | Modal switcher for business profiles |
| `frontend/src/App.tsx` | Modified | Role-based landing page, removed warehouse/admin direct links |
| `frontend/src/TechnicianAuth.tsx` | Modified | Email-based technician auth & trade demo logins |
| `frontend/src/AdminDashboard.tsx` | Modified | Cleaned tabs (Quotes & Team), sign out button |
| `frontend/src/TechnicianPortal.tsx` | Modified | Editable AI revenue add-ons & 1-click PO review/edit modal |
| `frontend/src/api.ts` | Modified | TypeScript types & API methods with edited PO drafts support |
