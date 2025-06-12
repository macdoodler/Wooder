// Consolidated Cutting Optimization Engine
// All cutting optimization logic in one comprehensive file

import { Stock, Part, Placement, FreeSpace, Results, StockUsage, MaterialType } from './types';

// ===== CORE CUTTING OPTIMIZATION ENGINE =====

/**
 * Main cutting optimization function - consolidated algorithm
 */
export function calculateOptimalCuts(
  availableStocks: Stock[],
  requiredParts: Part[],
  kerfThickness: number = 3.2
): Results {
  console.log('🚀 Starting consolidated cutting optimization');
  
  // Input validation
  if (!availableStocks?.length) {
    return createErrorResult('No stock materials provided');
  }
  
  if (!requiredParts?.length) {
    return createErrorResult('No parts specified for cutting');
  }

  try {
    // Process inputs
    const processedStocks = processStockInventory(availableStocks);
    const expandedParts = expandPartsByQuantity(requiredParts);
    
    // Validate compatibility
    const validation = validateCompatibility(processedStocks, expandedParts);
    if (!validation.isValid) {
      return createErrorResult(`Insufficient stock: ${validation.message}`);
    }

    // Multi-sheet optimization
    const results = optimizeAcrossSheets(expandedParts, processedStocks, kerfThickness);
    
    // Calculate efficiency metrics
    const efficiency = calculateEfficiency(results.usedSheets, processedStocks);
    
    // Generate cut sequences
    const cutSequences = generateCutSequences(results.usedSheets, availableStocks, requiredParts);
    
    const totalWaste = results.usedSheets.reduce((sum, sheet) => sum + sheet.wasteArea, 0);
    const isSuccess = results.unplacedParts.length === 0;
    
    return {
      success: isSuccess,
      message: isSuccess 
        ? `✓ Optimized placement: ${results.usedSheets.length} sheets used, ${efficiency.materialEfficiency.toFixed(1)}% efficiency`
        : `⚠ Partial placement: ${results.unplacedParts.length} parts remaining`,
      stockUsage: results.usedSheets,
      totalUsedSheets: results.usedSheets.length,
      totalWaste,
      sortedParts: requiredParts,
      cutSequences
    };
    
  } catch (error: any) {
    console.error('❌ Optimization failed:', error);
    return createErrorResult(`Optimization error: ${error.message}`);
  }
}

// ===== HELPER FUNCTIONS =====

function createErrorResult(message: string): Results {
  return {
    success: false,
    message,
    stockUsage: [],
    totalUsedSheets: 0,
    totalWaste: 0,
    sortedParts: [],
    cutSequences: []
  };
}

function processStockInventory(stocks: Stock[]): ProcessedStock[] {
  return stocks.map((stock, index) => ({
    ...stock,
    stockIndex: index,
    originalQuantity: stock.quantity || 1,
    remainingQuantity: stock.quantity || 1
  }));
}

function expandPartsByQuantity(parts: Part[]): ProcessedPart[] {
  const expanded: ProcessedPart[] = [];
  
  parts.forEach((part, partIndex) => {
    const quantity = Math.max(1, Math.floor(part.quantity || 1));
    
    for (let i = 0; i < quantity; i++) {
      expanded.push({
        ...part,
        partIndex,
        quantity: 1,
        instanceId: `${partIndex}-${i}`
      });
    }
  });
  
  console.log(`Expanded ${parts.length} part types into ${expanded.length} individual parts`);
  return expanded;
}

function validateCompatibility(stocks: ProcessedStock[], parts: ProcessedPart[]): ValidationResult {
  // Basic validation - check if any stock can fit any part
  const hasCompatibleStock = parts.every(part => 
    stocks.some(stock => 
      stock.material === part.material &&
      stock.thickness === part.thickness &&
      stock.length >= part.length &&
      stock.width >= part.width
    )
  );

  return {
    isValid: hasCompatibleStock,
    message: hasCompatibleStock ? 'All parts compatible' : 'Some parts cannot fit on any available stock'
  };
}

