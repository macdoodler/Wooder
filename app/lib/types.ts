// This type definition helps TypeScript understand the DB binding
import { D1Database } from '@cloudflare/workers-types';

// Define material types enum for better type safety
export enum MaterialType {
  Sheet = 'sheet',
  Dimensional = 'dimensional'
}

// Define the types to match our existing client-side types
export type Stock = {
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  id?: string; // For warehouse inventory tracking
  material?: string; // Material name (e.g., oak, pine, plywood)
  materialType?: MaterialType; // Type of material (sheet or dimensional)
  location?: string; // Storage location in warehouse
  dateAdded?: number; // When it was added to inventory
  grainDirection?: string; // Grain direction (relevant for sheet materials)
};

export type Part = {
  length: number;
  width: number;
  thickness: number; // Required thickness for the part
  quantity: number;
  material?: string; // Preferred material name
  materialType?: MaterialType; // Type of material (sheet or dimensional)
  grainDirection?: string; // Grain direction (relevant only for sheet materials)
  name?: string; // Optional name for the part
};

export type FreeSpace = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Placement = {
  partId: string;
  x: number;
  y: number;
  rotated: boolean;
  name?: string; // Optional name for the cut
  cut?: boolean; // Track if this piece has been cut
};

export type StockUsage = {
  sheetId: string;
  stockIndex: number;
  placements: Placement[];
  usedArea: number;
  wasteArea: number;
  freeSpaces: FreeSpace[];
};

export type Results = {
  success: boolean;
  message: string;
  stockUsage: StockUsage[];
  totalWaste: number;
  totalUsedSheets: number;
  sortedParts: Part[];
  cutSequences?: import('./cutSequenceOptimizer').OptimizedCutSequence[];
};

export type SavedCalculation = {
  id: string;
  name: string;
  description: string;
  kerfThickness: number;
  availableStocks: Stock[];
  requiredParts: Part[];
  results: Results | null;
  dateCreated: number;
  dateModified: number;
};

export type DBCalculation = {
  id: string;
  name: string;
  description: string;
  kerf_thickness: number;
  available_stocks: string;
  required_parts: string;
  results: string | null;
  date_created: number;
  date_modified: number;
  user_id: string | null;
};

// Convert database object to application object
export function dbToAppCalculation(dbCalc: DBCalculation): SavedCalculation {
  return {
    id: dbCalc.id,
    name: dbCalc.name,
    description: dbCalc.description,
    kerfThickness: dbCalc.kerf_thickness,
    availableStocks: JSON.parse(dbCalc.available_stocks),
    requiredParts: JSON.parse(dbCalc.required_parts),
    results: dbCalc.results ? JSON.parse(dbCalc.results) : null,
    dateCreated: dbCalc.date_created,
    dateModified: dbCalc.date_modified,
  };
}

// Convert application object to database object
export function appToDbCalculation(appCalc: SavedCalculation): DBCalculation {
  return {
    id: appCalc.id,
    name: appCalc.name,
    description: appCalc.description,
    kerf_thickness: appCalc.kerfThickness,
    available_stocks: JSON.stringify(appCalc.availableStocks),
    required_parts: JSON.stringify(appCalc.requiredParts),
    results: appCalc.results ? JSON.stringify(appCalc.results) : null,
    date_created: appCalc.dateCreated,
    date_modified: appCalc.dateModified,
    user_id: null, // No user system yet
  };
}

// Interface that binds to our Cloudflare D1 database
export interface Env {
  DB: D1Database;
}

export type Space = {
  width: number;
  length: number;
};

// Utility function to format dimensions in the standard format: Thickness × Width × Length
export function formatDimensions(
  item: { thickness: number; width: number; length: number; grainDirection?: string; materialType?: MaterialType },
  options: { 
    includeGrainDirection?: boolean; 
    includeUnits?: boolean;
    rotated?: boolean;
  } = { includeGrainDirection: true, includeUnits: true }
): string {
  const { thickness, width, length, grainDirection, materialType } = item;
  const { includeGrainDirection = true, includeUnits = true, rotated = false } = options;
  
  // For rotated parts, swap length and width
  const displayLength = rotated ? width : length;
  const displayWidth = rotated ? length : width;
  
  // Standard format: Thickness × Width × Length
  const units = includeUnits ? 'mm' : '';
  let dimensionString = `${thickness}${units} × ${displayWidth}${units} × ${displayLength}${units}`;
  if (units) {
    dimensionString = dimensionString.replace(/mm × /g, 'mm × ').replace(/mm$/, 'mm');
  }
  
  // Add grain direction clarification for sheet materials if available
  if (includeGrainDirection && materialType === MaterialType.Sheet && grainDirection) {
    const grainLength = displayLength; // Grain runs along the length dimension
    dimensionString += ` — grain along ${grainLength}mm`;
  }
  
  return dimensionString;
}

// Utility function to create the legacy "key" format for backward compatibility
export function createDimensionKey(item: { length: number; width: number; thickness: number }): string {
  // Keep the old format for internal keys: length×width×thickness
  return `${item.length}x${item.width}x${item.thickness}`;
}
