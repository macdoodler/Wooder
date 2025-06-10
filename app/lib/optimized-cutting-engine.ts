// Optimized Cutting Engine - Comprehensive 5-Phase Processing Pipeline
// Implements the fundamental algorithmic principles for professional cutting optimization

import { Stock, Part, Placement, FreeSpace, Results, StockUsage, MaterialType } from './types';

// ===== PHASE 1: INPUT PROCESSING AND VALIDATION =====

export interface OptimizedStock extends Stock {
  stockIndex: number;
  remainingQuantity: number;
  originalQuantity: number;
  utilizationPriority: number;
  compatibilityScore: number;
}

export interface ProcessedPart extends Part {
  partIndex: number;
  totalArea: number;
  priority: number;
  grainCompatible: boolean;
  instanceId?: string; // For tracking individual instances when expanded by quantity
}

export interface ValidationResult {
  isValid: boolean;
  totalPartsArea: number;
  totalAvailableArea: number;
  insufficientStockDetails?: {
    shortfall: number;
    additionalSheetsNeeded: number;
    recommendations: string[];
  };
}

export interface GrainCompatibilityResult {
  compatible: boolean;
  placement: 'direct' | 'rotated' | 'impossible';
  dimensions: { length: number; width: number; thickness: number };
  reason?: string;
}

export interface OptimalPlacement {
  placement: Placement;
  spaceIndex: number;
  wasteArea: number;
  efficiency: number;
  grainCompliant: boolean;
}

export interface SheetAnalysis {
  stockIndex: number;
  efficiency: number;
  usedArea: number;
  wasteArea: number;
  placementCount: number;
  grainCompatibleParts: number;
}

export interface MultiSheetResult {
  usedSheets: StockUsage[];
  remainingStock: OptimizedStock[];
  unplacedParts: ProcessedPart[];
  totalEfficiency: number;
  inventoryUtilization: number;
}

/**
 * PHASE 1: INPUT PROCESSING AND VALIDATION
 */
export class InputProcessor {
  
  /**
   * Process and validate stock inventory
   */
  static processStockInventory(availableStocks: Stock[]): OptimizedStock[] {
    return availableStocks.map((stock, index) => ({
      ...stock,
      stockIndex: index,
      remainingQuantity: stock.quantity,
      originalQuantity: stock.quantity,
      utilizationPriority: (stock.length * stock.width) / (stock.quantity || 1),
      compatibilityScore: 0 // Will be calculated per part requirement
    })).sort((a, b) => {
      // Group by material type, then by material, then by size (largest first)
      if (a.materialType !== b.materialType) {
        return a.materialType === MaterialType.Sheet ? -1 : 1;
      }
      if (a.material && b.material && a.material !== b.material) {
        return a.material.localeCompare(b.material);
      }
      return b.utilizationPriority - a.utilizationPriority;
    });
  }

  /**
   * Process required parts with priority calculation
   */
  static processRequiredParts(requiredParts: Part[]): ProcessedPart[] {
    return requiredParts.map((part, index) => ({
      ...part,
      partIndex: index,
      totalArea: part.length * part.width * part.quantity,
      priority: this.calculatePartPriority(part),
      grainCompatible: false // Will be determined during constraint checking
    })).sort((a, b) => {
      // Sort by area (largest first) for better packing efficiency
      return b.totalArea - a.totalArea;
    });
  }

  /**
   * Calculate part priority based on size, complexity, and constraints
   */
  private static calculatePartPriority(part: Part): number {
    let priority = 0;
    
    // Area-based priority
    const area = part.length * part.width;
    priority += area * 0.001;
    
    // Grain direction complexity
    if (part.grainDirection) priority += 100;
    
    // Quantity multiplier
    priority += part.quantity * 10;
    
    // Aspect ratio (harder to place parts get higher priority)
    const aspectRatio = Math.max(part.length, part.width) / Math.min(part.length, part.width);
    if (aspectRatio > 3) priority += 50;
    
    return priority;
  }

