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

export type StockUsage = {
  sheetId: string;
  stockIndex: number;
  placements: Placement[];
  usedArea: number;
  wasteArea: number;
  freeSpaces: FreeSpace[];
};

export interface CutStep {
  id: string;
  stepNumber: number;
  cutType: 'rip' | 'crosscut' | 'initial-breakdown' | 'final-trim';
  description: string;
  safetyNotes: string[];
  placements: Placement[];
  priority: 'high' | 'medium' | 'low';
}

export interface CutSequence {
  stockUsageIndex: number;
  sheetId: string;
  steps: CutStep[];
  totalSteps: number;
  estimatedTime: number;
  safetyScore: number;
  efficiencyScore: number;
  recommendations: string[];
}

export type Results = {
  success: boolean;
  message: string;
  stockUsage: StockUsage[];
  totalWaste: number;
  totalUsedSheets: number;
  sortedParts: Part[];
  cutSequences?: CutSequence[];
};

export interface SavedCalculation {
  id: string;
  name: string;
  description?: string;
  kerfThickness: number;
  optimizationPhilosophy?: OptimizationPhilosophy; // Add this
  customWeights?: OptimizationWeights; // Add this
  availableStocks: Stock[];
  requiredParts: Part[];
  results: Results | null;
  dateCreated: number;
  dateModified: number;
  userId?: string;
}

export interface Placement {
  partId: string;
  name: string;
  x: number;
  y: number;
  rotated: boolean;
  width: number;   // Add this - actual width after rotation
  height: number;  // Add this - actual height after rotation
}

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
export function dbToAppCalculation(dbRow: any): SavedCalculation {
  return {
    id: dbRow.id,
    name: dbRow.name,
    description: dbRow.description,
    kerfThickness: dbRow.kerf_thickness,
    optimizationPhilosophy: dbRow.optimization_philosophy || OptimizationPhilosophy.MaximumYield, // Add this
    customWeights: dbRow.custom_weights ? JSON.parse(dbRow.custom_weights) : undefined, // Add this
    availableStocks: JSON.parse(dbRow.available_stocks),
    requiredParts: JSON.parse(dbRow.required_parts),
    results: dbRow.results ? JSON.parse(dbRow.results) : null,
    dateCreated: dbRow.date_created,
    dateModified: dbRow.date_modified,
    userId: dbRow.user_id
  };
}

// Convert application object to database object
export function appToDbCalculation(appCalc: SavedCalculation): any {
  return {
    id: appCalc.id,
    name: appCalc.name,
    description: appCalc.description || null,
    kerf_thickness: appCalc.kerfThickness,
    optimization_philosophy: appCalc.optimizationPhilosophy || 'maximum_yield', // Add this
    custom_weights: appCalc.customWeights ? JSON.stringify(appCalc.customWeights) : null, // Add this
    available_stocks: JSON.stringify(appCalc.availableStocks),
    required_parts: JSON.stringify(appCalc.requiredParts),
    results: appCalc.results ? JSON.stringify(appCalc.results) : null,
    date_created: appCalc.dateCreated,
    date_modified: appCalc.dateModified,
    user_id: appCalc.userId || null
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

export enum OptimizationPhilosophy {
  MaximumYield = 'maximum_yield',
  MinimumCuts = 'minimum_cuts',
  GuillotineCutting = 'guillotine_cutting',
  PartGrouping = 'part_grouping',
  PriorityBased = 'priority_based',
  GrainMatching = 'grain_matching',
  InventoryManagement = 'inventory_management',
  MixedOptimization = 'mixed_optimization'
}

export interface OptimizationWeights {
  materialEfficiency: number;
  cuttingSimplicity: number;
  partGrouping: number;
  grainAlignment: number;
  inventoryUsage: number;
}

export const OptimizationPhilosophyDescriptions: Record<OptimizationPhilosophy, string> = {
  [OptimizationPhilosophy.MaximumYield]: 'Minimize waste - uses highest percentage of material possible',
  [OptimizationPhilosophy.MinimumCuts]: 'Reduce total cuts - faster production but may waste more material',
  [OptimizationPhilosophy.GuillotineCutting]: 'Straight edge-to-edge cuts only - for panel saws',
  [OptimizationPhilosophy.PartGrouping]: 'Keep parts from same project together on sheets',
  [OptimizationPhilosophy.PriorityBased]: 'Cut critical pieces first from best material',
  [OptimizationPhilosophy.GrainMatching]: 'Maintain grain continuity across adjacent pieces',
  [OptimizationPhilosophy.InventoryManagement]: 'Use up odd-sized remnants and older stock first',
  [OptimizationPhilosophy.MixedOptimization]: 'Balanced approach - customize weights for each factor'
};

export const DefaultOptimizationWeights: Record<OptimizationPhilosophy, OptimizationWeights> = {
  [OptimizationPhilosophy.MaximumYield]: {
    materialEfficiency: 1.0,
    cuttingSimplicity: 0.1,
    partGrouping: 0.1,
    grainAlignment: 0.3,
    inventoryUsage: 0.2
  },
  [OptimizationPhilosophy.MinimumCuts]: {
    materialEfficiency: 0.3,
    cuttingSimplicity: 1.0,
    partGrouping: 0.2,
    grainAlignment: 0.2,
    inventoryUsage: 0.1
  },
  [OptimizationPhilosophy.GuillotineCutting]: {
    materialEfficiency: 0.5,
    cuttingSimplicity: 0.8,
    partGrouping: 0.3,
    grainAlignment: 0.3,
    inventoryUsage: 0.2
  },
  [OptimizationPhilosophy.PartGrouping]: {
    materialEfficiency: 0.5,
    cuttingSimplicity: 0.3,
    partGrouping: 1.0,
    grainAlignment: 0.3,
    inventoryUsage: 0.2
  },
  [OptimizationPhilosophy.PriorityBased]: {
    materialEfficiency: 0.6,
    cuttingSimplicity: 0.4,
    partGrouping: 0.5,
    grainAlignment: 0.5,
    inventoryUsage: 0.3
  },
  [OptimizationPhilosophy.GrainMatching]: {
    materialEfficiency: 0.4,
    cuttingSimplicity: 0.3,
    partGrouping: 0.5,
    grainAlignment: 1.0,
    inventoryUsage: 0.2
  },
  [OptimizationPhilosophy.InventoryManagement]: {
    materialEfficiency: 0.5,
    cuttingSimplicity: 0.4,
    partGrouping: 0.3,
    grainAlignment: 0.3,
    inventoryUsage: 1.0
  },
  [OptimizationPhilosophy.MixedOptimization]: {
    materialEfficiency: 0.7,
    cuttingSimplicity: 0.5,
    partGrouping: 0.5,
    grainAlignment: 0.5,
    inventoryUsage: 0.5
  }
};