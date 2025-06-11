// Optimized Cutting Engine - Comprehensive 5-Phase Processing Pipeline
// Implements the fundamental algorithmic principles for professional cutting optimization

import { Stock, Part, Placement, FreeSpace, Results, StockUsage, MaterialType } from './types';
import { AdvancedGeometryOptimizer, NestingResult } from './advanced-geometry-optimizer';

// ===== PERFORMANCE OPTIMIZATION: DEBUG LOGGING SYSTEM =====

/**
 * Debug logging utility to prevent performance issues from verbose console output
 * Only logs when specific debug flags are enabled
 */
class DebugLogger {
  static logSharedCuts(message: string): void {
    if (typeof window !== 'undefined' && (window as any).DEBUG_SHARED_CUTS) {
      console.log(message);
    }
  }

  static logKerfAware(message: string): void {
    if (typeof window !== 'undefined' && (window as any).DEBUG_KERF_AWARE) {
      console.log(message);
    }
  }

  static logCollision(message: string): void {
    if (typeof window !== 'undefined' && (window as any).DEBUG_COLLISION) {
      console.log(message);
    }
  }

  static logPlacement(message: string): void {
    if (typeof window !== 'undefined' && (window as any).DEBUG_PLACEMENT) {
      console.log(message);
    }
  }

  static logMultiSheet(message: string): void {
    if (typeof window !== 'undefined' && (window as any).DEBUG_MULTI_SHEET) {
      console.log(message);
    }
  }

  // Enable all debug flags for comprehensive debugging
  static enableVerboseDebugging(): void {
    if (typeof window !== 'undefined') {
      (window as any).DEBUG_SHARED_CUTS = true;
      (window as any).DEBUG_KERF_AWARE = true;
      (window as any).DEBUG_COLLISION = true;
      (window as any).DEBUG_PLACEMENT = true;
      (window as any).DEBUG_MULTI_SHEET = true;
    }
  }