  /**
   * Validate compatibility between stock and parts
   */
  static validateCompatibility(stock: OptimizedStock[], parts: ProcessedPart[]): ValidationResult {
    const totalPartsArea = parts.reduce((sum, part) => sum + part.totalArea, 0);
    const totalAvailableArea = stock.reduce((sum, s) => sum + (s.length * s.width * s.quantity), 0);
    
    if (totalPartsArea > totalAvailableArea) {
      const shortfall = totalPartsArea - totalAvailableArea;
      const avgSheetArea = totalAvailableArea / stock.reduce((sum, s) => sum + s.quantity, 0);
      const additionalSheetsNeeded = Math.ceil(shortfall / avgSheetArea);
      
      return {
        isValid: false,
        totalPartsArea,
        totalAvailableArea,
        insufficientStockDetails: {
          shortfall,
          additionalSheetsNeeded,
          recommendations: [
            `Add ${additionalSheetsNeeded} more sheets to complete the project`,
            `Current shortfall: ${(shortfall / 1000000).toFixed(2)}m²`,
            `Consider using larger sheet sizes to reduce waste`
          ]
        }
      };
    }

    return {
      isValid: true,
      totalPartsArea,
      totalAvailableArea
    };
  }
}

/**
 * PHASE 2: CONSTRAINT HIERARCHY AND PLANNING
 */
export class ConstraintProcessor {

  /**
   * Check grain direction compatibility (PRIMARY CONSTRAINT)
   */
  static checkGrainCompatibility(part: ProcessedPart, stock: OptimizedStock): GrainCompatibilityResult {
    if (!part.grainDirection || !stock.grainDirection) {
      // No grain constraints - direct placement possible
      return {
        compatible: true,
        placement: 'direct',
        dimensions: { length: part.length, width: part.width, thickness: part.thickness }
      };
    }

    const stockGrain = stock.grainDirection.toLowerCase();
    const partGrain = part.grainDirection.toLowerCase();

    if (stockGrain === partGrain) {
      // Direct placement maintains grain alignment
      return {
        compatible: true,
        placement: 'direct',
        dimensions: { length: part.length, width: part.width, thickness: part.thickness }
      };
    } else {
      // Check if rotation allows grain alignment
      const rotatedDimensions = {
        length: part.width,
        width: part.length,
        thickness: part.thickness
      };

      // Verify rotated part still fits within stock boundaries
      if (rotatedDimensions.length <= stock.length && rotatedDimensions.width <= stock.width) {
        return {
          compatible: true,
          placement: 'rotated',
          dimensions: rotatedDimensions
        };
      } else {
        return {
          compatible: false,
          placement: 'impossible',
          dimensions: part,
          reason: 'Grain direction cannot be satisfied within stock dimensions'
        };
      }
    }
  }

  /**
   * Validate space constraints (SECONDARY CONSTRAINT)
   */
  static validateSpaceConstraints(
    part: ProcessedPart, 
    stock: OptimizedStock, 
    grainResult: GrainCompatibilityResult
  ): boolean {
    if (!grainResult.compatible) return false;

    const { length, width, thickness } = grainResult.dimensions;
    
    // Check thickness compatibility
    if (thickness > stock.thickness) return false;
    
    // Check dimensional compatibility
    return length <= stock.length && width <= stock.width;
  }

  /**
   * Calculate compatibility score for prioritization
   */
  static calculateCompatibilityScore(part: ProcessedPart, stock: OptimizedStock): number {
    let score = 0;

    // Material compatibility
    if (!part.material || !stock.material || part.material.toLowerCase() === stock.material.toLowerCase()) {
      score += 100;
    }

    // Thickness compatibility
    if (part.thickness <= stock.thickness) {
      score += 50;
    }

    // Size efficiency
    const partArea = part.length * part.width;
    const stockArea = stock.length * stock.width;
    const utilization = partArea / stockArea;
    score += utilization * 100;

    // Grain compatibility bonus
    const grainResult = this.checkGrainCompatibility(part, stock);
    if (grainResult.compatible) {
      score += grainResult.placement === 'direct' ? 25 : 15;
    }

    return score;
  }
}

/**
 * PHASE 3: SYSTEMATIC PLACEMENT ALGORITHM
 */
export class PlacementEngine {

