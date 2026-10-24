"""State Schemas and Pydantic Contracts for QuoteFlow AI Agent.

Defines:
1. ExtractionOutput (Schema A for Node 1 Gemma 4 .with_structured_output())
2. RevenueAuditOutput (Schema B for Node 3 Gemma 4 .with_structured_output())
3. QuoteFlowState (Master TypedDict for LangGraph execution)
"""

from typing import List, Optional, Dict, Any, Literal
from typing_extensions import TypedDict
from pydantic import BaseModel, Field

# -------------------------------------------------------------------------
# Schema A: Pydantic Output for Node 1 (Multimodal Extractor)
# -------------------------------------------------------------------------
class ExtractedLineItem(BaseModel):
    """Details of a single line item extracted from customer estimate slip or voice."""
    raw_item_name: str = Field(
        description="Raw item name extracted directly from handwritten slip or voice notes, e.g., 'Finolex 2.5 mm wire'"
    )
    matched_sku_id: str = Field(
        description="The SKU identifier matched from the provided catalog, e.g., 'SKU-WIRE-25'"
    )
    requested_qty: int = Field(
        description="Quantity required by the customer/vendor",
        ge=1
    )
    unit: str = Field(
        default="piece",
        description="Unit of measurement (coil, piece, pipe, point, m, etc.)"
    )
    confidence_score: float = Field(
        default=0.9,
        description="Confidence in parsing and SKU matching from 0.0 to 1.0 (used for UI warnings on messy handwriting)"
    )
    source: Literal["slip", "voice", "reconciled"] = Field(
        default="reconciled",
        description="Whether this was read from the handwritten slip, voice transcript, or cross-reconciled"
    )

class ExtractionOutput(BaseModel):
    """Structured output returned by Gemma 4 during Multimodal Extraction."""
    client_name_detected: Optional[str] = Field(
        default=None,
        description="Client or contractor name if mentioned in the slip header or audio note"
    )
    extracted_lines: List[ExtractedLineItem] = Field(
        default_factory=list,
        description="Extracted and catalog-mapped line items"
    )
    extraction_notes: Optional[str] = Field(
        default=None,
        description="Discrepancy notes, e.g., 'Voice transcript corrected coil count from 2 to 5'"
    )

# -------------------------------------------------------------------------
# Schema B: Pydantic Output for Node 3 (Revenue Guard Audit)
# -------------------------------------------------------------------------
class SuggestedAddonItem(BaseModel):
    """A single missing companion service or accessory suggested by AI."""
    suggested_sku_id: str = Field(
        description="Catalog SKU ID for the missing companion item (e.g. 'SKU-LABOR-ELEC')"
    )
    suggested_item_name: str = Field(
        description="Display name of the suggested add-on"
    )
    suggested_qty: int = Field(
        default=1,
        ge=1,
        description="Recommended quantity for the companion service or accessory"
    )
    reason: str = Field(
        description="Why this item was recommended based on quoted materials (e.g., 'Wire pulling labor for 5 coils')"
    )
    unit_price: float = Field(
        default=0.0,
        description="Catalog unit price (populated deterministically by Python, not hallucinated by LLM)"
    )
    line_total: float = Field(
        default=0.0,
        description="Estimated revenue added (calculated deterministically by Python)"
    )

class RevenueLeakageWarning(BaseModel):
    """Container for detected revenue leakage warnings and suggested add-ons."""
    has_warning: bool = Field(
        default=False,
        description="True if companion services, installation labor, or critical accessories are missing"
    )
    reason: str = Field(
        default="",
        description="Summary explanation of what was missed, e.g., 'Quoted wire coils & conduit pipes without labor'"
    )
    suggested_addons: List[SuggestedAddonItem] = Field(
        default_factory=list,
        description="List of all suggested companion items/services identified by AI"
    )
    total_estimated_added_revenue: float = Field(
        default=0.0,
        description="Total rupee revenue recoverable (calculated deterministically by Python math)"
    )

class RevenueAuditOutput(BaseModel):
    """Structured output returned by Gemma 4 during Revenue Guard Audit."""
    revenue_leakage_warning: RevenueLeakageWarning = Field(
        default_factory=RevenueLeakageWarning,
        description="Revenue leakage alert for missing installation labor or accessories"
    )
    audit_notes: Optional[str] = Field(
        default=None,
        description="Brief reasoning note on the audit"
    )

# Alias for backwards compatibility if needed
AuditAndProcurementOutput = RevenueAuditOutput