  // Disable all debug flags for production performance
  static disableVerboseDebugging(): void {
    if (typeof window !== 'undefined') {
      (window as any).DEBUG_SHARED_CUTS = false;
      (window as any).DEBUG_KERF_AWARE = false;
      (window as any).DEBUG_COLLISION = false;
      (window as any).DEBUG_PLACEMENT = false;
      (window as any).DEBUG_MULTI_SHEET = false;
    }
  }
}

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
      // SPACE UTILIZATION FIX: Use mixed sorting strategy for better global optimization
      // First sort by individual part area (not total area) to avoid bias towards high quantities
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      
      // If areas are significantly different, larger parts first (but consider individual part size)
      if (Math.abs(areaA - areaB) > 50000) { // 50,000mm² threshold
        return areaB - areaA;
      }
      
      // For similar-sized parts, prioritize by aspect ratio (harder to place shapes first)
      const aspectRatioA = Math.max(a.length, a.width) / Math.min(a.length, a.width);
      const aspectRatioB = Math.max(b.length, b.width) / Math.min(b.length, b.width);
      
      if (Math.abs(aspectRatioA - aspectRatioB) > 0.5) {
        return aspectRatioB - aspectRatioA;
      }
      
      // Finally, consider total area for parts with similar characteristics
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
    // Handle 'any' grain direction as no constraints
    const hasPartGrainConstraint = part.grainDirection && part.grainDirection.toLowerCase() !== 'any';
    const hasStockGrainConstraint = stock.grainDirection && stock.grainDirection.toLowerCase() !== 'any';
    
    if (!hasPartGrainConstraint || !hasStockGrainConstraint) {
      // No grain constraints - direct placement possible
      return {
        compatible: true,
        placement: 'direct',
        dimensions: { length: part.length, width: part.width, thickness: part.thickness }
      };
    }

    const stockGrain = stock.grainDirection!.toLowerCase();
    const partGrain = part.grainDirection!.toLowerCase();

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

  // PERFORMANCE OPTIMIZATION: Spatial grid for fast collision detection
  private static spatialGrid: SpatialGrid | null = null;
  private static readonly CELL_SIZE = 200; // 200mm cells for spatial indexing

  /**
   * Initialize spatial grid for fast collision detection
   */
  private static initializeSpatialGrid(existingPlacements: Placement[], allParts: ProcessedPart[], stock: OptimizedStock): void {
    this.spatialGrid = {
      cellSize: this.CELL_SIZE,
      grid: new Map(),
      bounds: { minX: 0, minY: 0, maxX: stock.length, maxY: stock.width }
    };

    // Add existing placements to spatial grid
    existingPlacements.forEach(placement => {
      this.addToSpatialGrid(placement, allParts);
    });
  }

  /**
   * Add placement to spatial grid
   */
  private static addToSpatialGrid(placement: Placement, allParts: ProcessedPart[]): void {
    if (!this.spatialGrid) return;

    // Get part dimensions
    const partIdMatch = placement.partId.match(/Part-(\d+)/);
    const partIndex = partIdMatch ? parseInt(partIdMatch[1]) : -1;
    const part = allParts.find(p => p.partIndex === partIndex);
    
    if (!part) return;

    const width = placement.rotated ? part.width : part.length;
    const height = placement.rotated ? part.length : part.width;

    // Calculate grid cells this placement occupies
    const minCellX = Math.floor(placement.x / this.CELL_SIZE);
    const maxCellX = Math.floor((placement.x + width) / this.CELL_SIZE);
    const minCellY = Math.floor(placement.y / this.CELL_SIZE);
    const maxCellY = Math.floor((placement.y + height) / this.CELL_SIZE);

    // Add to all relevant cells
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`;
        if (!this.spatialGrid.grid.has(cellKey)) {
          this.spatialGrid.grid.set(cellKey, []);
        }
        this.spatialGrid.grid.get(cellKey)!.push(placement);
      }
    }
  }

  /**
   * Public method to update spatial grid with new placement (used in MultiSheetOptimizer)
   */
  static updateSpatialGridWithPlacement(placement: Placement, allParts: ProcessedPart[]): void {
    if (this.spatialGrid && allParts.length > 0) {
      this.addToSpatialGrid(placement, allParts);
    }
  }

  /**
   * Fast collision detection using spatial indexing
   */
  private static fastCollisionCheck(
    newPosition: { x: number; y: number },
    newDimensions: { length: number; width: number },
    kerfThickness: number,
    allParts: ProcessedPart[]
  ): boolean {
    if (!this.spatialGrid) return false;

    const newLeft = newPosition.x;
    const newRight = newPosition.x + newDimensions.length + kerfThickness;
    const newTop = newPosition.y;
    const newBottom = newPosition.y + newDimensions.width + kerfThickness;

    // Calculate which grid cells to check
    const minCellX = Math.floor(newLeft / this.CELL_SIZE);
    const maxCellX = Math.floor(newRight / this.CELL_SIZE);
    const minCellY = Math.floor(newTop / this.CELL_SIZE);
    const maxCellY = Math.floor(newBottom / this.CELL_SIZE);

    const TOLERANCE = 0.01;
    const checkedPlacements = new Set<string>();

    // Check only relevant cells
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`;
        const cellPlacements = this.spatialGrid.grid.get(cellKey);
        
        if (!cellPlacements) continue;

        for (const existing of cellPlacements) {
          // Avoid checking same placement multiple times
          if (checkedPlacements.has(existing.partId)) continue;
          checkedPlacements.add(existing.partId);

          // Get existing part dimensions
          const partIdMatch = existing.partId.match(/Part-(\d+)/);
          const partIndex = partIdMatch ? parseInt(partIdMatch[1]) : -1;
          const part = allParts.find(p => p.partIndex === partIndex);
          
          if (!part) continue;

          const existingWidth = existing.rotated ? part.width : part.length;
          const existingHeight = existing.rotated ? part.length : part.width;

          const existingLeft = existing.x;
          const existingRight = existing.x + existingWidth + kerfThickness;
          const existingTop = existing.y;
          const existingBottom = existing.y + existingHeight + kerfThickness;

          // Check rectangle overlap with tolerance
          const xOverlap = !(newRight <= existingLeft + TOLERANCE || newLeft >= existingRight - TOLERANCE);
          const yOverlap = !(newBottom <= existingTop + TOLERANCE || newTop >= existingBottom - TOLERANCE);

          if (xOverlap && yOverlap) {
            return true; // Collision detected
          }
        }
      }
    }

    return false; // No collision
  }

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

    // OPTIMIZATION: Initialize spatial grid for large placement counts
    // Increase threshold to prevent interference with normal placement logic
    if (existingPlacements.length > 50 && allParts.length > 0) {
      this.initializeSpatialGrid(existingPlacements, allParts, stock);
    }

    // Check if this part should use strip-cutting optimization
    if (this.shouldUseStripCutting(part, stock, existingPlacements, allParts)) {
      DebugLogger.logPlacement(`[STRIP-CUTTING] Using strip-cutting for small part ${part.length}x${part.width}mm`);
      const stripPlacement = this.findStripPlacement(part, stock, existingPlacements, freeSpaces, kerfThickness, grainResult, allParts);
      if (stripPlacement) {
        DebugLogger.logPlacement(`[STRIP-CUTTING] ✅ Found strip placement at (${stripPlacement.placement.x}, ${stripPlacement.placement.y})`);
        return stripPlacement;
      }
      DebugLogger.logPlacement(`[STRIP-CUTTING] ⚠️ Strip placement failed, falling back to enhanced placement`);
    }

    // Use enhanced efficiency placement for maximum material utilization
    DebugLogger.logPlacement(`[ENHANCED-PLACEMENT] Using advanced efficiency algorithms for part ${part.length}x${part.width}mm`);
    const enhancedPlacement = this.findMaxEfficiencyPlacement(part, stock, existingPlacements, freeSpaces, kerfThickness, grainResult, allParts);
    if (enhancedPlacement) {
      DebugLogger.logPlacement(`[ENHANCED-PLACEMENT] ✅ Found optimized placement at (${enhancedPlacement.placement.x}, ${enhancedPlacement.placement.y}) with ${(enhancedPlacement.efficiency * 100).toFixed(1)}% efficiency`);
      return enhancedPlacement;
    }
    
    DebugLogger.logPlacement(`[ENHANCED-PLACEMENT] ⚠️ Advanced placement failed, falling back to standard grid placement`);

    const placementOptions: OptimalPlacement[] = [];

    // Determine orientations to test
    const orientationsToTest: Array<{dimensions: {length: number, width: number, thickness: number}, rotated: boolean}> = [];
    
    // Check if we have actual grain constraints (not 'any')
    const hasPartGrainConstraint = part.grainDirection && part.grainDirection.toLowerCase() !== 'any';
    const hasStockGrainConstraint = stock.grainDirection && stock.grainDirection.toLowerCase() !== 'any';
    
    if (!hasPartGrainConstraint || !hasStockGrainConstraint) {
      // No grain constraints - test both orientations but strongly prefer non-rotated
      orientationsToTest.push(
        { dimensions: { length: part.length, width: part.width, thickness: part.thickness }, rotated: false },
        { dimensions: { length: part.width, width: part.length, thickness: part.thickness }, rotated: true }
      );
    } else {
      // Grain constraints - use only the compatible orientation
      orientationsToTest.push({
        dimensions: grainResult.dimensions,
        rotated: grainResult.placement === 'rotated'
      });
    }

    // Sort spaces to prioritize better packing: bottom-left preference and larger usable areas
    const sortedSpaces = freeSpaces
      .map((space, index) => ({ space, index }))
      .sort((a, b) => {
        // First priority: bottom-left positioning (lower Y, then lower X)
        if (Math.abs(a.space.y - b.space.y) > 1) {
          return a.space.y - b.space.y;
        }
        if (Math.abs(a.space.x - b.space.x) > 1) {
          return a.space.x - b.space.x;
        }
        
        // Second priority: prefer spaces that can fit multiple parts (better for grid packing)
        // Use part dimensions to determine if space can fit multiple parts
        const partWidth = part.length + kerfThickness;
        const partHeight = part.width + kerfThickness;
        const aCanFitMultiple = (a.space.width >= partWidth * 2) || (a.space.height >= partHeight * 2);
        const bCanFitMultiple = (b.space.width >= partWidth * 2) || (b.space.height >= partHeight * 2);
        
        if (aCanFitMultiple && !bCanFitMultiple) return -1;
        if (!aCanFitMultiple && bCanFitMultiple) return 1;
        
        // Third priority: minimize waste (smaller space is better for tight fit)
        return (a.space.width * a.space.height) - (b.space.width * b.space.height);
      });

    // Test all orientation and space combinations
    for (const orientation of orientationsToTest) {
      for (const { space, index: spaceIndex } of sortedSpaces) {
        // Check if part fits in this space (including kerf)
        const requiredWidth = orientation.dimensions.length + kerfThickness;
        const requiredHeight = orientation.dimensions.width + kerfThickness;

        if (requiredWidth <= space.width && requiredHeight <= space.height) {
          // Position at space origin for optimal packing
          const testPosition = { x: space.x, y: space.y };

      // Check collision with existing parts
          if (!this.hasCollision(testPosition, orientation.dimensions, existingPlacements, kerfThickness, allParts)) {
            // COLLISION DEBUG: Log successful placement
            DebugLogger.logCollision(`[COLLISION-CHECK] ✅ No collision for part ${part.partIndex} at (${testPosition.x}, ${testPosition.y}) - ${existingPlacements.length} existing parts checked`);
            
            // Calculate efficiency metrics with improved scoring
            const spaceArea = space.width * space.height;
            const partArea = orientation.dimensions.length * orientation.dimensions.width;
            const wasteArea = spaceArea - partArea;
            const efficiency = partArea / spaceArea;
            
            // ROTATION PENALTY: Strongly discourage unnecessary rotations
            let rotationPenalty = 0;
            if (orientation.rotated && (!hasPartGrainConstraint || !hasStockGrainConstraint)) {
              // Apply heavy penalty for rotation when no grain constraints exist
              rotationPenalty = 50; // Large penalty to discourage unnecessary rotation
            }
            
            // Bonus for grid-friendly positioning (positions that align with common part dimensions)
            let positionScore = 0;
            const gridX = Math.round(testPosition.x / (orientation.dimensions.length + kerfThickness));
            const gridY = Math.round(testPosition.y / (orientation.dimensions.width + kerfThickness));
            if (Math.abs(testPosition.x - gridX * (orientation.dimensions.length + kerfThickness)) < 1) positionScore += 10;
            if (Math.abs(testPosition.y - gridY * (orientation.dimensions.width + kerfThickness)) < 1) positionScore += 10;

            // Bonus for rectangular grid packing (prefer orientations that fit nicely in available space)
            const widthUtilization = requiredWidth / space.width;
            const heightUtilization = requiredHeight / space.height;
            const utilization = Math.min(widthUtilization, heightUtilization);
            positionScore += utilization * 50; // Up to 50 point bonus for good space utilization

            const placement: Placement = {
              partId: `Part-${part.partIndex}`,
              x: testPosition.x,
              y: testPosition.y,
              rotated: orientation.rotated,
              name: part.name || `Part-${part.partIndex}`
            };

            placementOptions.push({
              placement,
              spaceIndex,
              wasteArea,
              efficiency: efficiency + (positionScore / 1000) - (rotationPenalty / 1000), // Apply rotation penalty
              grainCompliant: true
            });
          }
        }
      }
    }

    // Return best placement (maximize efficiency, minimize waste)
    if (placementOptions.length > 0) {
      return placementOptions.sort((a, b) => {
        // Prioritize higher efficiency
        if (Math.abs(a.efficiency - b.efficiency) > 0.01) {
          return b.efficiency - a.efficiency;
        }
        // Then minimize waste
        return a.wasteArea - b.wasteArea;
      })[0];
    }

    return null;
  }

  /**
   * OPTIMIZED: Universal collision detection with spatial indexing and early termination
   */
  static hasCollision(
    newPosition: { x: number; y: number },
    newDimensions: { length: number; width: number },
    existingPlacements: Placement[],
    kerfThickness: number,
    allParts: ProcessedPart[] = []
  ): boolean {
    // CRITICAL FIX: Always use the standard collision detection to ensure consistency
    // The spatial grid can get out of sync, so we'll use the reliable method
    const kerfAware = this.calculateKerfAwareSpacing(
      newPosition, 
      newDimensions, 
      existingPlacements, 
      kerfThickness, 
      allParts
    );

    const newLeft = newPosition.x;
    const newRight = newPosition.x + kerfAware.effectiveWidth;
    const newTop = newPosition.y;
    const newBottom = newPosition.y + kerfAware.effectiveHeight;

    const TOLERANCE = 0.01;

    // OPTIMIZATION: Early termination on first collision
    for (const existing of existingPlacements) {
      const partIdMatch = existing.partId.match(/Part-(\d+)/);
      const partIndex = partIdMatch ? parseInt(partIdMatch[1]) : -1;
      const part = allParts.find(p => p.partIndex === partIndex);
      
      let existingWidth, existingHeight;
      if (part) {
        existingWidth = existing.rotated ? part.width : part.length;
        existingHeight = existing.rotated ? part.length : part.width;
      } else {
        existingWidth = 200;
        existingHeight = 200;
      }

      const existingKerfAware = this.calculateKerfAwareSpacing(
        { x: existing.x, y: existing.y },
        { length: existingWidth, width: existingHeight },
        existingPlacements.filter(p => p !== existing),
        kerfThickness,
        allParts
      );

      const existingLeft = existing.x;
      const existingRight = existing.x + existingKerfAware.effectiveWidth;
      const existingTop = existing.y;
      const existingBottom = existing.y + existingKerfAware.effectiveHeight;

      const xOverlap = !(newRight <= existingLeft + TOLERANCE || newLeft >= existingRight - TOLERANCE);
      const yOverlap = !(newBottom <= existingTop + TOLERANCE || newTop >= existingBottom - TOLERANCE);

      if (xOverlap && yOverlap) {
        // COLLISION DEBUG: Log collision detection
        DebugLogger.logCollision(`[COLLISION-DETECTED] Part collision at (${newPosition.x}, ${newPosition.y}) vs existing part at (${existing.x}, ${existing.y})`);
        return true; // EARLY TERMINATION: Return immediately on first collision
      }
    }

    return false;
  }

  /**
   * Update free spaces after placement using improved guillotine method for rectangular packing
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

    // Create new spaces using improved guillotine split for better rectangular packing
    const splitSpaces: FreeSpace[] = [];

    // Right space (only if significant width remains)
    if (usedSpace.x + usedSpace.width > placement.x + partWidth) {
      const rightWidth = (usedSpace.x + usedSpace.width) - (placement.x + partWidth);
      // SPACE UTILIZATION FIX: Much more aggressive thresholds for better space usage
      if (rightWidth > Math.max(10, partWidth * 0.05)) { // At least 10mm or 5% of part width
        splitSpaces.push({
          x: placement.x + partWidth,
          y: usedSpace.y,
          width: rightWidth,
          height: usedSpace.height
        });
      }
    }

    // Bottom space (prioritize this for better grid packing)
    if (usedSpace.y + usedSpace.height > placement.y + partHeight) {
      const bottomHeight = (usedSpace.y + usedSpace.height) - (placement.y + partHeight);
      // SPACE UTILIZATION FIX: Much more aggressive thresholds for better space usage
      if (bottomHeight > Math.max(10, partHeight * 0.05)) { // At least 10mm or 5% of part height
        splitSpaces.push({
          x: usedSpace.x,
          y: placement.y + partHeight,
          width: usedSpace.width,
          height: bottomHeight
        });
      }
    }

    // Left space (only if placement isn't at left edge)
    if (placement.x > usedSpace.x) {
      const leftWidth = placement.x - usedSpace.x;
      // SPACE UTILIZATION FIX: Much more aggressive thresholds for better space usage
      if (leftWidth > Math.max(10, partWidth * 0.05)) { // At least 10mm or 5% of part width
        splitSpaces.push({
          x: usedSpace.x,
          y: usedSpace.y,
          width: leftWidth,
          height: usedSpace.height
        });
      }
    }

    // Top space (only if placement isn't at top edge)
    if (placement.y > usedSpace.y) {
      const topHeight = placement.y - usedSpace.y;
      // SPACE UTILIZATION FIX: Much more aggressive thresholds for better space usage
      if (topHeight > Math.max(10, partHeight * 0.05)) { // At least 10mm or 5% of part height
        splitSpaces.push({
          x: usedSpace.x,
          y: usedSpace.y,
          width: usedSpace.width,
          height: topHeight
        });
      }
    }

    // Filter out invalid spaces and merge small adjacent spaces
    const validSpaces = splitSpaces.filter(space => space.width > 0.1 && space.height > 0.1);
    newSpaces.push(...validSpaces);

    // Sort spaces to prioritize bottom-left positioning for next placement
    newSpaces.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 1) return a.y - b.y;
      if (Math.abs(a.x - b.x) > 1) return a.x - b.x;
      return (b.width * b.height) - (a.width * a.height); // Larger spaces first if same position
    });

    return newSpaces;
  }

  /**
   * Detect if a part should use strip-cutting optimization
   * Small parts benefit from continuous strip placement rather than grid alignment
   */
  static shouldUseStripCutting(
    part: ProcessedPart,
    stock: OptimizedStock,
    existingPlacements: Placement[],
    allParts: ProcessedPart[] = []
  ): boolean {
    const partArea = part.length * part.width;
    const stockArea = stock.length * stock.width;
    
    // Consider strip-cutting for parts that are less than 15% of stock area (more aggressive threshold)
    if (partArea > stockArea * 0.15) return false;
    
    // Check if there are significantly larger parts in the mix
    const allPartAreas = allParts.map(p => p.length * p.width);
    const maxPartArea = Math.max(...allPartAreas);
    
    // Use strip-cutting if this part is less than 60% of the largest part area (more aggressive)
    return partArea < maxPartArea * 0.6;
  }

  /**
   * Find optimal strip placement for small parts
   * This method tries to place parts continuously in strips for better cutting efficiency
   */
  static findStripPlacement(
    part: ProcessedPart,
    stock: OptimizedStock,
    existingPlacements: Placement[],
    freeSpaces: FreeSpace[],
    kerfThickness: number,
    grainResult: GrainCompatibilityResult,
    allParts: ProcessedPart[] = []
  ): OptimalPlacement | null {
    
    const orientationsToTest: Array<{dimensions: {length: number, width: number, thickness: number}, rotated: boolean}> = [];
    
    // Check if we have actual grain constraints (not 'any')
    const hasPartGrainConstraint = part.grainDirection && part.grainDirection.toLowerCase() !== 'any';
    const hasStockGrainConstraint = stock.grainDirection && stock.grainDirection.toLowerCase() !== 'any';
    
    if (!hasPartGrainConstraint || !hasStockGrainConstraint) {
      orientationsToTest.push(
        { dimensions: { length: part.length, width: part.width, thickness: part.thickness }, rotated: false },
        { dimensions: { length: part.width, width: part.length, thickness: part.thickness }, rotated: true }
      );
    } else {
      orientationsToTest.push({
        dimensions: grainResult.dimensions,
        rotated: grainResult.placement === 'rotated'
      });
    }

    let bestPlacement: OptimalPlacement | null = null;
    let bestScore = -1;

    // Prioritize spaces by bottom-most first (higher Y values) for small parts
    const prioritizedSpaces = [...freeSpaces].sort((a, b) => {
      // For small parts, prioritize larger areas and bottom-most positions
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      
      // First, prioritize larger spaces
      if (Math.abs(areaA - areaB) > 10000) {
        return areaB - areaA;
      }
      
      // Then prioritize bottom areas for strip cutting
      return b.y - a.y;
    });

    for (const orientation of orientationsToTest) {
      const requiredWidth = orientation.dimensions.length + kerfThickness;
      const requiredHeight = orientation.dimensions.width + kerfThickness;

      for (let spaceIndex = 0; spaceIndex < prioritizedSpaces.length; spaceIndex++) {
        const space = prioritizedSpaces[spaceIndex];
        const originalSpaceIndex = freeSpaces.indexOf(space);
        
        if (requiredWidth <= space.width && requiredHeight <= space.height) {
          // Try strip placement: test multiple positions within the space
          const positionsToTest = this.generateStripPositions(space, requiredWidth, requiredHeight, kerfThickness, 4); // PERFORMANCE: Limit to 4 strip positions
          
          for (const position of positionsToTest) {
            if (!this.hasCollision(position, orientation.dimensions, existingPlacements, kerfThickness, allParts)) {
              const score = this.calculateStripScore(position, space, orientation.dimensions, existingPlacements, kerfThickness);
              
              if (score > bestScore) {
                bestScore = score;
                bestPlacement = {
                  placement: {
                    partId: `Part-${part.partIndex}`,
                    x: position.x,
                    y: position.y,
                    rotated: orientation.rotated,
                    name: part.name || `Part-${part.partIndex}`
                  },
                  spaceIndex: originalSpaceIndex,
                  wasteArea: (space.width * space.height) - (orientation.dimensions.length * orientation.dimensions.width),
                  efficiency: score / 100,
                  grainCompliant: true
                };
              }
            }
          }
        }
      }
    }

    return bestPlacement;
  }

  /**
   * OPTIMIZED: Generate smart strip positions with reduced iteration
   */
  static generateStripPositions(
    space: FreeSpace,
    requiredWidth: number,
    requiredHeight: number,
    kerfThickness: number,
    maxPositions: number = 6 // PERFORMANCE: Limit strip positions
  ): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    
    // PRIORITY 1: Space origin (most common placement)
    positions.push({ x: space.x, y: space.y });
    
    // PRIORITY 2: Strategic strip positions for small parts
    const spaceArea = space.width * space.height;
    const partArea = requiredWidth * requiredHeight;
    
    // Only generate additional positions for larger spaces relative to part size
    if (spaceArea > partArea * 4 && positions.length < maxPositions) {
      // Bottom edge for strip cutting
      const bottomY = space.y + space.height - requiredHeight;
      if (bottomY > space.y) {
        positions.push({ x: space.x, y: bottomY });
      }
      
      // Right edge alignment
      const rightX = space.x + space.width - requiredWidth;
      if (rightX > space.x) {
        positions.push({ x: rightX, y: space.y });
      }
      
      // Center position for larger spaces
      if (spaceArea > partArea * 8 && positions.length < maxPositions) {
        const centerX = space.x + (space.width - requiredWidth) / 2;
        const centerY = space.y + (space.height - requiredHeight) / 2;
        
        if (centerX >= space.x && centerY >= space.y &&
            centerX + requiredWidth <= space.x + space.width &&
            centerY + requiredHeight <= space.y + space.height) {
          positions.push({ x: centerX, y: centerY });
        }
      }
    }
    
    return positions.slice(0, maxPositions);
  }

  /**
   * Calculate strip-cutting efficiency score
   * Prioritizes continuous placement and efficient material usage
   */
  static calculateStripScore(
    position: {x: number, y: number},
    space: FreeSpace,
    partDimensions: {length: number, width: number},
    existingPlacements: Placement[],
    kerfThickness: number
  ): number {
    let score = 0;
    
    // Base score for space utilization - heavily weighted
    const spaceArea = space.width * space.height;
    const partArea = partDimensions.length * partDimensions.width;
    const utilization = partArea / spaceArea;
    score += utilization * 40; // Base utilization score
    
    // MAJOR BONUS for utilizing bottom areas (high Y positions)
    // This encourages using the bottom strip areas that are typically underutilized
    const bottomBonus = this.calculateBottomAreaBonus(position, space);
    score += bottomBonus;
    
    // Bonus for bottom-left positioning (better for cutting order)
    const bottomLeftBonus = this.calculateBottomLeftBonus(position, space);
    score += bottomLeftBonus;
    
    // Bonus for continuous placement (adjacent to existing parts)
    const adjacencyBonus = this.calculateAdjacencyBonus(position, partDimensions, existingPlacements, kerfThickness);
    score += adjacencyBonus;
    
    // Bonus for efficient strip cutting (aligned edges for easier cutting)
    const alignmentBonus = this.calculateAlignmentBonus(position, partDimensions, existingPlacements);
    score += alignmentBonus;
    
    // Reduced penalty for waste to allow more flexible placement
    const wastePenalty = this.calculateWastePenalty(position, partDimensions, space) * 0.3;
    score -= wastePenalty;
    
    return score;
  }

  /**
   * Calculate major bonus for using bottom strip areas
   */
  static calculateBottomAreaBonus(
    position: {x: number, y: number},
    space: FreeSpace
  ): number {
    // Give massive bonus for Y positions greater than 600 (bottom areas)
    if (position.y > 600) {
      return 50; // Huge bonus for bottom area utilization
    }
    
    // For top areas, give bonus based on space size to encourage utilization
    const spaceArea = space.width * space.height;
    if (spaceArea > 500000) { // Large spaces (like the unused top-right area)
      return 30; // Significant bonus for utilizing large unused spaces
    }
    
    // Moderate bonus for mid-level positions
    if (position.y > 300) {
      return 25;
    }
    
    // Small bonus for any non-top positions
    if (position.y > 150) {
      return 10;
    }
    
    return 5; // Small bonus even for top strip placement to encourage utilization
  }

  /**
   * Calculate bonus for bottom-left positioning
   */
  static calculateBottomLeftBonus(
    position: {x: number, y: number},
    space: FreeSpace
  ): number {
    const xRatio = (space.x + space.width - position.x) / space.width; // Closer to left edge = higher
    const yRatio = (space.y + space.height - position.y) / space.height; // Closer to bottom = higher
    
    return (xRatio + yRatio) * 10; // Up to 20 points for optimal positioning
  }

  /**
   * Calculate bonus for parts placed adjacent to existing parts (for strip cutting)
   */
  static calculateAdjacencyBonus(
    position: {x: number, y: number},
    partDimensions: {length: number, width: number},
    existingPlacements: Placement[],
    kerfThickness: number
  ): number {
    let bonus = 0;
    const tolerance = kerfThickness + 1; // Small tolerance for alignment
    
    const partRight = position.x + partDimensions.length;
    const partBottom = position.y + partDimensions.width;
    
    for (const existing of existingPlacements) {
      // Use actual part dimensions (assuming square-ish small parts for strip cutting)
      const assumedPartSize = Math.max(partDimensions.length, partDimensions.width);
      
      // Check for horizontal adjacency (part placed to the right)
      if (Math.abs(existing.x + assumedPartSize - position.x) <= tolerance && 
          Math.abs(existing.y - position.y) <= tolerance) {
        bonus += 25; // Good horizontal strip continuity
      }
      
      // Check for vertical adjacency (part placed below)
      if (Math.abs(existing.y + assumedPartSize - position.y) <= tolerance && 
          Math.abs(existing.x - position.x) <= tolerance) {
        bonus += 25; // Good vertical strip continuity
      }
      
      // Additional bonus for forming perfect strips (multiple adjacent parts)
      if (Math.abs(existing.x - position.x) <= tolerance || 
          Math.abs(existing.y - position.y) <= tolerance) {
        bonus += 8; // Bonus for alignment potential
      }
      
      // Special bonus for tight packing (parts very close together)
      const distance = Math.sqrt(
        Math.pow(existing.x - position.x, 2) + 
        Math.pow(existing.y - position.y, 2)
      );
      if (distance < assumedPartSize * 1.5) {
        bonus += 5; // Small bonus for dense packing
      }
    }
    
    return Math.min(bonus, 40); // Increased cap for adjacency bonus
  }

  /**
   * Calculate bonus for edge alignment (easier cutting)
   */
  static calculateAlignmentBonus(
    position: {x: number, y: number},
    partDimensions: {length: number, width: number},
    existingPlacements: Placement[]
  ): number {
    let bonus = 0;
    
    // Bonus for aligning with existing cut lines
    for (const existing of existingPlacements) {
      // Vertical alignment (same X coordinate)
      if (Math.abs(existing.x - position.x) < 1) {
        bonus += 10;
      }
      
      // Horizontal alignment (same Y coordinate)  
      if (Math.abs(existing.y - position.y) < 1) {
        bonus += 10;
      }
    }
    
    return Math.min(bonus, 20); // Cap alignment bonus
  }

  /**
   * Calculate penalty for creating small unusable waste spaces
   */
  static calculateWastePenalty(
    position: {x: number, y: number},
    partDimensions: {length: number, width: number},
    space: FreeSpace
  ): number {
    let penalty = 0;
    
    // Calculate remaining space dimensions
    const rightSpace = (space.x + space.width) - (position.x + partDimensions.length);
    const bottomSpace = (space.y + space.height) - (position.y + partDimensions.width);
    
    // Penalty for creating very small unusable spaces
    if (rightSpace > 0 && rightSpace < 100) { // Less than 100mm width
      penalty += (100 - rightSpace) * 0.1; // Increasing penalty as space gets smaller
    }
    
    if (bottomSpace > 0 && bottomSpace < 100) { // Less than 100mm height
      penalty += (100 - bottomSpace) * 0.1;
    }
    
    return penalty;
  }

  /**
   * Enhanced space utilization: Find the most efficient placement considering all available spaces
   */
  static findMaxEfficiencyPlacement(
    part: ProcessedPart,
    stock: OptimizedStock,
    existingPlacements: Placement[],
    freeSpaces: FreeSpace[],
    kerfThickness: number,
    grainResult: GrainCompatibilityResult,
    allParts: ProcessedPart[] = []
  ): OptimalPlacement | null {
    
    if (!grainResult.compatible) return null;

    const placementCandidates: OptimalPlacement[] = [];

    // Determine orientations to test (same as before)
    const orientationsToTest: Array<{dimensions: {length: number, width: number, thickness: number}, rotated: boolean}> = [];
    
    const hasPartGrainConstraint = part.grainDirection && part.grainDirection.toLowerCase() !== 'any';
    const hasStockGrainConstraint = stock.grainDirection && stock.grainDirection.toLowerCase() !== 'any';
    
    if (!hasPartGrainConstraint || !hasStockGrainConstraint) {
      // Test both orientations for maximum efficiency
      orientationsToTest.push(
        { dimensions: { length: part.length, width: part.width, thickness: part.thickness }, rotated: false },
        { dimensions: { length: part.width, width: part.length, thickness: part.thickness }, rotated: true }
      );
    } else {
      orientationsToTest.push({
        dimensions: grainResult.dimensions,
        rotated: grainResult.placement === 'rotated'
      });
    }

    // ENHANCED SPACE EVALUATION: Test every possible position in every space
    for (let spaceIndex = 0; spaceIndex < freeSpaces.length; spaceIndex++) {
      const space = freeSpaces[spaceIndex];

      for (const orientation of orientationsToTest) {
        const requiredWidth = orientation.dimensions.length + kerfThickness;
        const requiredHeight = orientation.dimensions.width + kerfThickness;

        // Check if part fits in this space
        if (requiredWidth <= space.width && requiredHeight <= space.height) {
          
          // COMPREHENSIVE POSITION TESTING: Test multiple positions within the space
          const testPositions = this.generateComprehensivePositions(space, requiredWidth, requiredHeight, kerfThickness, 12); // BALANCED: 12 positions for good coverage without performance issues
          
          for (const testPosition of testPositions) {
            // Verify no collision
            if (!this.hasCollision(testPosition, orientation.dimensions, existingPlacements, kerfThickness, allParts)) {
              
              // ADVANCED SCORING: Consider multiple efficiency factors
              let efficiency = this.calculateAdvancedEfficiencyScore(
                testPosition,
                orientation.dimensions,
                space,
                existingPlacements,
                stock,
                allParts
              );

              // ROTATION PENALTY: Apply penalty for unnecessary rotations
              if (orientation.rotated && (!hasPartGrainConstraint || !hasStockGrainConstraint)) {
                // Apply 50-point penalty for rotation when no grain constraints exist
                efficiency -= 50;
              }

              const wasteArea = (space.width * space.height) - (orientation.dimensions.length * orientation.dimensions.width);

              const placement: Placement = {
                partId: `Part-${part.partIndex}`,
                x: testPosition.x,
                y: testPosition.y,
                rotated: orientation.rotated,
                name: part.name || `Part-${part.partIndex}`
              };

              placementCandidates.push({
                placement,
                spaceIndex,
                wasteArea,
                efficiency,
                grainCompliant: true
              });
            }
          }
        }
      }
    }

    // Return the most efficient placement
    if (placementCandidates.length > 0) {
      return placementCandidates.sort((a, b) => {
        // Primary: Maximize efficiency
        if (Math.abs(a.efficiency - b.efficiency) > 0.01) {
          return b.efficiency - a.efficiency;
        }
        // Secondary: Minimize waste
        return a.wasteArea - b.wasteArea;
      })[0];
    }

    return null;
  }

  /**
   * OPTIMIZED: Generate smart position candidates with early termination
   */
  static generateComprehensivePositions(
    space: FreeSpace,
    requiredWidth: number,
    requiredHeight: number,
    kerfThickness: number,
    maxPositions: number = 12 // BALANCED: 12 positions for good coverage
  ): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    
    // PRIORITY 1: Essential positions (corners and edges)
    const bottomY = space.y + space.height - requiredHeight;
    const rightX = space.x + space.width - requiredWidth;
    
    const essentialPositions = [
      { x: space.x, y: space.y }, // Top-left (origin) - HIGHEST PRIORITY
      { x: rightX, y: space.y }, // Top-right
      { x: space.x, y: bottomY }, // Bottom-left
      { x: rightX, y: bottomY }  // Bottom-right
    ];
    
    essentialPositions.forEach(pos => {
      if (pos.x >= space.x && pos.y >= space.y &&
          pos.x + requiredWidth <= space.x + space.width &&
          pos.y + requiredHeight <= space.y + space.height) {
        positions.push(pos);
      }
    });
    
    // SPACE UTILIZATION FIX: Always generate comprehensive grid positions for small parts
    const spaceArea = space.width * space.height;
    const partArea = requiredWidth * requiredHeight;
    const spaceUtilization = partArea / spaceArea;
    
    // Generate grid positions more aggressively - especially for small parts that can fit multiple times
    const canFitMultipleX = space.width >= requiredWidth * 2;
    const canFitMultipleY = space.height >= requiredHeight * 2;
    
    if ((canFitMultipleX || canFitMultipleY) && positions.length < maxPositions) {
      // Use smaller grid steps for better coverage
      const gridStepX = Math.max(requiredWidth, 200); // Minimum 200mm grid for optimal placement
      const gridStepY = Math.max(requiredHeight, 200);
      
      for (let y = space.y; y + requiredHeight <= space.y + space.height && positions.length < maxPositions; y += gridStepY) {
        for (let x = space.x; x + requiredWidth <= space.x + space.width && positions.length < maxPositions; x += gridStepX) {
          // Check if this position would be a duplicate
          const isDuplicate = positions.some(pos => Math.abs(pos.x - x) < 1 && Math.abs(pos.y - y) < 1);
          if (!isDuplicate) {
            positions.push({ x, y });
          }
        }
      }
    }
    
    // Remove duplicates and limit to maxPositions
    const uniquePositions = positions.filter((pos, index) => 
      positions.findIndex(p => Math.abs(p.x - pos.x) < 1 && Math.abs(p.y - pos.y) < 1) === index
    );
    
    return uniquePositions.slice(0, maxPositions);
  }

  /**
   * Calculate advanced efficiency score considering multiple factors
   */
  static calculateAdvancedEfficiencyScore(
    position: {x: number, y: number},
    dimensions: {length: number, width: number},
    space: FreeSpace,
    existingPlacements: Placement[],
    stock: OptimizedStock,
    allParts: ProcessedPart[]
  ): number {
    let score = 0;
    
    // ULTRA-AGGRESSIVE SCORING: Heavily weight space utilization
    // 1. Space utilization efficiency (80 points - MAXIMIZED for better layouts)
    const partArea = dimensions.length * dimensions.width;
    const spaceArea = space.width * space.height;
    const utilizationRatio = partArea / spaceArea;
    score += utilizationRatio * 80; // Heavily reward good space usage
    
    // 2. CRITICAL: Bottom-left positioning bonus (60 points - INCREASED)
    // This ensures we fill from bottom-left systematically
    const totalSheetArea = stock.length * stock.width;
    const distanceFromBottomLeft = Math.sqrt(
      Math.pow(position.x, 2) + Math.pow(position.y, 2)
    );
    const maxDistance = Math.sqrt(Math.pow(stock.length, 2) + Math.pow(stock.width, 2));
    const proximityScore = 1 - (distanceFromBottomLeft / maxDistance);
    score += proximityScore * 60; // Major bonus for bottom-left placement
    
    // 3. ULTRA-HIGH EFFICIENCY BONUSES (100+ points for exceptional placements)
    if (utilizationRatio > 0.95) {
      score += 100; // MASSIVE bonus for near-perfect utilization
    } else if (utilizationRatio > 0.90) {
      score += 75; // Very high bonus for excellent utilization
    } else if (utilizationRatio > 0.85) {
      score += 50; // High bonus for good utilization
    } else if (utilizationRatio > 0.75) {
      score += 25; // Standard bonus for acceptable utilization
    }
    
    // 4. AGGRESSIVE REMAINING SPACE QUALITY (40 points)
    // Heavily penalize placements that create small unusable spaces
    const remainingSpaces = this.calculateRemainingSpaces(position, dimensions, space);
    const largestRemainingArea = Math.max(...remainingSpaces.map(s => s.width * s.height), 0);
    const remainingQuality = remainingSpaces.length > 0 ? largestRemainingArea / spaceArea : 1;
    score += remainingQuality * 40;
    
    // 5. Adjacency bonus for tight packing (30 points)
    // Bonus for placing parts adjacent to existing parts
    let adjacencyBonus = 0;
    const tolerance = 10; // Slightly larger tolerance for adjacency
    
    for (const existing of existingPlacements) {
      const distance = Math.sqrt(
        Math.pow(existing.x - position.x, 2) + 
        Math.pow(existing.y - position.y, 2)
      );
      
      if (distance < Math.max(dimensions.length, dimensions.width) + tolerance) {
        adjacencyBonus += 8; // Increased bonus for being close to existing parts
      }
    }
    score += Math.min(adjacencyBonus, 30);
    
    // 6. HARSH PENALTY for creating small unusable spaces
    // Heavily penalize if we create many small unusable spaces
    const smallSpaces = remainingSpaces.filter(s => 
      s.width * s.height < Math.min(dimensions.length, dimensions.width) * 150
    );
    score -= smallSpaces.length * 25; // Increased penalty for creating small spaces
    
    // 7. BONUS for rectangular space utilization (prefer filling rectangular areas completely)
    const widthUtilization = dimensions.length / space.width;
    const heightUtilization = dimensions.width / space.height;
    if (widthUtilization > 0.95 || heightUtilization > 0.95) {
      score += 30; // Bonus for nearly filling one dimension
    }
    
    return score;
  }

  /**
   * Calculate remaining spaces after placing a part
   */
  static calculateRemainingSpaces(
    position: {x: number, y: number},
    dimensions: {length: number, width: number},
    originalSpace: FreeSpace
  ): FreeSpace[] {
    const remainingSpaces: FreeSpace[] = [];
    
    const partRight = position.x + dimensions.length;
    const partBottom = position.y + dimensions.width;
    
    // Right space
    if (partRight < originalSpace.x + originalSpace.width) {
      remainingSpaces.push({
        x: partRight,
        y: originalSpace.y,
        width: originalSpace.x + originalSpace.width - partRight,
        height: originalSpace.height
      });
    }
    
    // Bottom space
    if (partBottom < originalSpace.y + originalSpace.height) {
      remainingSpaces.push({
        x: originalSpace.x,
        y: partBottom,
        width: originalSpace.width,
        height: originalSpace.y + originalSpace.height - partBottom
      });
    }
    
    return remainingSpaces.filter(space => space.width > 20 && space.height > 20); // SPACE UTILIZATION FIX: Much more aggressive - only filter out very tiny spaces
  }

  /**
   * SHARED CUT LINE OPTIMIZATION: Calculate potential shared boundaries between parts
   * This reduces the number of required cuts and improves cutting efficiency
   */
  static detectSharedCutLines(
    existingPlacements: Placement[],
    newPlacement: { x: number, y: number, width: number, height: number },
    kerfThickness: number,
    allParts: ProcessedPart[] = []
  ): {
    sharedVertical: boolean;
    sharedHorizontal: boolean;
    kerfSavings: number;
  } {
    let sharedVertical = false;
    let sharedHorizontal = false;
    let kerfSavings = 0;

    const newLeft = newPlacement.x;
    const newRight = newPlacement.x + newPlacement.width;
    const newTop = newPlacement.y;
    const newBottom = newPlacement.y + newPlacement.height;

    for (const existing of existingPlacements) {
      // Get existing part dimensions
      const partIdMatch = existing.partId.match(/Part-(\d+)/);
      const partIndex = partIdMatch ? parseInt(partIdMatch[1]) : -1;
      const part = allParts.find(p => p.partIndex === partIndex);
      
      let existingWidth, existingHeight;
      if (part) {
        existingWidth = existing.rotated ? part.width : part.length;
        existingHeight = existing.rotated ? part.length : part.width;
      } else {
        existingWidth = 200; // Conservative estimate
        existingHeight = 200;
      }

      const existingLeft = existing.x;
      const existingRight = existing.x + existingWidth;
      const existingTop = existing.y;
      const existingBottom = existing.y + existingHeight;

      // Check for shared vertical cut lines (same X coordinates)
      const tolerance = kerfThickness * 0.5; // Allow some tolerance for alignment
      
      // Left edge alignment
      if (Math.abs(newLeft - existingRight) <= tolerance) {
        sharedVertical = true;
        kerfSavings += Math.min(newPlacement.height, existingHeight) * kerfThickness;
        DebugLogger.logSharedCuts(`[SHARED-CUT] Detected shared vertical cut at X=${newLeft} (left edge alignment)`);
      }
      
      // Right edge alignment
      if (Math.abs(newRight - existingLeft) <= tolerance) {
        sharedVertical = true;
        kerfSavings += Math.min(newPlacement.height, existingHeight) * kerfThickness;
        DebugLogger.logSharedCuts(`[SHARED-CUT] Detected shared vertical cut at X=${newRight} (right edge alignment)`);
      }

      // Check for shared horizontal cut lines (same Y coordinates)
      
      // Top edge alignment
      if (Math.abs(newTop - existingBottom) <= tolerance) {
        sharedHorizontal = true;
        kerfSavings += Math.min(newPlacement.width, existingWidth) * kerfThickness;
        DebugLogger.logSharedCuts(`[SHARED-CUT] Detected shared horizontal cut at Y=${newTop} (top edge alignment)`);
      }
      
      // Bottom edge alignment
      if (Math.abs(newBottom - existingTop) <= tolerance) {
        sharedHorizontal = true;
        kerfSavings += Math.min(newPlacement.width, existingWidth) * kerfThickness;
        DebugLogger.logSharedCuts(`[SHARED-CUT] Detected shared horizontal cut at Y=${newBottom} (bottom edge alignment)`);
      }
    }

    return { sharedVertical, sharedHorizontal, kerfSavings };
  }

  /**
   * ENHANCED KERF-AWARE SPACE CALCULATION: Only account for kerf on actual cut lines
   * This provides more accurate space utilization by eliminating unnecessary kerf gaps
   */
  static calculateKerfAwareSpacing(
    position: { x: number, y: number },
    dimensions: { length: number, width: number },
    existingPlacements: Placement[],
    kerfThickness: number,
    allParts: ProcessedPart[] = []
  ): { 
    effectiveWidth: number; 
    effectiveHeight: number; 
    kerfReduction: number;
  } {
    const sharedCuts = this.detectSharedCutLines(
      existingPlacements,
      { x: position.x, y: position.y, width: dimensions.length, height: dimensions.width },
      kerfThickness,
      allParts
    );

    // Start with full kerf spacing
    let effectiveWidth = dimensions.length + kerfThickness;
    let effectiveHeight = dimensions.width + kerfThickness;
    let kerfReduction = 0;

    // Reduce kerf requirements where cuts are shared
    if (sharedCuts.sharedVertical) {
      effectiveWidth = dimensions.length + (kerfThickness * 0.5); // Half kerf for shared vertical cuts
      kerfReduction += kerfThickness * 0.5;
      DebugLogger.logKerfAware(`[KERF-AWARE] Reduced vertical kerf by ${(kerfThickness * 0.5).toFixed(1)}mm (shared cut)`);
    }

    if (sharedCuts.sharedHorizontal) {
      effectiveHeight = dimensions.width + (kerfThickness * 0.5); // Half kerf for shared horizontal cuts
      kerfReduction += kerfThickness * 0.5;
      DebugLogger.logKerfAware(`[KERF-AWARE] Reduced horizontal kerf by ${(kerfThickness * 0.5).toFixed(1)}mm (shared cut)`);
    }

    return { effectiveWidth, effectiveHeight, kerfReduction };
  }

  /**
   * Validate that no overlaps exist in current placements (safety check)
   */
  static validateNoOverlaps(placements: Placement[], allParts: ProcessedPart[], kerfThickness: number = 0): boolean {
    const TOLERANCE = 0.01;
    
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];
        
        // Get part dimensions
        const part1Index = parseInt(p1.partId.split('-')[1]);
        const part2Index = parseInt(p2.partId.split('-')[1]);
        const part1 = allParts.find(p => p.partIndex === part1Index);
        const part2 = allParts.find(p => p.partIndex === part2Index);
        
        if (!part1 || !part2) continue;
        
        const p1Width = p1.rotated ? part1.width : part1.length;
        const p1Height = p1.rotated ? part1.length : part1.width;
        const p2Width = p2.rotated ? part2.width : part2.length;
        const p2Height = p2.rotated ? part2.length : part2.width;
        
        // CRITICAL FIX: Include kerf thickness in bounds calculation to match collision detection
        const p1Right = p1.x + p1Width + kerfThickness;
        const p1Bottom = p1.y + p1Height + kerfThickness;
        const p2Right = p2.x + p2Width + kerfThickness;
        const p2Bottom = p2.y + p2Height + kerfThickness;
        
        const xOverlap = !(p1Right <= p2.x + TOLERANCE || p1.x >= p2Right - TOLERANCE);
        const yOverlap = !(p1Bottom <= p2.y + TOLERANCE || p1.y >= p2Bottom - TOLERANCE);
        
        if (xOverlap && yOverlap) {
          console.error(`[OVERLAP-VALIDATION] Parts ${p1.partId} and ${p2.partId} overlap at positions (${p1.x}, ${p1.y}) and (${p2.x}, ${p2.y})`);
          return true; // Overlap found
        }
      }
    }
    return false; // No overlaps
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
    
    // SPACE UTILIZATION FIX: Interleave part instances for better mixed layouts
    // Instead of placing all instances of one part type together, distribute them
    
    // First, create all instances grouped by part type
    const partInstances: { [key: number]: ProcessedPart[] } = {};
    
    parts.forEach(part => {
      const quantity = Math.max(1, Math.floor(part.quantity || 1));
      partInstances[part.partIndex] = [];
      
      for (let i = 0; i < quantity; i++) {
        partInstances[part.partIndex].push({
          ...part,
          quantity: 1, // Each instance has quantity 1
          instanceId: `${part.partIndex}-${i}` // Unique instance identifier
        });
      }
    });
    
    // Now interleave instances using round-robin distribution
    // This ensures mixed-size layouts instead of grouping all large parts first
    const partKeys = Object.keys(partInstances).map(Number);
    let hasRemainingParts = true;
    let roundIndex = 0;
    
    while (hasRemainingParts) {
      hasRemainingParts = false;
      
      for (const partIndex of partKeys) {
        const instances = partInstances[partIndex];
        if (roundIndex < instances.length) {
          expandedParts.push(instances[roundIndex]);
          hasRemainingParts = true;
        }
      }
      
      roundIndex++;
    }
    
    console.log(`[EXPANSION] Expanded ${parts.length} part types into ${expandedParts.length} individual parts with interleaved distribution`);
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

    // Calculate total available sheets at the start for strategic distribution
    const totalAvailableSheets = stockInventory.reduce((sum, stock) => sum + stock.originalQuantity, 0);

    // Process each available sheet - loop until no more parts or no more sheets
    let sheetsProcessed = 0;
    const maxSheets = totalAvailableSheets;
    
    while (results.unplacedParts.length > 0 && sheetsProcessed < maxSheets) {
      let sheetUsedThisRound = false;
      
      // Try each stock type that has remaining quantity
      for (const stock of stockInventory) {
        if (results.unplacedParts.length === 0) break;
        if (stock.remainingQuantity <= 0) continue;

        console.log(`[MULTI-SHEET] Processing stock ${stock.stockIndex}, ${results.unplacedParts.length} parts remaining, remaining quantity: ${stock.remainingQuantity}`);

        // Find compatible parts for this sheet
        const compatibleParts = results.unplacedParts.filter(part => {
          const grainResult = ConstraintProcessor.checkGrainCompatibility(part, stock);
          const spaceValid = ConstraintProcessor.validateSpaceConstraints(part, stock, grainResult);
          
          return grainResult.compatible && spaceValid;
        });

        console.log(`[MULTI-SHEET] Found ${compatibleParts.length} compatible parts for this sheet`);

        if (compatibleParts.length > 0) {
          // MULTI-SHEET DISTRIBUTION FIX: Strategic part distribution instead of greedy placement
          // Use more conservative criteria to avoid unnecessary distribution
          const strategicParts = this.shouldApplyStrategicDistribution(compatibleParts, stock, results.unplacedParts.length, totalAvailableSheets)
            ? this.calculateStrategicPartDistribution(
                compatibleParts, 
                stock, 
                results.unplacedParts.length,
                totalAvailableSheets
              )
            : compatibleParts; // Use all compatible parts if strategic distribution not beneficial

          console.log(`[MULTI-SHEET] Strategic distribution selected ${strategicParts.length} of ${compatibleParts.length} parts for optimal multi-sheet layout`);

          const sheetResult = this.optimizeSheetLayout(strategicParts, stock, kerfThickness);
          
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
            sheetUsedThisRound = true;
            sheetsProcessed++;

            // Remove placed parts from unplaced list (for expanded parts, remove individual instances)
            sheetResult.placedPartInstances.forEach(instanceId => {
              const placedPartIndex = results.unplacedParts.findIndex(p => 
                (p.instanceId && p.instanceId === instanceId) || 
                (!p.instanceId && instanceId.startsWith(`${p.partIndex}-`))
              );
              if (placedPartIndex >= 0) {
                results.unplacedParts.splice(placedPartIndex, 1); // Remove the specific instance
              }
            });
            
            // Break out of stock loop to try next iteration with remaining parts
            break;
          }
        }
      }
      
      // If no sheet was used this round, break to avoid infinite loop
      if (!sheetUsedThisRound) {
        console.log(`[MULTI-SHEET] No compatible sheets found for remaining ${results.unplacedParts.length} parts`);
        break;
      }
    }

    // Calculate final metrics
    results.totalEfficiency = this.calculateOverallEfficiency(results.usedSheets, stockInventory);
    results.inventoryUtilization = this.calculateInventoryUtilization(results.usedSheets, stockInventory);

    return results;
  }

  /**
   * Calculate overall efficiency using the EfficiencyOptimizer
   */
  private static calculateOverallEfficiency(
    usedSheets: StockUsage[], 
    stockInventory: OptimizedStock[]
  ): number {
    const efficiency = EfficiencyOptimizer.calculateEfficiency(usedSheets, stockInventory);
    return efficiency.materialEfficiency;
  }

  /**
   * Calculate inventory utilization using the EfficiencyOptimizer
   */
  private static calculateInventoryUtilization(
    usedSheets: StockUsage[], 
    stockInventory: OptimizedStock[]
  ): number {
    const efficiency = EfficiencyOptimizer.calculateEfficiency(usedSheets, stockInventory);
    return efficiency.inventoryUtilization;
  }

  /**
   * Determine if strategic distribution should be applied based on current context
   * Uses more conservative criteria to avoid unnecessary distribution
   */
  private static shouldApplyStrategicDistribution(
    compatibleParts: ProcessedPart[],
    stock: OptimizedStock,
    totalUnplacedParts: number,
    totalAvailableSheets: number
  ): boolean {
    // SPACE UTILIZATION FIX: Enable strategic distribution for optimal mixed-size layouts
    // Strategic distribution prevents greedy large-part-first placement
    const totalPartsArea = compatibleParts.reduce((sum, part) => sum + (part.length * part.width), 0);
    const sheetArea = stock.length * stock.width;
    const theoreticalEfficiency = totalPartsArea / sheetArea;

    // Apply strategic distribution when:
    // 1. We have mixed part sizes (both large and small)
    // 2. Multiple sheets are available
    // 3. The current sheet could be overfilled
    const hasEnoughParts = compatibleParts.length >= 3;
    const hasMultipleSheets = totalAvailableSheets > 1;
    const couldOverfill = theoreticalEfficiency > 0.9; // High potential efficiency suggests possible overfill
    
    // Check for mixed part sizes (large vs small parts)
    const partAreas = compatibleParts.map(p => p.length * p.width);
    const minArea = Math.min(...partAreas);
    const maxArea = Math.max(...partAreas);
    const hasMixedSizes = (maxArea / minArea) > 3; // Large parts are 3x+ bigger than small parts

    console.log(`[STRATEGIC] Parts: ${compatibleParts.length}, Mixed sizes: ${hasMixedSizes}, Efficiency: ${(theoreticalEfficiency * 100).toFixed(1)}%, Sheets: ${totalAvailableSheets}`);

    const shouldApply = hasEnoughParts && hasMultipleSheets && hasMixedSizes && couldOverfill;
    console.log(`[STRATEGIC] Applying strategic distribution: ${shouldApply}`);
    return shouldApply;
  }

  /**
   * Calculate strategic part distribution for optimal multi-sheet layout
   * More conservative approach to avoid splitting when not beneficial
   */
  private static calculateStrategicPartDistribution(
    compatibleParts: ProcessedPart[],
    stock: OptimizedStock,
    totalUnplacedParts: number,
    totalAvailableSheets: number
  ): ProcessedPart[] {
    // SPACE UTILIZATION FIX: Implement balanced mixed-size distribution
    // Instead of just largest-first, create a balanced mix of large and small parts
    
    const sheetArea = stock.length * stock.width;
    let targetSheetEfficiency = 0.85; // More conservative target to leave room for optimal packing
    
    // Categorize parts by size
    const partAreas = compatibleParts.map(p => ({ part: p, area: p.length * p.width }));
    const averageArea = partAreas.reduce((sum, p) => sum + p.area, 0) / partAreas.length;
    
    const largeParts = partAreas.filter(p => p.area > averageArea * 1.5).map(p => p.part);
    const mediumParts = partAreas.filter(p => p.area >= averageArea * 0.7 && p.area <= averageArea * 1.5).map(p => p.part);
    const smallParts = partAreas.filter(p => p.area < averageArea * 0.7).map(p => p.part);
    
    console.log(`[STRATEGIC] Part distribution - Large: ${largeParts.length}, Medium: ${mediumParts.length}, Small: ${smallParts.length}`);
    
    // Create balanced selection prioritizing space efficiency
    const selectedParts: ProcessedPart[] = [];
    let cumulativeArea = 0;
    
    // Strategy: Start with a foundation of large parts, then fill gaps with smaller parts
    
    // Phase 1: Add large parts (foundation) - but limit to avoid overfill
    const maxLargeParts = Math.min(largeParts.length, Math.ceil(largeParts.length * 0.6));
    for (let i = 0; i < maxLargeParts; i++) {
      const part = largeParts[i];
      const partArea = part.length * part.width;
      
      if ((cumulativeArea + partArea) / sheetArea <= targetSheetEfficiency * 0.7) {
        selectedParts.push(part);
        cumulativeArea += partArea;
      } else {
        break;
      }
    }
    
    // Phase 2: Fill gaps with medium parts
    for (const part of mediumParts) {
      const partArea = part.length * part.width;
      const newEfficiency = (cumulativeArea + partArea) / sheetArea;
      
      if (newEfficiency <= targetSheetEfficiency) {
        selectedParts.push(part);
        cumulativeArea += partArea;
      }
    }
    
    // Phase 3: Fill remaining space with small parts (these are efficient gap fillers)
    for (const part of smallParts) {
      const partArea = part.length * part.width;
      const newEfficiency = (cumulativeArea + partArea) / sheetArea;
      
      if (newEfficiency <= targetSheetEfficiency) {
        selectedParts.push(part);
        cumulativeArea += partArea;
      }
    }
    
    // Ensure we have at least 2 parts for distribution to be meaningful
    if (selectedParts.length < 2) {
      console.log(`[STRATEGIC] Not enough parts for meaningful distribution, using all compatible parts`);
      return compatibleParts;
    }

    const actualEfficiency = cumulativeArea / sheetArea;
    console.log(`[STRATEGIC] Balanced selection: ${selectedParts.length} parts (${largeParts.filter(p => selectedParts.includes(p)).length}L + ${mediumParts.filter(p => selectedParts.includes(p)).length}M + ${smallParts.filter(p => selectedParts.includes(p)).length}S) for ${(actualEfficiency * 100).toFixed(1)}% efficiency`);
    
    return selectedParts;
  }

  /**
   * Optimize layout for a specific sheet using the placement engine
   */
  private static optimizeSheetLayout(
    partsToPlace: ProcessedPart[],
    stock: OptimizedStock,
    kerfThickness: number
  ): {
    placements: Placement[];
    freeSpaces: FreeSpace[];
    usedArea: number;
    placedPartInstances: string[];
  } {
    const placements: Placement[] = [];
    const placedPartInstances: string[] = [];
    let freeSpaces: FreeSpace[] = [{
      x: 0,
      y: 0,
      width: stock.length,
      height: stock.width
    }];

    console.log(`[SHEET-LAYOUT] Optimizing layout for ${partsToPlace.length} parts on ${stock.length}x${stock.width}mm sheet`);

    // SPACE UTILIZATION FIX: Sort parts for optimal placement order within each sheet
    // Prioritize better space-filling patterns instead of just processing in original order
    const sortedPartsForPlacement = [...partsToPlace].sort((a, b) => {
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      
      // For small sheets or when many parts remain, prioritize largest parts first for foundation
      if (partsToPlace.length > 10 || (stock.length * stock.width) < 3000000) {
        return areaB - areaA;
      }
      
      // For larger sheets with fewer parts, use mixed ordering for better gap filling
      const aspectRatioA = Math.max(a.length, a.width) / Math.min(a.length, a.width);
      const aspectRatioB = Math.max(b.length, b.width) / Math.min(b.length, b.width);
      
      // Prioritize parts with more extreme aspect ratios (harder to place)
      if (Math.abs(aspectRatioA - aspectRatioB) > 0.5) {
        return aspectRatioB - aspectRatioA;
      }
      
      // Then by area for similar aspect ratios
      return areaB - areaA;
    });

    // Process parts in optimized order
    for (const part of sortedPartsForPlacement) {
      // Check grain compatibility
      const grainResult = ConstraintProcessor.checkGrainCompatibility(part, stock);
      if (!grainResult.compatible) {
        console.log(`[SHEET-LAYOUT] Part ${part.partIndex} incompatible with grain direction`);
        continue;
      }

      // Find optimal placement
      const optimalPlacement = PlacementEngine.findOptimalPlacement(
        part,
        stock,
        placements,
        freeSpaces,
        kerfThickness,
        grainResult,
        partsToPlace
      );

      if (optimalPlacement) {
        // Add placement
        placements.push(optimalPlacement.placement);
        
        // CRITICAL FIX: Update spatial grid with new placement to prevent overlaps
        PlacementEngine.updateSpatialGridWithPlacement(optimalPlacement.placement, partsToPlace);
        
        // Track instance for removal from unplaced parts
        const instanceId = part.instanceId || `${part.partIndex}-0`;
        placedPartInstances.push(instanceId);

        // Update free spaces
        freeSpaces = PlacementEngine.updateFreeSpaces(
          freeSpaces,
          optimalPlacement.spaceIndex,
          {
            length: grainResult.dimensions.length,
            width: grainResult.dimensions.width
          },
          {
            x: optimalPlacement.placement.x,
            y: optimalPlacement.placement.y
          },
 kerfThickness
        );

        console.log(`[SHEET-LAYOUT] Placed part ${part.partIndex} at (${optimalPlacement.placement.x}, ${optimalPlacement.placement.y})`);
      } else {
        console.log(`[SHEET-LAYOUT] Could not place part ${part.partIndex} on this sheet`);
      }
    }

    // Calculate total used area
    const usedArea = placements.reduce((total, placement) => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      const part = partsToPlace.find(p => p.partIndex === partIndex);
      if (part) {
        return total + (part.length * part.width);
      }
      return total;
    }, 0);

    console.log(`[SHEET-LAYOUT] Layout complete: ${placements.length} parts placed, ${usedArea.toLocaleString()}mm² used`);

    return {
      placements,
      freeSpaces,
      usedArea,
      placedPartInstances
    };
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
    console.log('🔵 [DEBUG-OPT] executeOptimization called with:');
    console.log('🔵 [DEBUG-OPT] availableStocks:', availableStocks.length, 'items');
    console.log('🔵 [DEBUG-OPT] requiredParts:', requiredParts.length, 'items');
    console.log('🔵 [DEBUG-OPT] kerfThickness:', kerfThickness);

    try {
      // PHASE 1: Input Processing and Validation
      console.log('📥 PHASE 1: Input Processing and Validation');
      console.log('🔵 [DEBUG-OPT] Starting Phase 1');
      
      // Enhanced input validation
      if (!availableStocks || availableStocks.length === 0) {
        console.log('🔴 [DEBUG-OPT] No stock materials provided');
        return {
          success: false,
          message: 'No stock materials provided. Please add stock to continue.',
          stockUsage: [],
          totalUsedSheets: 0,
          totalWaste: 0,
          sortedParts: requiredParts,
          cutSequences: []
        };
      }
      
      if (!requiredParts || requiredParts.length === 0) {
        console.log('🔴 [DEBUG-OPT] No parts specified for cutting');
        return {
          success: false,
          message: 'No parts specified for cutting. Please add parts to continue.',
          stockUsage: [],
          totalUsedSheets: 0,
          totalWaste: 0,
          sortedParts: [],
          cutSequences: []
        };
      }
      
      // Validate part quantities
      const invalidParts = requiredParts.filter(part => !part.quantity || part.quantity <= 0);
      if (invalidParts.length > 0) {
        console.log('🔴 [DEBUG-OPT] Invalid part quantities detected:', invalidParts);
        return {
          success: false,
          message: `Invalid part quantities detected. All parts must have quantity > 0.`,
          stockUsage: [],
          totalUsedSheets: 0,
          totalWaste: 0,
          sortedParts: requiredParts,
          cutSequences: []
        };
      }
      
      console.log('🟢 [DEBUG-OPT] Phase 1 validation passed');
      
      const optimizedStock = InputProcessor.processStockInventory(availableStocks);
      const processedParts = InputProcessor.processRequiredParts(requiredParts);
      const validation = InputProcessor.validateCompatibility(optimizedStock, processedParts);

      console.log('🔵 [DEBUG-OPT] Processed', optimizedStock.length, 'stock items and', processedParts.length, 'part types');
      console.log('🔵 [DEBUG-OPT] Validation result:', validation.isValid);

      if (!validation.isValid) {
        console.log('🔴 [DEBUG-OPT] Validation failed:', validation.insufficientStockDetails?.recommendations);
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
      console.log('🔵 [DEBUG-OPT] Expanded', processedParts.length, 'part types into', expandedParts.length, 'individual parts');
      
      // Additional validation for expanded parts
      if (expandedParts.length === 0) {
        console.log('🔴 [DEBUG-OPT] No parts to place after expansion');
        return {
          success: false,
          message: 'No parts to place after expansion. Check part quantities.',
          stockUsage: [],
          totalUsedSheets: 0,
          totalWaste: 0,
          sortedParts: requiredParts,
          cutSequences: []
        };
      }
      
      console.log('🔵 [DEBUG-OPT] About to call MultiSheetOptimizer.optimizeAcrossSheets');
      
      const multiSheetResult = MultiSheetOptimizer.optimizeAcrossSheets(
        expandedParts, optimizedStock, kerfThickness
      );
      
      console.log('🔵 [DEBUG-OPT] MultiSheetOptimizer.optimizeAcrossSheets returned:');
      console.log('🔵 [DEBUG-OPT] - usedSheets:', multiSheetResult.usedSheets.length);
      console.log('🔵 [DEBUG-OPT] - unplacedParts:', multiSheetResult.unplacedParts.length);
      console.log('🔵 [DEBUG-OPT] - totalEfficiency:', multiSheetResult.totalEfficiency);

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

      // Enhanced success/failure determination
      const isSuccess = multiSheetResult.unplacedParts.length === 0;
      const hasPartialPlacement = multiSheetResult.usedSheets.length > 0;
      
      let message: string;
      if (isSuccess) {
        message = `✓ Optimized placement: ${multiSheetResult.usedSheets.length} sheets used, ${efficiency.materialEfficiency.toFixed(1)}% efficiency`;
      } else if (hasPartialPlacement) {
        message = `⚠ Partial placement: ${multiSheetResult.unplacedParts.length} parts remaining, additional stock needed`;
      } else {
        message = `❌ Unable to place any parts. Check stock dimensions and material compatibility.`;
      }

      return {
        success: isSuccess,
        message,
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

// PERFORMANCE OPTIMIZATION: Spatial indexing for faster collision detection
export interface SpatialGrid {
  cellSize: number;
  grid: Map<string, Placement[]>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface OptimizedPositionGenerator {
  maxPositionsPerSpace: number;
  earlyTerminationThreshold: number;
  spatialOptimization: boolean;
}
