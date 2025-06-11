// filepath: /Users/simon.billington/Library/CloudStorage/OneDrive-LEWIS/Documents/Repos/Wooder/app/lib/calculateOptimalCuts.ts
// Implementation of the calculateOptimalCuts function with optimized 5-phase algorithm
import { Stock, Part, StockUsage, MaterialType, Results, FreeSpace, Placement, formatDimensions } from './types';
import { handleSheetMaterialCutting, handleDimensionalLumberCutting } from './cut-helpers';
import { generateOptimalCutSequence, OptimizedCutSequence } from './cutSequenceOptimizer';
import { OptimizedCuttingEngine } from './optimized-cutting-engine';
// ALGORITHM CONSOLIDATION: Import unified packing engine instead of multiple redundant implementations
import { 
  consolidatedPackParts, 
  enhancedLayoutOptimization, 
  advancedSpaceManagement,
  getMigrationStats 
} from './algorithm-integration';

// Initialize debugging only in browser environment with performance optimization
if (typeof window !== 'undefined') {
  console.clear(); // Clear previous logs
  (window as any).DEBUG_CUTTING = true; // Enable basic cutting debug
  // Performance: Only enable verbose debugging when explicitly requested
  // Set (window as any).DEBUG_VERBOSE = true for detailed logging
  if (!(window as any).DEBUG_VERBOSE) {
    (window as any).DEBUG_SHARED_CUTS = false;
    (window as any).DEBUG_KERF_AWARE = false;
    (window as any).DEBUG_COLLISION = false;
    (window as any).DEBUG_PLACEMENT = false;
    (window as any).DEBUG_MULTI_SHEET = false;
  } else {
    // When verbose debugging is enabled, activate all debug categories
    (window as any).DEBUG_SHARED_CUTS = true;
    (window as any).DEBUG_KERF_AWARE = true;
    (window as any).DEBUG_COLLISION = true;
    (window as any).DEBUG_PLACEMENT = true;
    (window as any).DEBUG_MULTI_SHEET = true;
  }
}

// Data structures for cross-sheet optimization
interface WasteRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

interface OptimizationOpportunity {
  partId: string; // Use partId instead of pieceIndex for stable identification
  sourceSheetIndex: number;
  targetSheetIndex: number;
  wasteRegionIndex: number;
  estimatedBenefit: number;
  newRotation: boolean;
  newPosition: { x: number; y: number };
  geometricFeasible: boolean;
}

/**
 * Applies cross-sheet optimization to redistribute pieces for better overall material utilization
 */
