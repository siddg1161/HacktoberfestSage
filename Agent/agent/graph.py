"""LangGraph Pipeline & HITL StateGraph Wiring for QuoteFlow AI.

Topology:
START -> multimodal_extractor_node 
      -> inventory_and_billing_analyzer_node 
      -> revenue_and_procurement_node 
      -> [HITL Interrupt Gate] 
      -> execute_dispatch_node 
      -> END
"""

from langgraph.graph import StateGraph, START, END
from agent.state import QuoteFlowState
from agent.nodes import (
    multimodal_extractor_node,
    inventory_and_billing_analyzer_node,
    revenue_and_procurement_node,
    execute_dispatch_node,
)
from agent.checkpointer import get_postgres_checkpointer

def create_quoteflow_graph(checkpointer=None):
    """Constructs and compiles the QuoteFlow AI StateGraph.
    
    Uses `interrupt_before=['execute_dispatch_node']` to pause execution,
    persisting state in Neon PostgreSQL via PostgresSaver for human vendor review.
    """
    builder = StateGraph(QuoteFlowState)

    # 1. Add the 4 Core Nodes
    builder.add_node("multimodal_extractor_node", multimodal_extractor_node)
    builder.add_node("inventory_and_billing_analyzer_node", inventory_and_billing_analyzer_node)
    builder.add_node("revenue_and_procurement_node", revenue_and_procurement_node)
    builder.add_node("execute_dispatch_node", execute_dispatch_node)

    # 2. Wire Linear Edges
    builder.add_edge(START, "multimodal_extractor_node")
    builder.add_edge("multimodal_extractor_node", "inventory_and_billing_analyzer_node")
    builder.add_edge("inventory_and_billing_analyzer_node", "revenue_and_procurement_node")
    builder.add_edge("revenue_and_procurement_node", "execute_dispatch_node")
    builder.add_edge("execute_dispatch_node", END)

    # 3. Checkpointer configuration:
    # If a checkpointer is passed (standalone execution), use it.
    # If None (LangGraph API / `langgraph dev`), compile without it so the platform handles persistence automatically.
    compile_kwargs = {"interrupt_before": ["execute_dispatch_node"]}
    if checkpointer is not None:
        compile_kwargs["checkpointer"] = checkpointer

    # 4. Compile with Human-In-The-Loop Interrupt Gate
    graph = builder.compile(**compile_kwargs)
    return graph

# Default graph instance for LangGraph API / `langgraph dev` (persistence handled by platform)
graph = create_quoteflow_graph()

# # Run this once at the bottom of app/agent/graph.py
# png_bytes = graph.get_graph().draw_mermaid_png()
# with open("quoteflow_architecture.png", "wb") as f:
#     f.write(png_bytes)
# print("✅ Saved quoteflow_architecture.png!")
