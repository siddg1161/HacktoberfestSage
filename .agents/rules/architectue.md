---
trigger: always_on
---

# Project Name: QuoteFlow AI (Universal Multi-Business & PulseOps Engine)

## 1. Executive Summary
QuoteFlow AI is an open-source, multi-tenant, multimodal AI quoting, revenue-protection, and autonomous inventory-restocking platform built for any local business, trade contractor, or service professional (e.g., Electrical & Automation, Plumbing & Sanitary, HVAC / AC Repair, Automotive Garages, Medical Clinics, and General Contractors).

The platform supports a universal multi-tenant workflow:
1. **Business Profile & Industry Setup:** Shopkeepers and business owners register their trade, select or customize their inventory rate-card from pre-seeded industry starter packs, and manage their team of technicians.
2. **Worker / Technician Field Portal:** Field staff log in via mobile phone + 4-digit PIN, capture messy handwritten estimate slips ("parchis") and Hinglish/multilingual voice notes, and generate trade-accurate quotes matched against their employer's live catalog.
3. **Cognitive Revenue Guard & Autonomous Procurement:** Dynamically detects forgotten companion services and labor charges based on the active industry, flags 3-tier inventory shortages, and drafts supplier Purchase Orders (POs) gated by a Human-in-the-Loop (HITL) approval workflow.
4. **Dynamic Client Portal & Invoicing:** Generates branded, GST-compliant invoices bearing the active business name, address, tax ID/GSTIN, and currency.

## 2. Core Tech Stack
- **LLM & Multimodal Engine:** Google Gemma 4 (`google/gemma-4-26b-a4b-it` via OpenRouter / Google AI Studio API for Cloud Mode, with a configurable `BASE_URL` toggle for local Ollama/vLLM `gemma4:e4b` On-Premise Privacy Mode).
- **Agent Orchestration:** LangGraph + LangChain (stateful multi-node graph with dynamic prompt interpolation, versioned LangSmith Prompt Hub integration with LRU cache, and `interrupt_before` Human-in-the-Loop gates).
- **Checkpointer & Persistence:** Neon PostgreSQL (`langgraph-checkpoint-postgres` using `PostgresSaver`) + 6 core business relational tables.
- **Backend API:** Express.js (TypeScript) handling REST routes, worker authentication, inventory management, PDF/HTML invoice generation, and Brevo transactional email alerts; with HTTP/CLI bridging to the Python LangGraph microservice.
- **Frontend UI:** Vite + React (TypeScript) + Tailwind CSS + Lucide Icons + Browser Web Speech API (`webkitSpeechRecognition` for multilingual/Hinglish voice notes).

## 3. PostgreSQL Database Schema (6 Core Tables)
Alongside LangGraph's auto-generated checkpoint tables (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`), the Neon PostgreSQL database contains 6 core business tables:
1. `business_profiles`: `id` (PK), `business_id` (Unique slug), `business_name`, `industry` (`Electrical`, `Plumbing`, `HVAC`, `Automotive`, `General`), `tagline`, `owner_name`, `email`, `phone`, `address`, `tax_id`, `currency_symbol`, `created_at`.
2. `workers`: `id` (PK), `business_id` (FK), `name`, `phone`, `role` (`Lead Electrician`, `Master Plumber`, `Technician`, etc.), `pin_code` (4-digit passcode), `status` (`ACTIVE`, `INACTIVE`), `created_at`.
3. `catalog_items`: `sku_id` (PK), `item_name`, `category`, `industry` (`Electrical`, `Plumbing`, `HVAC`, `Automotive`, `General`), `unit`, `unit_price`, `gst_rate`, `current_stock`, `reorder_threshold`, `preferred_supplier`, `supplier_lead_time_days`.
4. `quotes`: `id` (PK), `thread_id` (Unique, maps to LangGraph state), `client_name`, `client_phone`, `business_name`, `business_category`, `currency`, `currency_symbol`, `status` (`DRAFT`, `QUOTED`, `WON`, `INVOICED`), `subtotal`, `gst_total`, `grand_total`, `ai_revenue_alert` (JSONB), `created_at`, `updated_at`.
5. `quote_line_items`: `id` (PK), `quote_id` (FK), `sku_id`, `item_name`, `quantity`, `unit_price`, `gst_rate`, `gst_amount`, `line_total`, `stock_tier` (`HEALTHY`, `THRESHOLD_WARNING`, `INSTANT_DEFICIT`), `is_ai_suggested` (BOOLEAN).
6. `supplier_purchase_orders`: `id` (PK), `thread_id`, `po_number` (Unique), `supplier_name`, `items_payload` (JSONB), `urgency` (`STANDARD_RESTOCK`, `INSTANT_ORDER`), `status` (`DRAFTED`, `ORDERED`, `RECEIVED`), `created_at`.