function applyCrossSheetOptimization(
  stockUsage: StockUsage[],
  availableStocks: Stock[],
  sortedParts: Part[],
  kerfThickness: number,
  requiredParts: Part[]
): StockUsage[] {
  console.log(`[OPTIMIZATION] Starting cross-sheet optimization for ${stockUsage.length} sheets`);
  
  // Only optimize if we have multiple sheets
  if (stockUsage.length <= 1) {
    console.log(`[OPTIMIZATION] Single sheet detected, skipping cross-sheet optimization`);
    return stockUsage;
  }
  
  // Create deep copy of stock usage for optimization
  const optimizedUsage = stockUsage.map(usage => ({
    ...usage,
    placements: [...usage.placements],
    freeSpaces: [...usage.freeSpaces]
  }));
  
  console.log(`[OPTIMIZATION] Analyzing waste regions across ${optimizedUsage.length} sheets`);
  
  // Step 1: Analyze waste areas for each sheet
  const sheetWasteAnalysis = optimizedUsage.map((usage, sheetIndex) => {
    const stock = availableStocks[usage.stockIndex];
    const wasteRegions = calculateWasteRegions(usage, stock, sortedParts, kerfThickness);
    const efficiency = (usage.usedArea / (stock.length * stock.width)) * 100;
    
    console.log(`[SHEET ${sheetIndex + 1}] Efficiency: ${efficiency.toFixed(1)}%, Waste regions: ${wasteRegions.length}`);
    wasteRegions.forEach((region, i) => {
      console.log(`  Region ${i + 1}: ${region.width}×${region.height}mm (${region.area}mm²) at (${region.x},${region.y})`);
    });
    
    return {
      sheetIndex,
      efficiency,
      wasteRegions,
      usage
    };
  });
  
  // Step 2: Find optimization opportunities
  const opportunities: OptimizationOpportunity[] = [];
  
  for (let sourceSheet = 0; sourceSheet < optimizedUsage.length; sourceSheet++) {
    const sourcePlacements = optimizedUsage[sourceSheet].placements;
    
    for (let pieceIndex = 0; pieceIndex < sourcePlacements.length; pieceIndex++) {
      const placement = sourcePlacements[pieceIndex];
      const partId = placement.partId;
      const partIndex = parseInt(partId.split('-')[1]);
      const part = requiredParts[partIndex];
      
      if (!part) continue;
      
      // Try to find a better home for this piece on other sheets
      for (let targetSheet = 0; targetSheet < sheetWasteAnalysis.length; targetSheet++) {
        if (targetSheet === sourceSheet) continue;
        
        const targetAnalysis = sheetWasteAnalysis[targetSheet];
        
        // Check if this piece can fit into waste regions of target sheet
        for (let regionIndex = 0; regionIndex < targetAnalysis.wasteRegions.length; regionIndex++) {
          const region = targetAnalysis.wasteRegions[regionIndex];
          
          // Check if part fits in region (with both rotations)
          const fitsNormal = (part.length <= region.width) && (part.width <= region.height);
          const fitsRotated = (part.width <= region.width) && (part.length <= region.height);
          
          if (fitsNormal || fitsRotated) {
            // Calculate benefit (area saved vs efficiency gained)
            const benefit = calculateOptimizationBenefit(
              placement, part, sourceSheet, targetSheet, regionIndex, 
              optimizedUsage, availableStocks, fitsRotated && !fitsNormal
            );
            
            if (benefit > 0) {
              opportunities.push({
                partId,
                sourceSheetIndex: sourceSheet,
                targetSheetIndex: targetSheet,
                wasteRegionIndex: regionIndex,
                estimatedBenefit: benefit,
                newRotation: fitsRotated && !fitsNormal,
                newPosition: { x: region.x, y: region.y },
                geometricFeasible: true
              });
            }
          }
        }
      }
    }
  }
  
  // Step 3: Apply optimizations (sorted by benefit)
  opportunities.sort((a, b) => b.estimatedBenefit - a.estimatedBenefit);
  
  console.log(`[OPTIMIZATION] Found ${opportunities.length} optimization opportunities`);
  
  let appliedOptimizations = 0;
  for (const opportunity of opportunities.slice(0, 10)) { // Limit to top 10 to avoid excessive processing
    const success = applyOptimization(opportunity, optimizedUsage, availableStocks, requiredParts, kerfThickness);
    if (success) {
      appliedOptimizations++;
      console.log(`[OPTIMIZATION] Applied optimization ${appliedOptimizations}: moved part ${opportunity.partId} from sheet ${opportunity.sourceSheetIndex + 1} to sheet ${opportunity.targetSheetIndex + 1}`);
    }
  }
  
  console.log(`[OPTIMIZATION] Applied ${appliedOptimizations} optimizations out of ${opportunities.length} opportunities`);
  return optimizedUsage;
}

/**
 * Calculate waste regions for a given sheet usage
 */
