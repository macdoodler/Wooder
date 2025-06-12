-- Schema for wooder-calculations database

-- Create a table for storing calculation data
CREATE TABLE IF NOT EXISTS calculations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  kerf_thickness REAL NOT NULL,
  optimization_philosophy TEXT DEFAULT 'maximum_yield',  -- Add this
  custom_weights TEXT,                                    -- Add this
  available_stocks TEXT NOT NULL, -- JSON string of stock objects
  required_parts TEXT NOT NULL,   -- JSON string of part objects
  results TEXT,                   -- JSON string of results or NULL
  date_created INTEGER NOT NULL,
  date_modified INTEGER NOT NULL,
  user_id TEXT                    -- For future multi-user support
);

-- Create table for warehouse inventory
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id TEXT PRIMARY KEY,
  length REAL NOT NULL,
  width REAL NOT NULL,
  thickness REAL NOT NULL,
  quantity INTEGER NOT NULL,
  material TEXT,
  material_type TEXT,              -- 'sheet' or 'dimensional'
  location TEXT,
  grain_direction TEXT,            -- Added to match the type definition
  date_added INTEGER NOT NULL,
  date_modified INTEGER NOT NULL,
  user_id TEXT                     -- For future multi-user support
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calculations_date_modified ON calculations(date_modified DESC);
CREATE INDEX IF NOT EXISTS idx_calculations_name ON calculations(name);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_thickness ON warehouse_stock(thickness);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_material ON warehouse_stock(material);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_material_type ON warehouse_stock(material_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_date_added ON warehouse_stock(date_added DESC);