## 4. End-to-End Multi-Business LangGraph Workflow
- **Context Injection:** Active `business_name`, `business_category`, and `currency_symbol` are passed into the state graph.
- **Node 1 (Multimodal Extractor - Gemma 4):**
  - Scopes catalog retrieval from `catalog_items` to the active `industry` (or `General` trade).
  - Dynamically interpolates `{business_category}` into the extractor system prompt.
  - Accepts handwritten slip image (preprocessed via OpenCV CLAHE contrast enhancement) + Hinglish voice transcript.
  - Fuzzy-matches requested materials/services to trade SKUs.
- **Node 2 (Deterministic Billing & 3-Tier Storage Analyzer):**
  - Computes exact GST math (unit price, GST rate, line total, subtotal, and tax totals).
  - Classifies each item into:
    - Tier 1 (`HEALTHY`): Stock after order >= Reorder Threshold.
    - Tier 2 (`THRESHOLD_WARNING`): Stock suffices for quote, but drops below safety threshold.
    - Tier 3 (`INSTANT_DEFICIT`): Requested Qty > Current Stock (requires instant supplier restock).
- **Node 3 (Universal Revenue Guard & Procurement Agent - Gemma 4):**
  - Dynamically audits line items for missing trade-specific companion services (e.g., CPVC pipes quoted without plumbing installation labor; wire coils quoted without concealed piping labor; AC refrigerant quoted without jet wash service).
  - If items are in Tier 2 or Tier 3, groups shortages by preferred supplier and drafts structured Purchase Orders.
- **HITL Interrupt Gate (`interrupt_before=["execute_dispatch_node"]`):**
  - Execution pauses and state is snapshotted to Neon PostgreSQL via `PostgresSaver`.
  - Vendor/technician reviews Quote, AI Revenue Alert, stock tier badges, and supplier POs in the UI.
- **Node 4 (Execution & Dispatch Node):**
  - Resumes post-approval. Upserts finalized quote records into `quotes` with the active business name and category, populates `quote_line_items`, and commits drafted POs to `supplier_purchase_orders`.

## 5. Frontend UI Views
1. **Global Header & Business Switcher:** Allows toggling between registered business profiles or clicking "+ Register New Business" to instantiate an instant industry preset (Plumbing, Auto, HVAC, Electrical, General).
2. **Field Technician Portal (`#technician`):**
   - Phone + 4-digit PIN worker login.
   - Fast slip camera capture & microphone voice note recorder.
   - Interactive quote preview, AI companion add-on toggles, and 1-tap customer WhatsApp sharing.
3. **Owner Admin Dashboard (`#admin`):**
   - Overview metrics (Total Quotes, Won Deals, AI Revenue Added, Low Stock alerts).
   - Multi-stage Quote Kanban board.
   - **Team & Workers Management tab:** Add, view, and assign field technicians under the business.
4. **Smart Warehouse & Inventory Hub (`#inventory`):**
   - Industry-filterable catalog view with real-time stock levels and safety reorder bars.
   - Active supplier PO restock tracker with "Mark Stock Received" 1-click replenishment.
5. **Interactive Client Portal & Invoicing (`#portal/:threadId`):**
   - Customer-facing digital estimate approval page.
   - Automated stock deduction and branded GST Tax Invoice generation.