function calculateWasteRegions(usage: StockUsage, stock: Stock, parts: Part[], kerfThickness: number): WasteRegion[] {
  const regions: WasteRegion[] = [];
  
  // Simple implementation: find largest contiguous rectangles
  // This is a simplified version - a more sophisticated algorithm would use space decomposition
  
  for (const freeSpace of usage.freeSpaces) {
    if (freeSpace.width > 50 && freeSpace.height > 50) { // Only consider regions larger than 50x50mm
      regions.push({
        x: freeSpace.x,
        y: freeSpace.y,
        width: freeSpace.width,
        height: freeSpace.height,
        area: freeSpace.width * freeSpace.height
      });
    }
  }
  
  return regions.sort((a, b) => b.area - a.area); // Largest first
}

/**
 * Calculate the benefit of moving a part from one sheet to another
 */
function calculateOptimizationBenefit(
  placement: Placement,
  part: Part,
  sourceSheetIndex: number,
  targetSheetIndex: number,
  regionIndex: number,
  usage: StockUsage[],
  stocks: Stock[],
  requiresRotation: boolean
): number {
  // Simple benefit calculation based on area utilization improvement
  const sourceStock = stocks[usage[sourceSheetIndex].stockIndex];
  const targetStock = stocks[usage[targetSheetIndex].stockIndex];
  
  const partArea = part.length * part.width;
  const sourceSheetArea = sourceStock.length * sourceStock.width;
  const targetSheetArea = targetStock.length * targetStock.width;
  
  // Benefit increases if moving from less efficient to more efficient sheet
  const sourceEfficiency = usage[sourceSheetIndex].usedArea / sourceSheetArea;
  const targetEfficiency = usage[targetSheetIndex].usedArea / targetSheetArea;
  
  // Prefer moving to less utilized sheets and avoid rotation if possible
  const efficiencyBenefit = (sourceEfficiency - targetEfficiency) * 1000;
  const rotationPenalty = requiresRotation ? -50 : 0;
  
  return efficiencyBenefit + rotationPenalty;
}

/**
 * Apply an optimization by moving a part between sheets
 */
function applyOptimization(
  opportunity: OptimizationOpportunity,
  usage: StockUsage[],
  stocks: Stock[],
  parts: Part[],
  kerfThickness: number
): boolean {
  const sourceUsage = usage[opportunity.sourceSheetIndex];
  const targetUsage = usage[opportunity.targetSheetIndex];
  
  // Find and remove the placement from source sheet
  const placementIndex = sourceUsage.placements.findIndex(p => p.partId === opportunity.partId);
  if (placementIndex === -1) return false;
  
  const placement = sourceUsage.placements[placementIndex];
  sourceUsage.placements.splice(placementIndex, 1);
  
  // Add placement to target sheet with new position
  const newPlacement: Placement = {
    ...placement,
    x: opportunity.newPosition.x,
    y: opportunity.newPosition.y,
    rotated: opportunity.newRotation
  };
  
  targetUsage.placements.push(newPlacement);
  
  // Recalculate used areas and free spaces for both sheets
  recalculateSheetMetrics(sourceUsage, stocks[sourceUsage.stockIndex], parts, kerfThickness);
  recalculateSheetMetrics(targetUsage, stocks[targetUsage.stockIndex], parts, kerfThickness);
  
  return true;
}

/**
 * Recalculate metrics for a sheet after optimization
 */
function recalculateSheetMetrics(usage: StockUsage, stock: Stock, parts: Part[], kerfThickness: number): void {
  // Recalculate used area
  usage.usedArea = usage.placements.reduce((total, placement) => {
    const partIndex = parseInt(placement.partId.split('-')[1]);
    const part = parts[partIndex];
    if (part) {
      return total + (part.length * part.width);
    }
    return total;
  }, 0);
  
  // Recalculate waste area
  usage.wasteArea = (stock.length * stock.width) - usage.usedArea;
  
  // Simplified free space recalculation
  // In a production system, this would use a more sophisticated space decomposition algorithm
  usage.freeSpaces = [{
    x: 0,
    y: 0,
    width: stock.length,
    height: stock.width
  }];
}