  /**
   * Find optimal placement with collision detection
   */
  static findOptimalPlacement(
    part: ProcessedPart,
    stock: OptimizedStock,
    existingPlacements: Placement[],
    freeSpaces: FreeSpace[],
    kerfThickness: number,
    grainResult: GrainCompatibilityResult,
    allParts: ProcessedPart[] = []
  ): OptimalPlacement | null {
    
    if (!grainResult.compatible) return null;

    const partDimensions = grainResult.dimensions;
    const isRotated = grainResult.placement === 'rotated';
    
    const placementOptions: OptimalPlacement[] = [];

    // Test all free spaces
    for (let spaceIndex = 0; spaceIndex < freeSpaces.length; spaceIndex++) {
      const space = freeSpaces[spaceIndex];
      
      // Check if part fits in this space (including kerf)
      const requiredWidth = partDimensions.length + kerfThickness;
      const requiredHeight = partDimensions.width + kerfThickness;

      if (requiredWidth <= space.width && requiredHeight <= space.height) {
        // Position at space origin for optimal packing
        const testPosition = { x: space.x, y: space.y };

        // Check collision with existing parts
        if (!this.hasCollision(testPosition, partDimensions, existingPlacements, kerfThickness, allParts)) {
          // Calculate efficiency metrics
          const wasteArea = (space.width * space.height) - (partDimensions.length * partDimensions.width);
          const efficiency = (partDimensions.length * partDimensions.width) / (space.width * space.height);

          const placement: Placement = {
            partId: `Part-${part.partIndex}`,
            x: testPosition.x,
            y: testPosition.y,
            rotated: isRotated,
            name: part.name || `Part-${part.partIndex}`
          };

          placementOptions.push({
            placement,
            spaceIndex,
            wasteArea,
            efficiency,
            grainCompliant: true
          });
        }
      }
    }

    // Return best placement (minimize waste, maximize efficiency)
    if (placementOptions.length > 0) {
      return placementOptions.sort((a, b) => {
        // Prioritize higher efficiency
        if (Math.abs(a.efficiency - b.efficiency) > 0.1) {
          return b.efficiency - a.efficiency;
        }
        // Then minimize waste
        return a.wasteArea - b.wasteArea;
      })[0];
    }

    return null;
  }

  /**
   * Universal collision detection with proper part dimension lookup
   */
  static hasCollision(
    newPosition: { x: number; y: number },
    newDimensions: { length: number; width: number },
    existingPlacements: Placement[],
    kerfThickness: number,
    allParts: ProcessedPart[] = []
  ): boolean {
    const newLeft = newPosition.x;
    const newRight = newPosition.x + newDimensions.length + kerfThickness;
    const newTop = newPosition.y;
    const newBottom = newPosition.y + newDimensions.width + kerfThickness;

    return existingPlacements.some(existing => {
      // Extract part index from partId (format: "Part-X-Y")
      const partIdMatch = existing.partId.match(/Part-(\d+)/);
      const partIndex = partIdMatch ? parseInt(partIdMatch[1]) : -1;
      
      // Find the part to get actual dimensions
      const part = allParts.find(p => p.partIndex === partIndex);
      
      let existingWidth, existingHeight;
      if (part) {
        // Use actual part dimensions, accounting for rotation
        existingWidth = existing.rotated ? part.width : part.length;
        existingHeight = existing.rotated ? part.length : part.width;
      } else {
        // Fallback - conservative collision detection
        existingWidth = 200; // Conservative estimate
        existingHeight = 200;
      }

      const existingLeft = existing.x;
      const existingRight = existing.x + existingWidth + kerfThickness;
      const existingTop = existing.y;
      const existingBottom = existing.y + existingHeight + kerfThickness;

      // Check rectangle overlap
      const xOverlap = !(newRight <= existingLeft || newLeft >= existingRight);
      const yOverlap = !(newBottom <= existingTop || newTop >= existingBottom);

      return xOverlap && yOverlap;
    });
  }