function optimizeAcrossSheets(
  parts: ProcessedPart[],
  stocks: ProcessedStock[],
  kerfThickness: number
): MultiSheetResult {
  const results: MultiSheetResult = {
    usedSheets: [],
    unplacedParts: [...parts],
    totalEfficiency: 0
  };

  let sheetsProcessed = 0;
  const maxSheets = 50;

  while (results.unplacedParts.length > 0 && sheetsProcessed < maxSheets) {
    let sheetUsedThisRound = false;

    for (const stock of stocks) {
      if (results.unplacedParts.length === 0) break;
      if (stock.remainingQuantity <= 0) continue;

      // Find compatible parts
      const compatibleParts = results.unplacedParts.filter(part =>
        stock.material === part.material &&
        stock.thickness === part.thickness &&
        stock.length >= part.length &&
        stock.width >= part.width
      );

      if (compatibleParts.length > 0) {
        // Optimize sheet layout
        const sheetResult = optimizeSheetLayout(compatibleParts, stock, kerfThickness);
        
        if (sheetResult.placements.length > 0) {
          // Create sheet usage record
          const sheetUsage: StockUsage = {
            stockIndex: stock.stockIndex,
            sheetId: `Sheet-${results.usedSheets.length + 1}`,
            placements: sheetResult.placements,
            freeSpaces: sheetResult.freeSpaces,
            usedArea: sheetResult.usedArea,
            wasteArea: (stock.length * stock.width) - sheetResult.usedArea
          };

          results.usedSheets.push(sheetUsage);
          stock.remainingQuantity--;
          sheetsProcessed++;
          sheetUsedThisRound = true;

          // Remove placed parts
          sheetResult.placedPartInstances.forEach(instanceId => {
            const partIndex = results.unplacedParts.findIndex(p => p.instanceId === instanceId);
            if (partIndex >= 0) {
              results.unplacedParts.splice(partIndex, 1);
            }
          });

          break;
        }
      }
    }

    if (!sheetUsedThisRound) {
      console.log(`No compatible sheets found for remaining ${results.unplacedParts.length} parts`);
      break;
    }
  }

  return results;
}

function optimizeSheetLayout(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedPartInstances: string[] = [];
  let freeSpaces: FreeSpace[] = [{
    x: 0,
    y: 0,
    width: stock.length,
    height: stock.width
  }];

  // Sort parts by area (largest first for better foundation)
  const sortedParts = [...parts].sort((a, b) => (b.length * b.width) - (a.length * a.width));

  for (const part of sortedParts) {
    const placement = findOptimalPlacement(part, stock, placements, freeSpaces, kerfThickness);
    
    if (placement) {
      placements.push(placement.placement);
      placedPartInstances.push(part.instanceId || `${part.partIndex}-0`);
      
      // Update free spaces
      freeSpaces = updateFreeSpaces(
        freeSpaces,
        placement.spaceIndex,
        {
          length: part.length,
          width: part.width
        },
        {
          x: placement.placement.x,
          y: placement.placement.y
        },
        kerfThickness
      );
    }
  }

  const usedArea = placements.reduce((total, placement) => {
    const partIndex = parseInt(placement.partId.split('-')[1]);
    const part = parts.find(p => p.partIndex === partIndex);
    return total + (part ? part.length * part.width : 0);
  }, 0);

  return {
    placements,
    freeSpaces,
    usedArea,
    placedPartInstances
  };
}

function findOptimalPlacement(
  part: ProcessedPart,
  stock: ProcessedStock,
  existingPlacements: Placement[],
  freeSpaces: FreeSpace[],
  kerfThickness: number
): OptimalPlacement | null {
  let bestPlacement: OptimalPlacement | null = null;
  let bestScore = -1;

  for (let spaceIndex = 0; spaceIndex < freeSpaces.length; spaceIndex++) {
    const space = freeSpaces[spaceIndex];
    
    // Try both orientations
    const orientations = [
      { length: part.length, width: part.width, rotated: false },
      { length: part.width, width: part.length, rotated: true }
    ];

    for (const orientation of orientations) {
      // Check if part fits in space (with kerf)
      if (orientation.length + kerfThickness <= space.width && 
          orientation.width + kerfThickness <= space.height) {
        
        const placement: Placement = {
          partId: `Part-${part.partIndex}`,
          name: part.partIndex.toString(),
          x: space.x,
          y: space.y,
          rotated: orientation.rotated
        };

        // Check for collisions
        if (!hasCollisions(placement, orientation, existingPlacements, kerfThickness)) {
          // Calculate placement score
          const score = calculatePlacementScore(placement, orientation, space, existingPlacements);
          
          if (score > bestScore) {
            bestScore = score;
            bestPlacement = {
              placement,
              spaceIndex,
              wasteArea: space.width * space.height - orientation.length * orientation.width,
              efficiency: (orientation.length * orientation.width) / (space.width * space.height),
              grainCompliant: true // Simplified for consolidation
            };
          }
        }
      }
    }
  }

  return bestPlacement;
}

function hasCollisions(
  placement: Placement,
  dimensions: { length: number; width: number },
  existingPlacements: Placement[],
  kerfThickness: number
): boolean {
  const newLeft = placement.x;
  const newRight = placement.x + dimensions.length;
  const newTop = placement.y;
  const newBottom = placement.y + dimensions.width;

  for (const existing of existingPlacements) {
    // Simplified collision detection
    const existingRight = existing.x + 200; // Conservative estimate
    const existingBottom = existing.y + 200;

    if (!(newRight + kerfThickness <= existing.x || 
          newLeft >= existingRight + kerfThickness ||
          newBottom + kerfThickness <= existing.y ||
          newTop >= existingBottom + kerfThickness)) {
      return true;
    }
  }

  return false;
}

