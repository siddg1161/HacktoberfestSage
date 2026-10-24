"""Neon PostgreSQL Schema & Multi-Industry Data Initializer for QuoteFlow AI.

Creates the 5 core business tables:
1. business_profiles (Multi-industry tenant profiles & settings)
2. catalog_items (Products, materials, and services with industry classification)
3. quotes (Quotation headers with business context & currency)
4. quote_line_items (Detailed line items & AI suggested companion services)
5. supplier_purchase_orders (Autonomous inventory replenishment POs)

Seeds multi-industry presets (Electrical, Plumbing, HVAC, Automotive, General Contracting)
and configures LangGraph PostgresSaver checkpoint tables.
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
-- 1. Business Profiles (Supports any industry, store, contractor or freelancer)
CREATE TABLE IF NOT EXISTS business_profiles (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(64) UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    industry VARCHAR(64) NOT NULL DEFAULT 'General',
    tagline TEXT,
    owner_name TEXT,
    email TEXT,
    phone VARCHAR(64),
    address TEXT,
    tax_id VARCHAR(64),
    currency_symbol VARCHAR(8) DEFAULT '₹',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catalog items (Supports multi-industry products, materials & services)
CREATE TABLE IF NOT EXISTS catalog_items (
    sku_id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    industry VARCHAR(64) NOT NULL DEFAULT 'General',
    unit VARCHAR(32) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 10,
    preferred_supplier TEXT NOT NULL,
    supplier_lead_time_days INTEGER NOT NULL DEFAULT 2
);

-- Safe migrations for existing databases
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS industry VARCHAR(64) NOT NULL DEFAULT 'General';

-- 3. Quotes table (Tracks business context and currency)
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(128) UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_phone VARCHAR(64),
    business_name TEXT DEFAULT 'My Business',
    business_category VARCHAR(100) DEFAULT 'General Services',
    currency VARCHAR(16) DEFAULT 'INR',
    currency_symbol VARCHAR(8) DEFAULT '₹',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    ai_revenue_alert JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safe migrations for existing quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS business_category VARCHAR(100) DEFAULT 'General Services';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency VARCHAR(16) DEFAULT 'INR';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(8) DEFAULT '₹';

-- 4. Quote line items
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

-- 5. Supplier purchase orders
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

SEED_BUSINESS_PROFILES_SQL = """
INSERT INTO business_profiles (
    business_id, business_name, industry, tagline, owner_name, email, phone, address, tax_id, currency_symbol
) VALUES
(
    'biz-electrical',
    'Sharma Electricals & Automation',
    'Electrical',
    'Intelligent Electrical, Wiring & Lighting Supplies',
    'Ramesh Sharma',
    'sharma.electricals@example.com',
    '+91-9826012345',
    'Depot Market, Indore, Madhya Pradesh',
    '23AABCP9876Q1Z8',
    '₹'
),
(
    'biz-plumbing',
    'Apex Flow Plumbing & Sanitary Solutions',
    'Plumbing',
    'Industrial & Domestic Water System Specialists',
    'Vikram Verma',
    'apex.plumbing@example.com',
    '+91-9876543210',
    'Industrial Area Phase 2, Pune, Maharashtra',
    '27AAECP1234M1Z5',
    '₹'
),
(
    'biz-hvac',
    'CoolTech Air Conditioning & HVAC Care',
    'HVAC',
    'Commercial & Residential Cooling Maintenance',
    'Sameer Khan',
    'cooltech.hvac@example.com',
    '+91-9988776655',
    'Sector 18, Noida, Uttar Pradesh',
    '09AALCK5678P1Z3',
    '₹'
),
(
    'biz-auto',
    'Precision Auto Care & Garage Services',
    'Automotive',
    'Diagnostics, Servicing & Genuine Spares',
    'Arjun Mehta',
    'precision.auto@example.com',
    '+91-9123456789',
    'Ring Road Auto Hub, Bangalore, Karnataka',
    '29AAKCP4321R1Z9',
    '₹'
),
(
    'biz-general',
    'Universal Pro Services & Contractors',
    'General',
    'On-demand Estimations, Repairs & Project Supply',
    'Operations Manager',
    'contact@universalpro.com',
    '+91-9000011111',
    'City Central Plaza, Mumbai',
    '27AABCV8888Z1Z1',
    '₹'
)
ON CONFLICT (business_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    industry = EXCLUDED.industry,
    tagline = EXCLUDED.tagline,
    owner_name = EXCLUDED.owner_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    tax_id = EXCLUDED.tax_id,
    currency_symbol = EXCLUDED.currency_symbol;
"""

SEED_CATALOG_SQL = """
INSERT INTO catalog_items (
    sku_id, item_name, category, industry, unit, unit_price, gst_rate,
    current_stock, reorder_threshold, preferred_supplier, supplier_lead_time_days
) VALUES 
-- 1. ELECTRICAL & HARDWARE
(
    'SKU-WIRE-25',
    'Finolex 2.5 sq mm Flame Retardant Wire Coil (90m Red)',
    'Wiring',
    'Electrical',
    'coil',
    1850.00,
    18.00,
    3,
    10,
    'Havells & Finolex Depot',
    2
),
(
    'SKU-SW-ROMA6',
    'Anchor Roma 6A 1-Way Modular Switch White',
    'Switches',
    'Electrical',
    'piece',
    45.00,
    18.00,
    50,
    20,
    'Electrical Wholesale Mart',
    1
),
(
    'SKU-LED-18W',
    'Philips 18W Square Surface/Concealed LED Panel Light (Cool Day)',
    'Lighting',
    'Electrical',
    'piece',
    420.00,
    18.00,
    12,
    10,
    'Philips Lighting Distributor',
    3
),
(
    'SKU-PVC-25',
    'Precision 25mm Heavy Duty PVC Conduit Pipe (3m length)',
    'Piping',
    'Electrical',
    'pipe',
    85.00,
    18.00,
    8,
    15,
    'Malwa Pipe Traders',
    2
),
(
    'SKU-LABOR-ELEC',
    'Electrical Concealed Point Piping & Wire Pulling Labor Charge',
    'Services',
    'Electrical',
    'point',
    150.00,
    18.00,
    999,
    0,
    'Internal Field Electricians',
    0
),

-- 2. PLUMBING & SANITARY
(
    'SKU-PLUMB-PIPE1',
    'Astral 1-inch CPVC High-Pressure Water Pipe (3m Length)',
    'Piping',
    'Plumbing',
    'pipe',
    320.00,
    18.00,
    15,
    20,
    'Astral Pipes Regional Depot',
    2
),
(
    'SKU-PLUMB-VALVE',
    'Zoloto 1-inch Forged Brass Heavy Duty Ball Valve',
    'Valves',
    'Plumbing',
    'piece',
    480.00,
    18.00,
    6,
    10,
    'National Plumbing Hardware Supply',
    2
),
(
    'SKU-PLUMB-TAP',
    'Jaquar Alive Chrome Plated Basin Tap / Bib Cock',
    'Faucets',
    'Plumbing',
    'piece',
    1450.00,
    18.00,
    4,
    5,
    'Jaquar Sanitary Distributors',
    3
),
(
    'SKU-LABOR-PLUMB',
    'Plumbing Concealed Fitting, Pipeline Repair & Leakage Labor',
    'Services',
    'Plumbing',
    'job',
    450.00,
    18.00,
    999,
    0,
    'Master Certified Plumbers',
    0
),

-- 3. HVAC & AIR CONDITIONING
(
    'SKU-AC-GAS-R32',
    'EcoSafe R-32 Eco Refrigerant Gas Can (1kg Sealed)',
    'Consumables',
    'HVAC',
    'can',
    1250.00,
    18.00,
    5,
    8,
    'Subzero Refrigeration Gases',
    1
),
(
    'SKU-AC-CAP-50',
    'Kelvin Dual Run 50+5 MFD Heavy Duty AC Compressor Capacitor',
    'Spares',
    'HVAC',
    'piece',
    380.00,
    18.00,
    14,
    10,
    'Kelvin Electro-Mechanical Depot',
    1
),
(
    'SKU-AC-COPPER-10',
    'Mandev 1/2-inch & 1/4-inch Insulated Copper Tubing Kit (3m)',
    'Tubing',
    'HVAC',
    'set',
    2100.00,
    18.00,
    3,
    6,
    'Metals & Tubes Logistics',
    2
),
(
    'SKU-LABOR-AC-JET',
    'Split AC Master Jet Wash Deep Cleaning & Filter Service',
    'Services',
    'HVAC',
    'service',
    799.00,
    18.00,
    999,
    0,
    'HVAC Field Technicians',
    0
),

-- 4. AUTOMOTIVE & GARAGE
(
    'SKU-AUTO-OIL-5W30',
    'Castrol MAGNATEC 5W-30 Full Synthetic Engine Oil (3.5 Liter Can)',
    'Lubricants',
    'Automotive',
    'can',
    2350.00,
    18.00,
    8,
    12,
    'Castrol Lubricants Hub',
    1
),
(
    'SKU-AUTO-BRAKE-F',
    'Bosch Premium Low-Metallic Front Brake Pad Set',
    'Braking',
    'Automotive',
    'set',
    1650.00,
    18.00,
    4,
    8,
    'Bosch Automotive Spares Hub',
    2
),
(
    'SKU-LABOR-AUTO-SRV',
    'Comprehensive 40-Point Periodic Car Maintenance & Labor',
    'Services',
    'Automotive',
    'service',
    1200.00,
    18.00,
    999,
    0,
    'Senior Automobile Technicians',
    0
),

-- 5. GENERAL CONTRACTING & UNIVERSAL SERVICES
(
    'SKU-GEN-SURVEY',
    'On-Site Inspection, Measurements & Technical Estimate Consultation',
    'Consulting',
    'General',
    'visit',
    350.00,
    18.00,
    999,
    0,
    'Technical Surveyors Team',
    0
),
(
    'SKU-GEN-LABOR-HR',
    'General Field Maintenance & Installation Hourly Labor Charge',
    'Labor',
    'General',
    'hour',
    250.00,
    18.00,
    999,
    0,
    'Field Services Team',
    0
)
ON CONFLICT (sku_id) DO UPDATE SET
    item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    industry = EXCLUDED.industry,
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
                
                print("[db/schema.py]: Seeding multi-industry business profiles...")
                cur.execute(SEED_BUSINESS_PROFILES_SQL)
                print("[db/schema.py]: Business profiles seeded successfully.")

                print("[db/schema.py]: Seeding multi-industry catalog items (Electrical, Plumbing, HVAC, Automotive, General)...")
                cur.execute(SEED_CATALOG_SQL)
                print("[db/schema.py]: Multi-industry catalog seeded successfully.")
                
                cur.execute("SELECT sku_id, item_name, industry, current_stock, reorder_threshold FROM catalog_items ORDER BY industry, sku_id;")
                rows = cur.fetchall()
                print("\n--- Current Seeded Multi-Industry Catalog Items ---")
                for r in rows:
                    print(f" * [{r['industry']}] {r['sku_id']}: {r['item_name']} | Stock: {r['current_stock']}")
                print("---------------------------------------------------\n")

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