  /**
   * Update free spaces after placement using guillotine method
   */
  static updateFreeSpaces(
    freeSpaces: FreeSpace[],
    usedSpaceIndex: number,
    partDimensions: { length: number; width: number },
    placement: { x: number; y: number },
    kerfThickness: number
  ): FreeSpace[] {
    const newSpaces = [...freeSpaces];
    const usedSpace = newSpaces[usedSpaceIndex];

    // Remove used space
    newSpaces.splice(usedSpaceIndex, 1);

    const partWidth = partDimensions.length + kerfThickness;
    const partHeight = partDimensions.width + kerfThickness;

    // Create new spaces using guillotine split
    const splitSpaces: FreeSpace[] = [];

    // Right space
    if (usedSpace.x + usedSpace.width > placement.x + partWidth) {
      splitSpaces.push({
        x: placement.x + partWidth,
        y: usedSpace.y,
        width: (usedSpace.x + usedSpace.width) - (placement.x + partWidth),
        height: usedSpace.height
      });
    }

    // Bottom space
    if (usedSpace.y + usedSpace.height > placement.y + partHeight) {
      splitSpaces.push({
        x: usedSpace.x,
        y: placement.y + partHeight,
        width: usedSpace.width,
        height: (usedSpace.y + usedSpace.height) - (placement.y + partHeight)
      });
    }

    // Filter out invalid spaces
    const validSpaces = splitSpaces.filter(space => space.width > 0 && space.height > 0);
    newSpaces.push(...validSpaces);

    return newSpaces;
  }
}

/**
 * PHASE 4: MULTI-SHEET OPTIMIZATION
 */
export class MultiSheetOptimizer {

  /**
   * Expand parts by their quantities for placement processing
   */
  static expandPartsByQuantity(parts: ProcessedPart[]): ProcessedPart[] {
    const expandedParts: ProcessedPart[] = [];
    
    parts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({
          ...part,
          quantity: 1, // Each instance has quantity 1
          instanceId: `${part.partIndex}-${i}` // Unique instance identifier
        });
      }
    });
    
    return expandedParts;
  }

  /**
   * Optimize across all available sheets
   */
  static optimizeAcrossSheets(
    parts: ProcessedPart[],
    stockInventory: OptimizedStock[],
    kerfThickness: number
  ): MultiSheetResult {
    const results: MultiSheetResult = {
      usedSheets: [],
      remainingStock: [...stockInventory],
      unplacedParts: [...parts],
      totalEfficiency: 0,
      inventoryUtilization: 0
    };

    // Process each available sheet
    for (const stock of stockInventory) {
      if (results.unplacedParts.length === 0) break;
      if (stock.remainingQuantity <= 0) continue;

      // Find compatible parts for this sheet
      const compatibleParts = results.unplacedParts.filter(part => {
        const grainResult = ConstraintProcessor.checkGrainCompatibility(part, stock);
        return grainResult.compatible && 
               ConstraintProcessor.validateSpaceConstraints(part, stock, grainResult);
      });

      if (compatibleParts.length > 0) {
        const sheetResult = this.optimizeSheetLayout(compatibleParts, stock, kerfThickness);
        
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

          // Update remaining stock
          stock.remainingQuantity--;

          // Remove placed parts from unplaced list (for expanded parts, remove individual instances)
          sheetResult.placedPartIndices.forEach(partIndex => {
            const placedPartIndex = results.unplacedParts.findIndex(p => p.partIndex === partIndex);
            if (placedPartIndex >= 0) {
              results.unplacedParts.splice(placedPartIndex, 1); // Remove the specific instance
            }
          });
        }
      }
    }

    // Calculate final metrics
    results.totalEfficiency = this.calculateOverallEfficiency(results.usedSheets, stockInventory);
    results.inventoryUtilization = this.calculateInventoryUtilization(results.usedSheets, stockInventory);

    return results;
  }

  /**
   * Optimize layout for a single sheet
   */
  private static optimizeSheetLayout(
    compatibleParts: ProcessedPart[],
    stock: OptimizedStock,
    kerfThickness: number
  ): {
    placements: Placement[];
    freeSpaces: FreeSpace[];
    usedArea: number;
    placedPartIndices: number[];
  } {
    const placements: Placement[] = [];
    let freeSpaces: FreeSpace[] = [{
      x: 0,
      y: 0,
      width: stock.length,
      height: stock.width
    }];
    let usedArea = 0;
    const placedPartIndices: number[] = [];

    // Sort parts by priority (largest area first, then by complexity)
    const sortedParts = [...compatibleParts].sort((a, b) => {
      if (Math.abs(a.totalArea - b.totalArea) > 1000) {
        return b.totalArea - a.totalArea;
      }
      return b.priority - a.priority;
    });

    // Place each part optimally
    for (const part of sortedParts) {
      if (part.quantity <= 0) continue;

      const grainResult = ConstraintProcessor.checkGrainCompatibility(part, stock);
      const optimalPlacement = PlacementEngine.findOptimalPlacement(
        part, stock, placements, freeSpaces, kerfThickness, grainResult, compatibleParts
      );

      if (optimalPlacement) {
        // Add placement with unique ID using instanceId if available
        const uniqueId = part.instanceId || `${part.partIndex}-${placements.filter(p => p.partId.startsWith(`Part-${part.partIndex}`)).length}`;
        const placementWithId = {
          ...optimalPlacement.placement,
          partId: `Part-${uniqueId}`
        };

        placements.push(placementWithId);
        placedPartIndices.push(part.partIndex);
        
        // Update free spaces
        freeSpaces = PlacementEngine.updateFreeSpaces(
          freeSpaces,
          optimalPlacement.spaceIndex,
          grainResult.dimensions,
          { x: optimalPlacement.placement.x, y: optimalPlacement.placement.y },
          kerfThickness
        );

        usedArea += grainResult.dimensions.length * grainResult.dimensions.width;
      }
    }

    return { placements, freeSpaces, usedArea, placedPartIndices };
  }

  /**
   * Calculate overall efficiency across all sheets
   */
  private static calculateOverallEfficiency(usedSheets: StockUsage[], stockInventory: OptimizedStock[]): number {
    if (usedSheets.length === 0) return 0;

    const totalArea = usedSheets.reduce((sum, sheet) => {
      const stock = stockInventory[sheet.stockIndex];
      return sum + (stock.length * stock.width);
    }, 0);

    const totalUsedArea = usedSheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);

    return (totalUsedArea / totalArea) * 100;
  }

  /**
   * Calculate inventory utilization percentage
   */
  private static calculateInventoryUtilization(usedSheets: StockUsage[], stockInventory: OptimizedStock[]): number {
    const totalAvailableSheets = stockInventory.reduce((sum, stock) => sum + stock.originalQuantity, 0);
    const sheetsUsed = usedSheets.length;

    return (sheetsUsed / totalAvailableSheets) * 100;
  }
}