/**
 * Backward compatibility function for cut-helpers.ts
 * This is a simplified version that doesn't perform reorganization
 * The new optimized engine handles placement more comprehensively
 */
export function tryReorganizeSheet(
  existingPlacements: Placement[],
  partsToPlace: { part: Part; partIndex: number; quantity: number }[],
  allParts: Part[],
  stock: Stock,
  kerfThickness: number
): {
  success: boolean;
  placements: Placement[];
  usedArea: number;
  freeSpaces: FreeSpace[];
} {
  // For now, return the existing placements without reorganization
  // The new optimized engine handles this more efficiently during initial placement
  console.log('[REORGANIZE] Using optimized engine - reorganization handled during initial placement');
  
  const totalUsedArea = existingPlacements.reduce((total, placement) => {
    const partIndex = parseInt(placement.partId.split('-')[1]);
    const part = allParts[partIndex];
    if (part) {
      return total + (part.length * part.width);
    }
    return total;
  }, 0);

  return {
    success: false, // Always return false to avoid disrupting optimized placements
    placements: existingPlacements,
    usedArea: totalUsedArea,
    freeSpaces: [] // Simplified - the new engine calculates this more accurately
  };
}

/**
 * Main cutting optimization function using the new 5-phase algorithm
 */
export function calculateOptimalCuts(
  availableStocks: Stock[],
  requiredParts: Part[],
  kerfThickness: number = 0 // Default to 0 if not provided
): Results {
  console.log('\n🚀 === OPTIMIZED CUTTING ALGORITHM START ===');
  console.log('🔵 [DEBUG-ENGINE] Function called with:');
  console.log('🔵 [DEBUG-ENGINE] availableStocks:', JSON.stringify(availableStocks, null, 2));
  console.log('🔵 [DEBUG-ENGINE] requiredParts:', JSON.stringify(requiredParts, null, 2));
  console.log('🔵 [DEBUG-ENGINE] kerfThickness:', kerfThickness);
  
  console.log('Using new 5-Phase Processing Pipeline');
  console.time('Total Optimization Time');

  // Input validation
  if (!availableStocks || availableStocks.length === 0) {
    console.log('🔴 [DEBUG-ENGINE] No stock materials provided');
    return {
      success: false,
      message: "No stock materials provided",
      stockUsage: [],
      totalUsedSheets: 0,
      totalWaste: 0,
      sortedParts: requiredParts,
      cutSequences: []
    };
  }

  if (!requiredParts || requiredParts.length === 0) {
    console.log('🔴 [DEBUG-ENGINE] No parts to cut');
    return {
      success: false,
      message: "No parts to cut",
      stockUsage: [],
      totalUsedSheets: 0,
      totalWaste: 0,
      sortedParts: [],
      cutSequences: []
    };
  }

  console.log('🔵 [DEBUG-ENGINE] About to call OptimizedCuttingEngine.executeOptimization');
  
  // Use the new optimized 5-phase cutting engine
  const optimizedResult = OptimizedCuttingEngine.executeOptimization(
    availableStocks,
    requiredParts,
    kerfThickness
  );
  
  console.log('🔵 [DEBUG-ENGINE] OptimizedCuttingEngine.executeOptimization returned:', optimizedResult);

  // Generate cut sequences for the optimized result
  let cutSequences: OptimizedCutSequence[] = [];
  if (optimizedResult.success && optimizedResult.stockUsage.length > 0) {
    console.log('\n🔧 Generating optimized cut sequences...');
    cutSequences = generateOptimalCutSequence(
      optimizedResult.stockUsage,
      availableStocks,
      optimizedResult.sortedParts
    );
    console.log(`✅ Generated ${cutSequences.length} cutting sequences`);
  }

  console.timeEnd('Total Optimization Time');
  console.log('✅ === OPTIMIZED CUTTING ALGORITHM COMPLETE ===\n');

  return {
    ...optimizedResult,
    cutSequences
  };
}
