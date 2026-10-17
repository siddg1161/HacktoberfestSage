---
trigger: always_on
---

# Project Name: QuoteFlow AI (Parchi-to-Paisa & PulseOps Engine)

## 1. Executive Summary
QuoteFlow AI is an open-source, multimodal AI quoting, revenue-protection, and autonomous inventory-restocking platform built for local service contractors and retail/hardware businesses (e.g., Sharma Electricals, Mehta Interiors, Joshi Clinic, Patel Traders). 

It solves two critical problems in one unified LangGraph pipeline:
1. **Multimodal Field Quoting & Revenue Guard:** Converts messy handwritten estimate slips ("parchis") and Hinglish voice notes into GST-compliant quotations while detecting forgotten labor/ancillary charges (preventing revenue leakage).
2. **3-Tier Storage Management & Autonomous Warehouse Reordering:** Automatically cross-checks quoted quantities against real-time warehouse stock, flags low-stock thresholds or instant order deficits, and drafts supplier Purchase Orders (POs) gated by a LangGraph Human-in-the-Loop (HITL) approval workflow.

## 2. Core Tech Stack
- **LLM & Multimodal Engine:** Google Gemma 4 (`google/gemma-4-26b-a4b-it` via OpenRouter / Google AI Studio API for Cloud Mode, with a configurable `BASE_URL` toggle to switch to local Ollama/vLLM `gemma4:e4b` for On-Premise Privacy Mode).
- **Agent Orchestration:** LangGraph + LangChain (stateful multi-node graph with conditional routing and `interrupt_before` Human-in-the-Loop gates).
- **Checkpointer & Persistence:** PostgreSQL (`langgraph-checkpoint-postgres` using `PostgresSaver` / `AsyncPostgresSaver`) + PostgreSQL relational tables for business entities.
- **Observability:** LangSmith (`LANGCHAIN_TRACING_V2=true`) for real-time node-level tracing and debugging.
- **Backend API:** Python FastAPI (Async REST endpoints + Webhook triggers).
- **Frontend UI:** Next.js (React) + Tailwind CSS + Lucide Icons + Browser Web Speech API (`webkitSpeechRecognition` for Hinglish voice-to-text).

## 3. PostgreSQL Database Schema (Business Tables)
Alongside LangGraph's auto-generated checkpoint tables (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`), the PostgreSQL database contains 4 core business tables:
1. `catalog_items`: `sku_id` (PK), `item_name`, `category`, `unit`, `selling_price`, `wholesale_cost`, `gst_percent`, `current_stock`, `reorder_threshold`, `preferred_supplier`, `supplier_contact`.
2. `quotes`: `quote_id` (PK), `thread_id` (Unique, maps to LangGraph state), `client_name`, `client_phone`, `status` (`NEW`, `DRAFT_READY`, `QUOTED`, `WON`, `INVOICED`), `slip_image_url`, `voice_transcript`, `subtotal`, `gst_total`, `grand_total`, `ai_revenue_alert`.
3. `quote_line_items`: `line_id` (PK), `quote_id` (FK), `sku_id` (FK, nullable for custom items), `item_name`, `requested_qty`, `available_stock_snapshot`, `stock_tier` (`HEALTHY`, `THRESHOLD_WARNING`, `INSTANT_DEFICIT`), `unit_price`, `gst_percent`, `line_total`, `is_ai_suggested`.
4. `supplier_purchase_orders`: `po_id` (PK), `quote_id` (FK), `supplier_name`, `urgency` (`STANDARD_RESTOCK`, `INSTANT_ORDER`), `items_payload` (JSONB), `total_wholesale_cost`, `status` (`PENDING_APPROVAL`, `ORDERED_FROM_WAREHOUSE`, `RECEIVED`).

## 4. End-to-End LangGraph Workflow
- **Node 1 (Multimodal Extractor - Gemma 4):** Accepts handwritten slip image + Hinglish voice transcript + catalog SKU list. Extracts requested items, quantities, and fuzzy-matches them to catalog SKUs.
- **Node 2 (Deterministic Billing & 3-Tier Storage Analyzer):** Queries PostgreSQL `catalog_items` and pending POs. Computes exact GST math and classifies each item into:
  - Tier 1 (`HEALTHY`): Stock after order >= Reorder Threshold.
  - Tier 2 (`THRESHOLD_WARNING`): Enough stock for this quote, but remaining stock drops below Reorder Threshold.
  - Tier 3 (`INSTANT_DEFICIT`): Requested Qty > Current Stock (requires instant warehouse order to fulfill quote).
- **Node 3 (Revenue Guard & Procurement Agent - Gemma 4):**
  - Audits line items for missing companion services/consumables (e.g., MCBs quoted without installation labor) and creates a Revenue Leakage Alert.
  - If any item is in Tier 2 or Tier 3, groups shortages by supplier and drafts a structured Warehouse Purchase Order (`STANDARD_RESTOCK` or `INSTANT_ORDER`).
- **HITL Interrupt Gate (`interrupt_before=["execute_dispatch_node"]`):** Graph pauses and saves state to PostgreSQL via `PostgresSaver`. Seller reviews Quote, AI Revenue Alert, Storage Warnings, and Drafted Supplier PO on the dashboard.
- **Node 4 (Execution & Dispatch Node):** Resumes after human approval. Updates Quote status to `QUOTED`, generates the Client Approval link, and if the PO was approved, marks the Warehouse PO as `ORDERED_FROM_WAREHOUSE`.

## 5. Frontend UI Views (4-Tab Architecture)
1. **Global Command Navbar:** Cloud vs. Local On-Prem Gemma 4 toggle, Low-Stock Alert badge, and "Open LangSmith Trace" button.
2. **Tab 1 - Magic Quote & Agent Studio:** Image + Hinglish voice input on the left; live LangGraph step tracker, interactive quote table with stock badges, Revenue Leakage callout, and 1-click Warehouse PO Approval card on the right.
3. **Tab 2 - Smart Storage & Warehouse Order Hub:** Live inventory table with stock health bars and active Supplier PO list with a "Mark Stock Received" action.
4. **Tab 3 - Lead Tracker & Client Portal (`quote-tracker.app` style):** Kanban/table view (`NEW` -> `QUOTED` -> `WON`) plus a Customer Approval Drawer that converts an approved quote into a final GST invoice and deducts stock.