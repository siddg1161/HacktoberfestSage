"""Neon PostgreSQL Schema & Mock Data Initializer for QuoteFlow AI.

Creates the 4 core business tables:
1. catalog_items
2. quotes
3. quote_line_items
4. supplier_purchase_orders

Also seeds 5 test catalog items and sets up LangGraph PostgresSaver checkpoint tables.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path so standalone script execution works cleanly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import psycopg
from psycopg.rows import dict_row
from core.config import settings

CREATE_TABLES_SQL = """
-- 1. Catalog items
CREATE TABLE IF NOT EXISTS catalog_items (
    sku_id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 10,
    preferred_supplier TEXT NOT NULL,
    supplier_lead_time_days INTEGER NOT NULL DEFAULT 2
);

-- 2. Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(128) UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_phone VARCHAR(64),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    ai_revenue_alert JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quote line items
CREATE TABLE IF NOT EXISTS quote_line_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    sku_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    stock_tier TEXT NOT NULL,
    is_ai_suggested BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Supplier purchase orders
CREATE TABLE IF NOT EXISTS supplier_purchase_orders (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(128) NOT NULL,
    po_number VARCHAR(64) UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    items_payload JSONB NOT NULL,
    urgency VARCHAR(32) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

SEED_CATALOG_SQL = """
INSERT INTO catalog_items (
    sku_id, item_name, category, unit, unit_price, gst_rate,
    current_stock, reorder_threshold, preferred_supplier, supplier_lead_time_days
) VALUES 
(
    'SKU-WIRE-25',
    'Finolex 2.5 sq mm Flame Retardant Wire Coil (90m Red)',
    'Wiring',
    'coil',
    1850.00,
    18.00,
    3,
    10,
    'Havells & Finolex Depot Indore',
    2
),
(
    'SKU-SW-ROMA6',
    'Anchor Roma 6A 1-Way Modular Switch White',
    'Switches',
    'piece',
    45.00,
    18.00,
    50,
    20,
    'Indore Electrical Wholesale Mart',
    1
),
(
    'SKU-LED-18W',
    'Philips 18W Square Surface/Concealed LED Panel Light (Cool Day)',
    'Lighting',
    'piece',
    420.00,
    18.00,
    12,
    10,
    'Philips Lighting Regional Distributor',
    3
),
(
    'SKU-PVC-25',
    'Precision 25mm Heavy Duty PVC Conduit Pipe (3m length)',
    'Piping',
    'pipe',
    85.00,
    18.00,
    8,
    15,
    'Malwa Pipe Traders Indore',
    2
),
(
    'SKU-LABOR-ELEC',
    'Electrical Concealed Point Piping & Wire Pulling Labor Charge',
    'Services',
    'point',
    150.00,
    18.00,
    999,
    0,
    'Internal Field Electricians',
    0
)
ON CONFLICT (sku_id) DO UPDATE SET
    item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    unit_price = EXCLUDED.unit_price,
    gst_rate = EXCLUDED.gst_rate,
    current_stock = EXCLUDED.current_stock,
    reorder_threshold = EXCLUDED.reorder_threshold,
    preferred_supplier = EXCLUDED.preferred_supplier,
    supplier_lead_time_days = EXCLUDED.supplier_lead_time_days;
"""

def init_neon_database():
    """Initializes the database schema, seeds test items, and sets up checkpointer."""
    db_url = settings.database_url
    print(f"[db/schema.py]: Connecting to Neon DB...")
    
    try:
        with psycopg.connect(db_url, autocommit=True, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                print("[db/schema.py]: Creating core business tables...")
                cur.execute(CREATE_TABLES_SQL)
                print("[db/schema.py]: Tables verified / created successfully.")
                
                print("[db/schema.py]: Seeding 5 test catalog items...")
                cur.execute(SEED_CATALOG_SQL)
                print("[db/schema.py]: Mock catalog seeded successfully.")
                
                cur.execute("SELECT sku_id, item_name, current_stock, reorder_threshold FROM catalog_items;")
                rows = cur.fetchall()
                print("\n--- Current Seeded Catalog Items ---")
                for r in rows:
                    print(f" * {r['sku_id']}: {r['item_name']} | Stock: {r['current_stock']} | Reorder Threshold: {r['reorder_threshold']}")
                print("------------------------------------\n")

        # Setup LangGraph checkpointer tables
        try:
            from langgraph.checkpoint.postgres import PostgresSaver
            print("[db/schema.py]: Setting up LangGraph PostgresSaver checkpoint tables...")
            with PostgresSaver.from_conn_string(db_url) as checkpointer:
                checkpointer.setup()
            print("[db/schema.py]: LangGraph checkpoints setup completed successfully.")
        except Exception as e:
            print(f"[db/schema.py]: Note on checkpointer setup: {e}")

        print("\n[SUCCESS] Neon PostgreSQL Database Initialized Successfully!")

    except Exception as e:
        print(f"\n[ERROR] Database Initialization Failed: {e}", file=sys.stderr)
        raise e

if __name__ == "__main__":
    init_neon_database()