/**
 * PHASE 5: EFFICIENCY OPTIMIZATION AND RESULTS
 */
export class EfficiencyOptimizer {

  /**
   * Calculate comprehensive efficiency metrics
   */
  static calculateEfficiency(usedSheets: StockUsage[], stockInventory: OptimizedStock[]): {
    materialEfficiency: number;
    inventoryUtilization: number;
    wasteMinimization: number;
    sheetMinimization: number;
    overallScore: number;
  } {
    const totalSheetArea = usedSheets.reduce((sum, sheet) => {
      const stock = stockInventory[sheet.stockIndex];
      return sum + (stock.length * stock.width);
    }, 0);

    const totalUsedArea = usedSheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
    const totalWasteArea = usedSheets.reduce((sum, sheet) => sum + sheet.wasteArea, 0);

    const materialEfficiency = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
    
    const totalAvailableSheets = stockInventory.reduce((sum, stock) => sum + stock.originalQuantity, 0);
    const inventoryUtilization = totalAvailableSheets > 0 ? (usedSheets.length / totalAvailableSheets) * 100 : 0;
    
    const wasteMinimization = totalSheetArea > 0 ? ((totalSheetArea - totalWasteArea) / totalSheetArea) * 100 : 0;
    
    // Sheet minimization score (fewer sheets used = higher score)
    const sheetMinimization = totalAvailableSheets > 0 ? (100 - inventoryUtilization) : 0;

    // Overall weighted score
    const overallScore = (
      materialEfficiency * 0.4 +
      wasteMinimization * 0.3 +
      sheetMinimization * 0.2 +
      (inventoryUtilization < 50 ? 100 : (100 - inventoryUtilization)) * 0.1
    );

    return {
      materialEfficiency,
      inventoryUtilization,
      wasteMinimization,
      sheetMinimization,
      overallScore
    };
  }

  /**
   * Generate optimization recommendations
   */
  static generateRecommendations(
    results: MultiSheetResult,
    efficiency: ReturnType<typeof EfficiencyOptimizer.calculateEfficiency>
  ): string[] {
    const recommendations: string[] = [];

    if (efficiency.materialEfficiency < 70) {
      recommendations.push("Consider reorganizing parts to improve material efficiency");
    }

    if (efficiency.inventoryUtilization < 30) {
      recommendations.push("Excellent inventory utilization - minimal sheets used");
    } else if (efficiency.inventoryUtilization > 80) {
      recommendations.push("High inventory utilization - consider ordering more stock");
    }

    if (results.unplacedParts.length > 0) {
      recommendations.push(`${results.unplacedParts.length} parts could not be placed - additional stock needed`);
    }

    if (efficiency.wasteMinimization < 60) {
      recommendations.push("High waste detected - consider alternative part arrangements");
    }

    return recommendations;
  }
}

