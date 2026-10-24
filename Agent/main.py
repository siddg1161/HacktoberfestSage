import os
import sys
import time
from typing import Optional, List, Dict, Any
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agent.graph import create_quoteflow_graph
from agent.checkpointer import get_postgres_checkpointer
from db.schema import init_neon_database

app = FastAPI(title="QuoteFlow AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Neon DB schema and checkpointer on startup
@app.on_event("startup")
def on_startup():
    try:
        init_neon_database()
        print("✅ Neon DB initialized successfully.")
    except Exception as e:
        print(f"⚠️ Neon DB init note: {e}")

# Compile QuoteFlow graph with Neon PostgresSaver
try:
    cp = get_postgres_checkpointer()
    graph = create_quoteflow_graph(checkpointer=cp)
except Exception as e:
    print(f"⚠️ Fallback to MemorySaver: {e}")
    from langgraph.checkpoint.memory import MemorySaver
    graph = create_quoteflow_graph(checkpointer=MemorySaver())

class StartQuoteRequest(BaseModel):
    thread_id: Optional[str] = None
    client_name: Optional[str] = "Sharma Electrical Contractors"
    client_phone: Optional[str] = "+91-9826012345"
    voice_transcript: Optional[str] = ""
    slip_image_url: Optional[str] = None

class ApproveQuoteRequest(BaseModel):
    accept_quote: bool = True
    accept_addon: bool = True
    approve_po: bool = True
    edited_line_items: Optional[List[Dict[str, Any]]] = None
    edited_po_drafts: Optional[List[Dict[str, Any]]] = None
    accepted_addon_skus: Optional[List[str]] = None

class EditQuoteRequest(BaseModel):
    edited_line_items: List[Dict[str, Any]]

@app.get("/")
@app.get("/ok")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "QuoteFlow AI Agent",
        "graph": "quoteflow",
        "time": int(time.time()),
    }

@app.post("/api/quotes/start")
def start_quote(payload: StartQuoteRequest):
    try:
        thread_id = payload.thread_id or f"quote-{int(time.time())}"
        config = {"configurable": {"thread_id": thread_id}}
        
        initial_input = {
            "thread_id": thread_id,
            "client_name": payload.client_name,
            "client_phone": payload.client_phone,
            "voice_transcript": payload.voice_transcript,
            "slip_image_url": payload.slip_image_url,
        }

        # Run pipeline until interrupt_before=["execute_dispatch_node"]
        graph.invoke(initial_input, config=config)
        snapshot = graph.get_state(config)
        vals = snapshot.values

        return {
            "success": True,
            "data": {
                "threadId": thread_id,
                "status": "PAUSED_AT_HITL_GATE",
                "nextPendingNode": list(snapshot.next),
                "clientName": vals.get("client_name"),
                "clientPhone": vals.get("client_phone"),
                "extractedItems": vals.get("extracted_items", []),
                "subtotal": vals.get("subtotal", 0),
                "gstTotal": vals.get("gst_total", 0),
                "grandTotal": vals.get("grand_total", 0),
                "aiRevenueAlert": vals.get("ai_revenue_alert"),
                "restockPoDrafts": vals.get("restock_po_drafts", []),
                "values": vals,
            }
        }
    except Exception as e:
        print(f"[start_quote error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quotes/{thread_id}/approve")
def approve_quote(thread_id: str, payload: ApproveQuoteRequest):
    try:
        config = {"configurable": {"thread_id": thread_id}}

        update_vals: Dict[str, Any] = {
            "human_approved_quote": payload.accept_quote,
            "human_accepted_addon": payload.accept_addon,
            "human_approved_po": payload.approve_po,
        }
        if payload.edited_line_items is not None:
            update_vals["edited_line_items"] = payload.edited_line_items
        if payload.edited_po_drafts is not None:
            update_vals["restock_po_drafts"] = payload.edited_po_drafts
        if payload.accepted_addon_skus is not None:
            update_vals["accepted_addon_skus"] = payload.accepted_addon_skus

        # Update paused state with human decisions
        graph.update_state(config=config, values=update_vals)

        # Resume execution -> execute_dispatch_node commits to PostgreSQL
        resumed = graph.invoke(None, config=config)

        return {
            "success": True,
            "data": {
                "threadId": thread_id,
                "status": resumed.get("final_status", "QUOTED_AND_DISPATCHED"),
                "clientName": resumed.get("client_name"),
                "grandTotal": resumed.get("grand_total", 0),
                "dispatchResults": resumed.get("dispatch_results", {}),
                "values": resumed,
            }
        }
    except Exception as e:
        print(f"[approve_quote error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/quotes/{thread_id}/edit")
def edit_quote(thread_id: str, payload: EditQuoteRequest):
    try:
        config = {"configurable": {"thread_id": thread_id}}
        graph.update_state(
            config=config,
            values={
                "edited_line_items": payload.edited_line_items,
                "extracted_items": payload.edited_line_items,
            }
        )
        snapshot = graph.get_state(config)
        vals = snapshot.values

        return {
            "success": True,
            "data": {
                "threadId": thread_id,
                "extractedItems": vals.get("extracted_items", []),
                "subtotal": vals.get("subtotal", 0),
                "gstTotal": vals.get("gst_total", 0),
                "grandTotal": vals.get("grand_total", 0),
                "values": vals,
            }
        }
    except Exception as e:
        print(f"[edit_quote error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RefineQuoteRequest(BaseModel):
    instruction: str

@app.post("/api/quotes/{thread_id}/refine")
def refine_quote(thread_id: str, payload: RefineQuoteRequest):
    try:
        config = {"configurable": {"thread_id": thread_id}}
        graph.update_state(
            config=config,
            values={
                "human_decision": "refine",
                "human_edit_feedback": payload.instruction,
                "refinement_instruction": payload.instruction,
            }
        )
        resumed = graph.invoke(None, config=config)
        snapshot = graph.get_state(config)
        vals = snapshot.values

        return {
            "success": True,
            "data": {
                "threadId": thread_id,
                "status": "AWAITING_APPROVAL",
                "extractedItems": vals.get("extracted_items", []),
                "subtotal": vals.get("subtotal", 0),
                "gstTotal": vals.get("gst_total", 0),
                "grandTotal": vals.get("grand_total", 0),
                "aiRevenueAlert": vals.get("ai_revenue_alert"),
                "restockPoDrafts": vals.get("restock_po_drafts", []),
                "refinementExplanation": vals.get("refinement_explanation", ""),
                "values": vals,
            }
        }
    except Exception as e:
        print(f"[refine_quote error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
