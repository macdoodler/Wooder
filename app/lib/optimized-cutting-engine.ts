// Optimized Cutting Engine - Comprehensive 5-Phase Processing Pipeline
// Implements the fundamental algorithmic principles for professional cutting optimization

import { Stock, Part, Placement, FreeSpace, Results, StockUsage, MaterialType } from './types';

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
    if (existingPlacements.length > 10 && allParts.length > 0) {
      this.initializeSpatialGrid(existingPlacements, allParts, stock);
    }

    // Check if this part should use strip-cutting optimization
    if (this.shouldUseStripCutting(part, stock, existingPlacements, allParts)) {
      DebugLogger.logPlacement(`[STRIP-CUTTING] Using strip-cutting for small part ${part.length}x${part.width}mm`);
      const stripPlacement = this.findStripPlacement(part, stock, existingPlacements, freeSpaces, kerfThickness, grainResult, allParts);
      if (stripPlacement) {
        // Update spatial grid with new placement
        if (this.spatialGrid && allParts.length > 0) {
          this.addToSpatialGrid(stripPlacement.placement, allParts);
        }
        DebugLogger.logPlacement(`[STRIP-CUTTING] ✅ Found strip placement at (${stripPlacement.placement.x}, ${stripPlacement.placement.y})`);
        return stripPlacement;
      }
      DebugLogger.logPlacement(`[STRIP-CUTTING] ⚠️ Strip placement failed, falling back to enhanced placement`);
    }

    // Use enhanced efficiency placement for maximum material utilization
    DebugLogger.logPlacement(`[ENHANCED-PLACEMENT] Using advanced efficiency algorithms for part ${part.length}x${part.width}mm`);
    const enhancedPlacement = this.findMaxEfficiencyPlacement(part, stock, existingPlacements, freeSpaces, kerfThickness, grainResult, allParts);
    if (enhancedPlacement) {
      // Update spatial grid with new placement
      if (this.spatialGrid && allParts.length > 0) {
        this.addToSpatialGrid(enhancedPlacement.placement, allParts);
      }
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
      // No grain constraints - test both orientations for better packing
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
        const aCanFitMultiple = (a.space.width >= 800 + kerfThickness * 2) || (a.space.height >= 400 + kerfThickness * 2);
        const bCanFitMultiple = (b.space.width >= 800 + kerfThickness * 2) || (b.space.height >= 400 + kerfThickness * 2);
        
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
            // Calculate efficiency metrics with improved scoring
            const spaceArea = space.width * space.height;
            const partArea = orientation.dimensions.length * orientation.dimensions.width;
            const wasteArea = spaceArea - partArea;
            const efficiency = partArea / spaceArea;
            
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
              efficiency: efficiency + (positionScore / 1000), // Small bonus for grid alignment
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
    // OPTIMIZATION: Use spatial grid if available for fast lookup
    if (this.spatialGrid && allParts.length > 0) {
      return this.fastCollisionCheck(newPosition, newDimensions, kerfThickness, allParts);
    }

    // FALLBACK: Original collision detection for small placement counts
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
      if (rightWidth > partWidth * 0.5) { // Only create if reasonably sized
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
      if (bottomHeight > partHeight * 0.5) { // Only create if reasonably sized
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
      if (leftWidth > partWidth * 0.5) { // Only create if reasonably sized
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
      if (topHeight > partHeight * 0.5) { // Only create if reasonably sized
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
          const testPositions = this.generateComprehensivePositions(space, requiredWidth, requiredHeight, kerfThickness, 6); // PERFORMANCE: Limit to 6 positions
          
          for (const testPosition of testPositions) {
            // Verify no collision
            if (!this.hasCollision(testPosition, orientation.dimensions, existingPlacements, kerfThickness, allParts)) {
              
              // ADVANCED SCORING: Consider multiple efficiency factors
              const efficiency = this.calculateAdvancedEfficiencyScore(
                testPosition,
                orientation.dimensions,
                space,
                existingPlacements,
                stock,
                allParts
              );

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
    maxPositions: number = 8 // PERFORMANCE: Limit max positions tested
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
    
    // EARLY TERMINATION: If we have good essential positions, limit additional testing
    if (positions.length >= 2 && maxPositions <= 6) {
      return positions.slice(0, maxPositions);
    }
    
    // PRIORITY 2: Strategic grid positions (only if space warrants it)
    const spaceArea = space.width * space.height;
    const partArea = requiredWidth * requiredHeight;
    const spaceUtilization = partArea / spaceArea;
    
    // Only generate grid positions for large spaces or low utilization
    if (spaceUtilization < 0.7 && positions.length < maxPositions) {
      const gridStepX = Math.max(requiredWidth * 2, 400); // Larger grid steps
      const gridStepY = Math.max(requiredHeight * 2, 400);
      
      for (let y = space.y + gridStepY; y + requiredHeight <= space.y + space.height && positions.length < maxPositions; y += gridStepY) {
        for (let x = space.x + gridStepX; x + requiredWidth <= space.x + space.width && positions.length < maxPositions; x += gridStepX) {
          positions.push({ x, y });
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
    // 1. Space utilization efficiency (50 points - increased from 40)
    const partArea = dimensions.length * dimensions.width;
    const spaceArea = space.width * space.height;
    const utilizationRatio = partArea / spaceArea;
    score += utilizationRatio * 50; // Increased weight for maximum material usage
    
    // 2. Position optimality (25 points - slightly reduced from 30)
    // Prefer bottom-left positioning for manufacturing efficiency
    const xRatio = (space.x + space.width - position.x) / space.width;
    const yRatio = (space.y + space.height - position.y) / space.height;
    const positionScore = (xRatio + yRatio) / 2;
    score += positionScore * 25;
    
    // 3. AGGRESSIVE REMAINING SPACE QUALITY (20 points)
    // Heavily penalize placements that create small unusable spaces
    const remainingSpaces = this.calculateRemainingSpaces(position, dimensions, space);
    const largestRemainingArea = Math.max(...remainingSpaces.map(s => s.width * s.height), 0);
    const remainingQuality = largestRemainingArea / spaceArea;
    
    // BONUS: Extra points for utilizing >90% of space
    if (utilizationRatio > 0.90) {
      score += 25; // Major bonus for ultra-high utilization
    }
    
    score += remainingQuality * 20;
    
    // 4. Grid alignment bonus (5 points - reduced from 10 to focus on efficiency)
    // Bonus for positions that align with manufacturing grid
    const gridAlignmentX = (position.x % 200) === 0 ? 2.5 : 0;
    const gridAlignmentY = (position.y % 200) === 0 ? 2.5 : 0;
    score += gridAlignmentX + gridAlignmentY;
    
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
    
    return remainingSpaces.filter(space => space.width > 50 && space.height > 50); // Filter out tiny spaces
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
          // Limit parts per sheet to encourage distribution across multiple sheets
          const strategicParts = this.calculateStrategicPartDistribution(
            compatibleParts, 
            stock, 
            results.unplacedParts.length,
            totalAvailableSheets
          );

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
    placedPartInstances: string[];
  } {
    const placements: Placement[] = [];
    let freeSpaces: FreeSpace[] = [{
      x: 0,
      y: 0,
      width: stock.length,
      height: stock.width
    }];
    let usedArea = 0;
    const placedPartInstances: string[] = [];

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

      console.log(`[SHEET-LAYOUT] Attempting to place part ${part.instanceId || part.partIndex} (${part.length}x${part.width})`);
      console.log(`[SHEET-LAYOUT] Current free spaces: ${freeSpaces.length}`);
      freeSpaces.forEach((space, i) => {
        console.log(`  Space ${i}: (${space.x}, ${space.y}) ${space.width}x${space.height}`);
      });

      const grainResult = ConstraintProcessor.checkGrainCompatibility(part, stock);
      const optimalPlacement = PlacementEngine.findOptimalPlacement(
        part, stock, placements, freeSpaces, kerfThickness, grainResult, compatibleParts
      );

      if (optimalPlacement) {
        console.log(`[SHEET-LAYOUT] ✅ Placed part ${part.instanceId || part.partIndex} at (${optimalPlacement.placement.x}, ${optimalPlacement.placement.y})`);
        
        // Add placement with unique ID using instanceId if available
        const uniqueId = part.instanceId || `${part.partIndex}-${placedPartInstances.length}`;
        const placementWithId = {
          ...optimalPlacement.placement,
          partId: `Part-${uniqueId}`
        };

        placements.push(placementWithId);
        placedPartInstances.push(part.instanceId || `${part.partIndex}-${placedPartInstances.length}`);
        
        // Update free spaces
        freeSpaces = PlacementEngine.updateFreeSpaces(
          freeSpaces,
          optimalPlacement.spaceIndex,
          grainResult.dimensions,
          { x: optimalPlacement.placement.x, y: optimalPlacement.placement.y },
          kerfThickness
        );

        usedArea += grainResult.dimensions.length * grainResult.dimensions.width;
        
        console.log(`[SHEET-LAYOUT] Updated free spaces: ${freeSpaces.length}`);
      } else {
        console.log(`[SHEET-LAYOUT] ❌ Could not place part ${part.instanceId || part.partIndex} (${part.length}x${part.width})`);
      }
    }

    return { placements, freeSpaces, usedArea, placedPartInstances };
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

  /**
   * Calculate strategic part distribution to avoid greedy single-sheet placement
   * Ensures better distribution across multiple sheets for practical cutting
   */
  /**
   * Calculate strategic part distribution to avoid greedy single-sheet placement
   * ENHANCED: Advanced mixed-size bin packing with shared cut line optimization
   */
  private static calculateStrategicPartDistribution(
    compatibleParts: ProcessedPart[],
    stock: OptimizedStock,
    totalRemainingParts: number,
    availableSheetsCount: number
  ): ProcessedPart[] {
    
    const sheetArea = stock.length * stock.width;
    const totalPartArea = compatibleParts.reduce((sum, part) => sum + (part.length * part.width), 0);
    const theoreticalEfficiency = totalPartArea / sheetArea;
    
    console.log(`[STRATEGIC] Analysis: efficiency=${(theoreticalEfficiency * 100).toFixed(1)}%, sheets=${availableSheetsCount}, remaining=${totalRemainingParts}, compatible=${compatibleParts.length}`);
    
    // If only one sheet available, use all compatible parts
    if (availableSheetsCount <= 1) {
      console.log(`[STRATEGIC] Only 1 sheet available, using all ${compatibleParts.length} parts`);
      return compatibleParts;
    }

    // ADVANCED MIXED-SIZE OPTIMIZATION: Analyze part size distribution
    const partAreas = compatibleParts.map(p => ({ part: p, area: p.length * p.width }));
    const largestArea = Math.max(...partAreas.map(p => p.area));
    const smallestArea = Math.min(...partAreas.map(p => p.area));
    const areaRatio = largestArea / smallestArea;
    
    console.log(`[STRATEGIC] Mixed-size analysis: largest=${largestArea.toLocaleString()}mm², smallest=${smallestArea.toLocaleString()}mm², ratio=${areaRatio.toFixed(1)}:1`);
    
    // ADVANCED DISTRIBUTION ALGORITHM: Mixed-size aware load balancing
    if (areaRatio > 3 && compatibleParts.length >= 8) {
      console.log(`[STRATEGIC] Mixed-size scenario detected - applying advanced bin packing algorithms`);
      return this.calculateMixedSizeDistribution(compatibleParts, stock, availableSheetsCount);
    }

    // STRATEGIC DISTRIBUTION CRITERIA: Prevent inefficient single-sheet cramming
    const wouldFitOnOneSheet = theoreticalEfficiency <= 1.0;
    const optimalSheetsNeeded = Math.ceil(theoreticalEfficiency);
    
    // ULTRA-AGGRESSIVE EFFICIENCY STRATEGY: Maximum material utilization
    // Apply strategic distribution more aggressively:
    // 1. Lower threshold: Apply even when efficiency is >80% (reduced from 85%)
    // 2. Reduce minimum parts threshold from 8 to 6
    // 3. Apply to scenarios with mixed part sizes (user's exact case)
    // 4. Prioritize eliminating wasteful third sheets
    if (wouldFitOnOneSheet && theoreticalEfficiency > 0.80 && availableSheetsCount > 1 && totalRemainingParts > 6) {
      console.log(`[STRATEGIC] High efficiency scenario detected (${(theoreticalEfficiency * 100).toFixed(1)}%), applying ultra-aggressive distribution for maximum utilization`);
      
      // ULTRA-AGGRESSIVE TARGET: Aim for 88%+ per sheet to eliminate waste
      const targetEfficiency = 0.88; // Optimized for practical cutting efficiency
      const targetArea = sheetArea * targetEfficiency;
      
      console.log(`[STRATEGIC] Target area: ${targetArea.toLocaleString()}mm² (${(targetEfficiency * 100).toFixed(1)}% of ${sheetArea.toLocaleString()}mm²)`);
      
      // ADVANCED SELECTION: Prioritize optimal mixed-size combinations
      const selectedParts = this.selectOptimalPartCombination(
        compatibleParts, 
        targetArea, 
        sheetArea, 
        availableSheetsCount
      );
      
      const accumulatedArea = selectedParts.reduce((sum, part) => sum + (part.length * part.width), 0);
      const achievedEfficiency = accumulatedArea / sheetArea;
      
      console.log(`[STRATEGIC] Selected ${selectedParts.length} parts (${(achievedEfficiency * 100).toFixed(1)}% efficiency) instead of ${compatibleParts.length} parts`);
      
      // SUCCESS CRITERIA: Must achieve good efficiency while enabling distribution
      if (achievedEfficiency >= 0.82 && selectedParts.length >= Math.min(6, compatibleParts.length * 0.6)) {
        return selectedParts;
      } else {
        console.log(`[STRATEGIC] Advanced distribution would result in suboptimal efficiency (${(achievedEfficiency * 100).toFixed(1)}%), using fallback strategy`);
      }
    }
    
    console.log(`[STRATEGIC] No strategic distribution needed (naturally needs ${optimalSheetsNeeded} sheets), using all ${compatibleParts.length} parts`);
    // For normal cases or when strategic distribution isn't needed, use all compatible parts
    return compatibleParts;
  }

  /**
   * ADVANCED MIXED-SIZE DISTRIBUTION: Specialized algorithm for mixed part sizes
   * Optimizes for better space utilization and reduced sheet count
   */
  private static calculateMixedSizeDistribution(
    compatibleParts: ProcessedPart[],
    stock: OptimizedStock,
    availableSheetsCount: number
  ): ProcessedPart[] {
    const sheetArea = stock.length * stock.width;
    
    // Categorize parts by size
    const largePartsThreshold = sheetArea * 0.15; // Parts > 15% of sheet area
    const smallPartsThreshold = sheetArea * 0.05; // Parts < 5% of sheet area
    
    const largeParts = compatibleParts.filter(p => (p.length * p.width) >= largePartsThreshold);
    const mediumParts = compatibleParts.filter(p => {
      const area = p.length * p.width;
      return area < largePartsThreshold && area >= smallPartsThreshold;
    });
    const smallParts = compatibleParts.filter(p => (p.length * p.width) < smallPartsThreshold);
    
    console.log(`[MIXED-SIZE] Part distribution: ${largeParts.length} large, ${mediumParts.length} medium, ${smallParts.length} small`);
    
    // LOAD BALANCING ALGORITHM: Distribute parts to achieve target efficiency per sheet
    const targetEfficiencyPerSheet = 0.85; // 85% target efficiency
    const targetAreaPerSheet = sheetArea * targetEfficiencyPerSheet;
    
    // Strategy 1: Start with large parts, add medium/small to fill gaps
    let currentAccumulation = 0;
    const selectedParts: ProcessedPart[] = [];
    
    // Add largest parts first (backbone of the layout)
    for (const largePart of largeParts.slice(0, Math.min(largeParts.length, 3))) {
      const partArea = largePart.length * largePart.width;
      if (currentAccumulation + partArea <= targetAreaPerSheet * 1.1) { // Allow 10% overage
        selectedParts.push(largePart);
        currentAccumulation += partArea;
        console.log(`[MIXED-SIZE] Added large part ${largePart.instanceId}: ${partArea.toLocaleString()}mm² (running total: ${currentAccumulation.toLocaleString()}mm²)`);
      }
    }
    
    // Fill remaining space with medium parts
    const remainingArea = targetAreaPerSheet - currentAccumulation;
    const suitableMediumParts = mediumParts.filter(p => (p.length * p.width) <= remainingArea * 1.2);
    
    for (const mediumPart of suitableMediumParts.slice(0, Math.min(suitableMediumParts.length, 4))) {
      const partArea = mediumPart.length * mediumPart.width;
      if (currentAccumulation + partArea <= targetAreaPerSheet * 1.15) { // Allow 15% overage for gap filling
        selectedParts.push(mediumPart);
        currentAccumulation += partArea;
        console.log(`[MIXED-SIZE] Added medium part ${mediumPart.instanceId}: ${partArea.toLocaleString()}mm² (running total: ${currentAccumulation.toLocaleString()}mm²)`);
      }
    }
    
    // Fill remaining small gaps with small parts
    const finalRemainingArea = targetAreaPerSheet * 1.2 - currentAccumulation;
    let smallPartsAdded = 0;
    
    for (const smallPart of smallParts) {
      const partArea = smallPart.length * smallPart.width;
      if (partArea <= finalRemainingArea && smallPartsAdded < 6) { // Limit to 6 small parts max
        selectedParts.push(smallPart);
        currentAccumulation += partArea;
        smallPartsAdded++;
        console.log(`[MIXED-SIZE] Added small part ${smallPart.instanceId}: ${partArea.toLocaleString()}mm² (running total: ${currentAccumulation.toLocaleString()}mm²)`);
      }
    }
    
    const finalEfficiency = currentAccumulation / sheetArea;
    console.log(`[MIXED-SIZE] Final selection: ${selectedParts.length} parts, ${(finalEfficiency * 100).toFixed(1)}% efficiency`);
    
    // Return optimized selection if it meets criteria
    if (finalEfficiency >= 0.75 && selectedParts.length >= 4) {
      return selectedParts;
    }
    
    // Fallback: Use all compatible parts
    console.log(`[MIXED-SIZE] Mixed-size optimization didn't meet criteria, using all parts`);
    return compatibleParts;
  }

  /**
   * OPTIMAL PART COMBINATION SELECTION: Advanced algorithm for best part combinations
   * Uses dynamic programming principles for optimal space utilization
   */
  private static selectOptimalPartCombination(
    parts: ProcessedPart[],
    targetArea: number,
    sheetArea: number,
    availableSheets: number
  ): ProcessedPart[] {
    // Sort parts by area descending for greedy approach
    const sortedParts = [...parts].sort((a, b) => {
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      return areaB - areaA;
    });
    
    // GREEDY SELECTION with look-ahead optimization
    const selectedParts: ProcessedPart[] = [];
    let accumulatedArea = 0;
    const maxOverage = targetArea * 0.25; // Allow 25% overage for optimal combinations
    
    for (let i = 0; i < sortedParts.length; i++) {
      const part = sortedParts[i];
      const partArea = part.length * part.width;
      
      // Look ahead to see if we can fit better combinations
      const remainingAfterThisPart = targetArea - (accumulatedArea + partArea);
      const canFitMoreParts = sortedParts.slice(i + 1).some(p => (p.length * p.width) <= remainingAfterThisPart);
      
      // Decision logic: Take part if it fits well or if it's the last viable option
      const wouldExceedTarget = accumulatedArea + partArea > targetArea;
      const withinOverageLimit = accumulatedArea + partArea <= targetArea + maxOverage;
      const isEssentialForEfficiency = partArea >= sheetArea * 0.1; // Large parts are essential
      
      if (!wouldExceedTarget || 
          (wouldExceedTarget && withinOverageLimit && isEssentialForEfficiency) ||
          selectedParts.length === 0) {
        
        selectedParts.push(part);
        accumulatedArea += partArea;
        
        console.log(`[OPTIMAL] Selected part ${part.instanceId || part.partIndex} (${part.length}x${part.width}=${partArea.toLocaleString()}mm²)`);
        console.log(`[OPTIMAL] Running total: ${accumulatedArea.toLocaleString()}mm² / ${targetArea.toLocaleString()}mm² (${(accumulatedArea/targetArea*100).toFixed(1)}%)`);
        
        // Stop if we've reached a good target
        if (accumulatedArea >= targetArea * 0.85 && selectedParts.length >= 3) {
          console.log(`[OPTIMAL] Reached efficient target, stopping selection`);
          break;
        }
      } else {
        console.log(`[OPTIMAL] Skipping part ${part.instanceId || part.partIndex} - would exceed beneficial limits`);
      }
    }
    
    return selectedParts;
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