/**
 * MAIN OPTIMIZED CUTTING ENGINE
 * Implements the complete 5-phase processing pipeline
 */
export class OptimizedCuttingEngine {

  /**
   * Execute the complete optimization pipeline
   */
  static executeOptimization(
    availableStocks: Stock[],
    requiredParts: Part[],
    kerfThickness: number = 3.2
  ): Results {
    console.log('🚀 OPTIMIZED CUTTING ENGINE: Starting 5-phase processing pipeline');

    try {
      // PHASE 1: Input Processing and Validation
      console.log('📥 PHASE 1: Input Processing and Validation');
      const optimizedStock = InputProcessor.processStockInventory(availableStocks);
      const processedParts = InputProcessor.processRequiredParts(requiredParts);
      const validation = InputProcessor.validateCompatibility(optimizedStock, processedParts);

      if (!validation.isValid) {
        return {
          success: false,
          message: `Insufficient stock: ${validation.insufficientStockDetails?.recommendations.join(', ')}`,
          stockUsage: [],
          totalUsedSheets: 0,
          totalWaste: 0,
          sortedParts: requiredParts,
          cutSequences: []
        };
      }

      // PHASE 2: Constraint Hierarchy and Planning
      console.log('🎯 PHASE 2: Constraint Hierarchy and Planning');
      // Grain direction compliance is enforced in placement phase

      // PHASE 3: Systematic Placement Algorithm
      console.log('📐 PHASE 3: Systematic Placement Algorithm');
      // Handled within multi-sheet optimization

      // PHASE 4: Multi-Sheet Optimization
      console.log('📊 PHASE 4: Multi-Sheet Optimization');
      // Expand parts by quantities for proper placement
      const expandedParts = MultiSheetOptimizer.expandPartsByQuantity(processedParts);
      console.log(`🔢 Expanded ${processedParts.length} part types into ${expandedParts.length} individual parts`);
      
      const multiSheetResult = MultiSheetOptimizer.optimizeAcrossSheets(
        expandedParts, optimizedStock, kerfThickness
      );

      // PHASE 5: Efficiency Optimization and Results
      console.log('⚡ PHASE 5: Efficiency Optimization and Results');
      const efficiency = EfficiencyOptimizer.calculateEfficiency(
        multiSheetResult.usedSheets, optimizedStock
      );
      const recommendations = EfficiencyOptimizer.generateRecommendations(
        multiSheetResult, efficiency
      );

      const totalWaste = multiSheetResult.usedSheets.reduce((sum, sheet) => sum + sheet.wasteArea, 0);

      console.log('✅ OPTIMIZATION COMPLETE');
      console.log(`📈 Material Efficiency: ${efficiency.materialEfficiency.toFixed(1)}%`);
      console.log(`📦 Inventory Utilization: ${efficiency.inventoryUtilization.toFixed(1)}%`);
      console.log(`♻️ Waste Minimization: ${efficiency.wasteMinimization.toFixed(1)}%`);

      return {
        success: multiSheetResult.unplacedParts.length === 0,
        message: multiSheetResult.unplacedParts.length === 0 
          ? `✓ Optimized placement: ${multiSheetResult.usedSheets.length} sheets used, ${efficiency.materialEfficiency.toFixed(1)}% efficiency`
          : `⚠ Partial placement: ${multiSheetResult.unplacedParts.length} parts remaining, additional stock needed`,
        stockUsage: multiSheetResult.usedSheets,
        totalUsedSheets: multiSheetResult.usedSheets.length,
        totalWaste,
        sortedParts: requiredParts,
        cutSequences: [] // Will be generated by existing cut sequence optimizer
      };

    } catch (error: any) {
      console.error('❌ OPTIMIZATION FAILED:', error);
      return {
        success: false,
        message: `Optimization error: ${error.message}`,
        stockUsage: [],
        totalUsedSheets: 0,
        totalWaste: 0,
        sortedParts: requiredParts,
        cutSequences: []
      };
    }
  }
}