# -------------------------------------------------------------------------
# Warehouse Purchase Order Data Structures (Handled by Python Math)
# -------------------------------------------------------------------------
class DraftPurchaseOrderItem(BaseModel):
    sku_id: str
    item_name: str
    order_qty: int
    unit_price: float
    line_total: float

class DraftPurchaseOrder(BaseModel):
    supplier_name: str = Field(
        description="Preferred supplier name from catalog"
    )
    urgency: Literal["STANDARD_RESTOCK", "INSTANT_ORDER"] = Field(
        description="INSTANT_ORDER if Tier 3 deficit, STANDARD_RESTOCK if Tier 2 threshold warning"
    )
    po_items: List[DraftPurchaseOrderItem] = Field(
        default_factory=list,
        description="Items and restock quantities grouped under this supplier"
    )
    order_note: str = Field(
        default="",
        description="Deterministic calculation note, e.g., 'Shortfall of 2 coils + 10 coil threshold buffer'"
    )

# -------------------------------------------------------------------------
# Schema C: Pydantic Output for Refinement Node
# -------------------------------------------------------------------------
class RefinedItem(BaseModel):
    sku_id: str = Field(description="Catalog SKU identifier or CUSTOM-<name>")
    item_name: str = Field(description="Descriptive item name")
    quantity: int = Field(ge=1, default=1, description="Quantity")
    unit: str = Field(default="piece", description="Unit of measurement (coil, piece, pipe, etc.)")
    unit_price: float = Field(ge=0.0, description="Unit rate in currency")
    gst_rate: float = Field(default=18.0, description="GST rate percentage")

class RefinementOutput(BaseModel):
    modified_items: List[RefinedItem] = Field(
        default_factory=list,
        description="The updated list of line items after applying the user's natural language request"
    )
    explanation: str = Field(
        default="",
        description="Clear one-sentence explanation of changes made to the quote"
    )

# -------------------------------------------------------------------------
# Master LangGraph State
# -------------------------------------------------------------------------
class EnrichedLineItem(TypedDict, total=False):
    sku_id: str
    item_name: str
    unit: str
    quantity: int
    unit_price: float
    gst_rate: float
    gst_amount: float
    line_total: float
    current_stock: int
    reorder_threshold: int
    preferred_supplier: str
    stock_tier: Literal["HEALTHY", "THRESHOLD_WARNING", "INSTANT_DEFICIT"]
    deficit_qty: int
    is_ai_suggested: bool

class QuoteFlowState(TypedDict, total=False):
    """Master state passed through LangGraph nodes."""
    # Identification
    thread_id: str
    client_name: str
    client_phone: Optional[str]
    
    # Inputs
    slip_image_url: Optional[str]      # URL, local file path, or base64 data string of the parchi
    voice_transcript: Optional[str]    # Hinglish audio transcript or voice note
    
    # Node 1 intermediate outputs
    raw_catalog_sample: Optional[List[Dict[str, Any]]]
    extraction_notes: Optional[str]
    
    # Node 2 intermediate outputs (Enriched items with stock & GST math)
    extracted_items: List[Dict[str, Any]]
    needs_procurement: bool
    subtotal: float
    gst_total: float
    grand_total: float
    
    # Node 3 intermediate outputs (Deterministic POs + Gemma 4 Revenue Audit)
    ai_revenue_alert: Optional[Dict[str, Any]]
    restock_po_drafts: Optional[List[Dict[str, Any]]] # List of PO drafts grouped by supplier
    
    # HITL Resumption & Overrides
    human_approved_quote: bool

    human_accepted_addon: bool                        # Boolean or accept all 
    accepted_addon_skus: Optional[List[str]]          # Specific SKU IDs approved by human vendor
    
    human_approved_po: bool

    edited_line_items: Optional[List[Dict[str, Any]]] # Direct seller edits from UI table
    human_edit_feedback: Optional[str]                # Natural language instructions from seller
    refinement_instruction: Optional[str]             # Natural language revision prompt
    refinement_explanation: Optional[str]             # AI explanation of revision
    human_decision: Optional[str]                     # "approve" or "refine"
    
    # Business Tenant Context
    business_name: Optional[str]
    business_category: Optional[str]
    worker_name: Optional[str]
    currency_symbol: Optional[str]

    # Node 4 final execution status
    final_status: Literal["INIT", "EXTRACTED", "AWAITING_APPROVAL", "QUOTED_AND_DISPATCHED", "FAILED"]
    dispatch_results: Optional[Dict[str, Any]]