function calculatePlacementScore(
  placement: Placement,
  dimensions: { length: number; width: number },
  space: FreeSpace,
  existingPlacements: Placement[]
): number {
  // Simple scoring: prefer bottom-left corner, minimize waste
  const cornerBonus = (1000 - placement.x) + (1000 - placement.y);
  const efficiencyBonus = (dimensions.length * dimensions.width) / (space.width * space.height) * 1000;
  const adjacencyBonus = existingPlacements.length > 0 ? 100 : 0;
  
  return cornerBonus + efficiencyBonus + adjacencyBonus;
}

function updateFreeSpaces(
  spaces: FreeSpace[],
  usedSpaceIndex: number,
  partDimensions: { length: number; width: number },
  position: { x: number; y: number },
  kerfThickness: number
): FreeSpace[] {
  const newSpaces = [...spaces];
  const usedSpace = newSpaces[usedSpaceIndex];
  
  // Remove used space
  newSpaces.splice(usedSpaceIndex, 1);
  
  // Add new spaces created by splitting
  const partWidth = partDimensions.length + kerfThickness;
  const partHeight = partDimensions.width + kerfThickness;
  
  // Right space
  if (position.x + partWidth < usedSpace.x + usedSpace.width) {
    newSpaces.push({
      x: position.x + partWidth,
      y: usedSpace.y,
      width: usedSpace.x + usedSpace.width - (position.x + partWidth),
      height: usedSpace.height
    });
  }
  
  // Top space
  if (position.y + partHeight < usedSpace.y + usedSpace.height) {
    newSpaces.push({
      x: usedSpace.x,
      y: position.y + partHeight,
      width: usedSpace.width,
      height: usedSpace.y + usedSpace.height - (position.y + partHeight)
    });
  }
  
  return newSpaces.filter(space => space.width > 0 && space.height > 0);
}

function calculateEfficiency(usedSheets: StockUsage[], stocks: ProcessedStock[]): EfficiencyMetrics {
  if (usedSheets.length === 0) {
    return { materialEfficiency: 0, inventoryUtilization: 0 };
  }

  const totalUsedArea = usedSheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const totalSheetArea = usedSheets.reduce((sum, sheet) => {
    const stock = stocks[sheet.stockIndex];
    return sum + (stock.length * stock.width);
  }, 0);

  const materialEfficiency = (totalUsedArea / totalSheetArea) * 100;
  const inventoryUtilization = (usedSheets.length / stocks.reduce((sum, s) => sum + s.originalQuantity, 0)) * 100;

  return { materialEfficiency, inventoryUtilization };
}

function generateCutSequences(
  stockUsage: StockUsage[],
  availableStocks: Stock[],
  sortedParts: Part[]
): CutSequence[] {
  return stockUsage.map((usage, index) => ({
    stockUsageIndex: index,
    sheetId: usage.sheetId,
    steps: [
      {
        id: `${usage.sheetId}-breakdown`,
        stepNumber: 1,
        cutType: 'rip' as const,
        description: 'Initial breakdown cuts',
        safetyNotes: ['Use proper safety equipment', 'Support large sheets'],
        placements: usage.placements,
        priority: 'high' as const
      }
    ],
    totalSteps: 1,
    estimatedTime: usage.placements.length * 2, // 2 minutes per part
    safetyScore: 8,
    efficiencyScore: 7,
    recommendations: ['Check measurements twice', 'Use sharp blades']
  }));
}

// ===== TYPE DEFINITIONS =====

interface ProcessedStock extends Stock {
  stockIndex: number;
  originalQuantity: number;
  remainingQuantity: number;
}

interface ProcessedPart extends Part {
  partIndex: number;
  instanceId?: string;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

interface MultiSheetResult {
  usedSheets: StockUsage[];
  unplacedParts: ProcessedPart[];
  totalEfficiency: number;
}

interface SheetLayoutResult {
  placements: Placement[];
  freeSpaces: FreeSpace[];
  usedArea: number;
  placedPartInstances: string[];
}

interface OptimalPlacement {
  placement: Placement;
  spaceIndex: number;
  wasteArea: number;
  efficiency: number;
  grainCompliant: boolean;
}

interface EfficiencyMetrics {
  materialEfficiency: number;
  inventoryUtilization: number;
}

interface CutStep {
  id: string;
  stepNumber: number;
  cutType: 'rip' | 'crosscut' | 'initial-breakdown' | 'final-trim';
  description: string;
  safetyNotes: string[];
  placements: Placement[];
  priority: 'high' | 'medium' | 'low';
}

interface CutSequence {
  stockUsageIndex: number;
  sheetId: string;
  steps: CutStep[];
  totalSteps: number;
  estimatedTime: number;
  safetyScore: number;
  efficiencyScore: number;
  recommendations: string[];
}

export { calculateOptimalCuts as default };
