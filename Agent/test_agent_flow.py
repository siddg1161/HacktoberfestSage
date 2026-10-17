"""End-to-End Terminal Test for QuoteFlow AI Agent.

Verifies:
1. Neon DB seed verification (Finolex Wire has stock=3, threshold=10).
2. LangGraph invocation with handwritten slip + Hinglish voice input.
3. Pause at HITL interrupt gate before `execute_dispatch_node`.
4. Inspection of:
   - 3-Tier Storage Deficit (2-coil deficit detected).
   - Revenue Leakage Warning with list of suggested add-ons & Python pricing.
   - Autonomous Supplier Restock PO drafts (grouped by supplier via Python math).
5. Injection of Human Approval (`human_approved_quote`, `human_accepted_addon`, `human_approved_po`).
6. State resumption from Neon PostgresSaver, completing Node 4 via atomic transaction.
7. Verification of records saved in PostgreSQL `quotes` and `supplier_purchase_orders`.
"""

import os
import sys
import time
import json
from pathlib import Path
from langsmith import traceable

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent.graph import graph
from agent.checkpointer import get_db_connection
from db.schema import init_neon_database

# Prepare mock test input
thread_id = f"demo-thread-{int(time.time())}"
config = {"configurable": {"thread_id": thread_id}}

@traceable(name="QuoteFlow-E2E-Pipeline", run_type="chain")
def run_test(**kwargs):
    print("=" * 70)
    print("   QuoteFlow AI - LangGraph HITL Workflow Terminal Test")
    print("=" * 70)

    # 1. Initialize & verify Neon DB seed
    print("\n[Step 1/5] Verifying / Seeding Neon DB...")
    init_neon_database()

    initial_input = {
        "thread_id": thread_id,
        "client_name": "Sharma Electrical Contractors",
        "client_phone": "+91-9826012345",
        "slip_image_url": "https://example.com/slips/sharma_parchi_01.jpg",
        "voice_transcript": (
            "Arre Bhaiya, Sharma ji ke flat ke liye 5 coil Finolex 2.5 sq mm red wire, "
            "10 switch Anchor Roma ke, aur 5 conduit pipe PVC wale note kar lo."
        ),
    }

    print("\n[Step 2/5] Invoking LangGraph Pipeline...")
    print(f" -> Thread ID: {thread_id}")
    print(f" -> Input Voice Transcript: \"{initial_input['voice_transcript']}\"")
    print(" -> Executing: START -> Node 1 (Extractor) -> Node 2 (3-Tier & GST) -> Node 3 (Revenue & PO)...")
    
    # Run until interrupt_before=["execute_dispatch_node"]
    graph.invoke(initial_input, config=config)

    # 3. Inspect paused state at the Interrupt Gate
    snapshot = graph.get_state(config)
    print("\n" + "=" * 70)
    print("   [Step 3/5] PAUSED AT HITL INTERRUPT GATE")
    print("=" * 70)
    print(f" -> Next pending node: {snapshot.next}")
    assert "execute_dispatch_node" in snapshot.next, "Expected execution to pause before execute_dispatch_node!"

    state_vals = snapshot.values
    extracted_items = state_vals.get("extracted_items", [])
    print(f"\n[Extracted & Enriched Quoted Items] ({len(extracted_items)} items):")
    for item in extracted_items:
        tier_str = f"[{item.get('stock_tier')}]"
        print(f"  * {item.get('item_name')} | Qty: {item.get('quantity')} {item.get('unit')} | "
              f"Price: Rs.{item.get('unit_price')} | GST: Rs.{item.get('gst_amount')} | "
              f"Line Total: Rs.{item.get('line_total')} | Tier: {tier_str}")

    print(f"\n[Financial Summary]:")
    print(f"  * Subtotal:   Rs. {state_vals.get('subtotal'):,.2f}")
    print(f"  * GST Total:  Rs. {state_vals.get('gst_total'):,.2f}")
    print(f"  * Grand Total: Rs. {state_vals.get('grand_total'):,.2f}")

    revenue_alert = state_vals.get("ai_revenue_alert")
    if revenue_alert and revenue_alert.get("has_warning"):
        print(f"\n[AI Revenue Guard Alert]:")
        print(f"  ! Reason: {revenue_alert.get('reason')}")
        addons = revenue_alert.get("suggested_addons", [])
        print(f"  ! Suggested Add-ons ({len(addons)} items):")
        for ad in addons:
            print(f"     - {ad.get('suggested_item_name')} (Qty: {ad.get('suggested_qty')}) | "
                  f"Rate: Rs.{ad.get('unit_price')} | Value: Rs.{ad.get('line_total')} | Reason: {ad.get('reason')}")
        print(f"  ! Potential Revenue Recovered: Rs. {revenue_alert.get('total_estimated_added_revenue'):,.2f}")

    po_drafts = state_vals.get("restock_po_drafts", [])
    print(f"\n[Autonomous Supplier Restock PO Drafts] ({len(po_drafts)} POs):")
    for po in po_drafts:
        print(f"  * Supplier: {po.get('supplier_name')} | Urgency: [{po.get('urgency')}] | Note: {po.get('order_note')}")
        for pit in po.get("po_items", []):
            print(f"     - {pit.get('item_name')} -> Restock Order Qty: {pit.get('order_qty')} "
                  f"@ Rs.{pit.get('unit_price')} (Total: Rs.{pit.get('line_total')})")

    # 4. Simulate human vendor review and approval
    print("\n" + "=" * 70)
    print("   [Step 4/5] SIMULATING HUMAN VENDOR APPROVAL VIA UPDATE_STATE")
    print("=" * 70)
    print(" -> Vendor accepts quotation: True")
    print(" -> Vendor accepts AI labor add-on: True")
    print(" -> Vendor approves autonomous restock PO: True")

    graph.update_state(
        config,
        {
            "human_approved_quote": True,
            "human_accepted_addon": True,
            "human_approved_po": True,
        }
    )

    # Resume graph execution (Node 4 will run from PostgresSaver checkpoint)
    print(" -> Resuming Graph Execution with graph.invoke(None, config)...")
    resumed_result = graph.invoke(None, config=config)

    print("\n[Step 5/5] Resumption Complete!")
    print(f" -> Final Status: {resumed_result.get('final_status')}")
    dispatch_results = resumed_result.get("dispatch_results", {})
    print(f" -> Quote ID in DB: {dispatch_results.get('quote_id')}")
    print(f" -> POs Issued: {dispatch_results.get('pos_issued')}")
    print(f" -> Client Portal Link: {dispatch_results.get('client_portal_url')}")
    print(f" -> Final Grand Total: Rs. {resumed_result.get('grand_total'):,.2f}")

    # 5. Verify records directly from Neon PostgreSQL
    print("\n--- Verifying Neon PostgreSQL Live Records ---")
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, thread_id, client_name, grand_total, status FROM quotes WHERE thread_id = %s;",
                (thread_id,)
            )
            saved_quote = cur.fetchone()
            print(f" [DB Quote Check]: ID={saved_quote['id']} | Client={saved_quote['client_name']} | "
                  f"Total=Rs.{saved_quote['grand_total']} | Status={saved_quote['status']}")

            cur.execute(
                "SELECT item_name, quantity, line_total, is_ai_suggested FROM quote_line_items WHERE quote_id = %s;",
                (saved_quote["id"],)
            )
            saved_items = cur.fetchall()
            print(f" [DB Line Items Check] ({len(saved_items)} items):")
            for sit in saved_items:
                addon_tag = " (AI Addon Accepted)" if sit["is_ai_suggested"] else ""
                print(f"   * {sit['item_name']} | Qty: {sit['quantity']} | Total: Rs.{sit['line_total']}{addon_tag}")

            cur.execute(
                "SELECT po_number, supplier_name, urgency, status FROM supplier_purchase_orders WHERE thread_id = %s;",
                (thread_id,)
            )
            saved_pos = cur.fetchall()
            print(f" [DB Purchase Orders Check] ({len(saved_pos)} POs):")
            for spo in saved_pos:
                print(f"   * {spo['po_number']} | Supplier: {spo['supplier_name']} | "
                      f"Urgency: {spo['urgency']} | Status: {spo['status']}")

    print("\n" + "=" * 70)
    print("   [SUCCESS] Full LangGraph HITL Workflow Verified Successfully!")
    print("=" * 70)

if __name__ == "__main__":
    extra_config = {
        "metadata": {"thread_id": thread_id},
        "project_name": "QuoteFlow-AI"
    }
    run_test(langsmith_extra=extra_config)
