// Unified Packing Engine - Consolidates all redundant algorithms
// This replaces multiple overlapping implementations with a single, optimized engine

import { Part, FreeSpace, Stock, Placement } from './types';
import { validatePlacement } from './cut-helpers';

// Unified interface for all packing strategies
export interface PackingStrategy {
  name: string;
  description: string;
  sortFunction: (parts: PackingInstance[]) => PackingInstance[];
  placementFunction: (part: PackingInstance, spaces: FreeSpace[], context: PackingContext) => PlacementResult | null;
}

export interface PackingInstance {
  part: Part;
  partIndex: number;
  instanceId: string;
  priority?: number;
}

export interface PackingContext {
  stock: Stock;
  kerfThickness: number;
  existingPlacements: Placement[];
  stockGrainDirection?: string;
  requiredParts?: Part[];
  strategy: 'first-fit' | 'best-fit';
}

export interface PlacementResult {
  spaceIndex: number;
  rotated: boolean;
  x: number;
  y: number;
  score: number;
  reason: string;
}

export interface PackingResult {
  placements: Placement[];
  usedArea: number;
  freeSpaces: FreeSpace[];
  efficiency: number;
  strategy: string;
  success: boolean;
}

/**
 * UNIFIED PACKING ENGINE
 * Consolidates all redundant algorithms into a single, efficient implementation
 */
export class UnifiedPackingEngine {
  private strategies: Map<string, PackingStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize all packing strategies (replaces multiple algorithm files)
   */
  private initializeStrategies(): void {
    // Bottom-Left Fill Strategy (replaces bottomLeftFill + packParts)
    this.strategies.set('bottom-left', {
      name: 'Bottom-Left Fill',
      description: 'Places parts as far down and left as possible',
      sortFunction: (parts) => parts.sort((a, b) => {
        const aArea = a.part.length * a.part.width;
        const bArea = b.part.length * b.part.width;
        if (aArea !== bArea) return bArea - aArea; // Largest first
        return Math.max(b.part.length, b.part.width) - Math.max(a.part.length, a.part.width);
      }),
      placementFunction: this.bottomLeftPlacement.bind(this)
    });

    // Best-Fit Strategy (replaces multiple findBestSpace implementations)
    this.strategies.set('best-fit', {
      name: 'Best Fit Decreasing',
      description: 'Finds the space that minimizes waste',
      sortFunction: (parts) => parts.sort((a, b) => 
        (b.part.length * b.part.width) - (a.part.length * a.part.width)
      ),
      placementFunction: this.bestFitPlacement.bind(this)
    });

    // Area-Based Strategy (replaces tryOptimalLayout area sorting)
    this.strategies.set('area-optimized', {
      name: 'Area Optimized',
      description: 'Optimizes for maximum area utilization',
      sortFunction: (parts) => parts.sort((a, b) => {
        const aArea = a.part.length * a.part.width;
        const bArea = b.part.length * b.part.width;
        const aPerimeter = 2 * (a.part.length + a.part.width);
        const bPerimeter = 2 * (b.part.length + b.part.width);
        
        if (Math.abs(aArea - bArea) < 1000) { // Similar areas
          return bPerimeter - aPerimeter; // Prefer larger perimeter
        }
        return bArea - aArea; // Area first
      }),
      placementFunction: this.areaOptimizedPlacement.bind(this)
    });

    // Mixed-Size Strategy (replaces tryOptimalLayout mixed strategy)
    this.strategies.set('mixed-size', {
      name: 'Mixed Size Optimization',
      description: 'Handles mixed part sizes efficiently',
      sortFunction: (parts) => {
        const avgArea = parts.reduce((sum, p) => sum + (p.part.length * p.part.width), 0) / parts.length;
        return parts.sort((a, b) => {
          const aArea = a.part.length * a.part.width;
          const bArea = b.part.length * b.part.width;
          
          // Prioritize smaller parts in mixed scenarios
          if (aArea < avgArea && bArea >= avgArea) return -1;
          if (bArea < avgArea && aArea >= avgArea) return 1;
          return bArea - aArea;
        });
      },
      placementFunction: this.mixedSizePlacement.bind(this)
    });
  }

  /**
   * MAIN ENTRY POINT - Replaces all redundant algorithm calls
   */
  public packParts(
    partInstances: PackingInstance[],
    stock: Stock,
    kerfThickness: number,
    requiredParts?: Part[],
    strategyNames: string[] = ['best-fit', 'bottom-left', 'area-optimized', 'mixed-size']
  ): PackingResult {
    console.log(`[UNIFIED ENGINE] Packing ${partInstances.length} parts with ${strategyNames.length} strategies`);

    let bestResult: PackingResult = {
      placements: [],
      usedArea: 0,
      freeSpaces: [{ x: 0, y: 0, width: stock.length, height: stock.width }],
      efficiency: 0,
      strategy: 'none',
      success: false
    };

    // Try each strategy and pick the best result
    for (const strategyName of strategyNames) {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        console.warn(`[UNIFIED ENGINE] Strategy '${strategyName}' not found, skipping`);
        continue;
      }

      try {
        console.log(`[UNIFIED ENGINE] Trying strategy: ${strategy.name}`);
        const result = this.executeStrategy(strategy, partInstances, stock, kerfThickness, requiredParts);

        if (result && result.success && result.efficiency > bestResult.efficiency) {
          bestResult = result;
          console.log(`[UNIFIED ENGINE] New best strategy: ${strategy.name} (${result.efficiency.toFixed(1)}% efficiency)`);
        }
      } catch (error) {
        console.error(`[UNIFIED ENGINE] Error executing strategy '${strategyName}':`, error);
        // Continue with next strategy
      }
    }

    return bestResult;
  }

  /**
   * Execute a specific packing strategy
   */
  private executeStrategy(
    strategy: PackingStrategy,
    partInstances: PackingInstance[],
    stock: Stock,
    kerfThickness: number,
    requiredParts?: Part[]
  ): PackingResult {
    try {
      const placements: Placement[] = [];
      let freeSpaces: FreeSpace[] = [{ x: 0, y: 0, width: stock.length, height: stock.width }];
      let usedArea = 0;

      // Sort parts according to strategy
      const sortedParts = strategy.sortFunction([...partInstances]);

    const context: PackingContext = {
      stock,
      kerfThickness,
      existingPlacements: placements,
      stockGrainDirection: stock.grainDirection,
      requiredParts,
      strategy: 'best-fit'
    };

    // Place each part
    for (const instance of sortedParts) {
      context.existingPlacements = placements; // Update context
      
      const result = strategy.placementFunction(instance, freeSpaces, context);
      
      if (result) {
        // Create placement
        const placement: Placement = {
          partId: instance.instanceId,
          x: result.x,
          y: result.y,
          rotated: result.rotated
        };

        // Validate placement
        const isValid = validatePlacement(
          instance.part,
          result.x,
          result.y,
          result.rotated,
          stock.length,
          stock.width,
          placements,
          kerfThickness
        );

        if (isValid) {
          placements.push(placement);
          usedArea += instance.part.length * instance.part.width;

          // Update free spaces
          freeSpaces = this.updateFreeSpaces(
            freeSpaces,
            result.spaceIndex,
            instance.part,
            result.x,
            result.y,
            result.rotated,
            kerfThickness
          );

          console.log(`[${strategy.name}] Placed ${instance.instanceId} at (${result.x},${result.y}), rotated: ${result.rotated}, score: ${result.score.toFixed(1)}`);
        } else {
          console.log(`[${strategy.name}] Placement validation failed for ${instance.instanceId}`);
        }
      } else {
        console.log(`[${strategy.name}] No suitable space found for ${instance.instanceId}`);
      }
    }

    const sheetArea = stock.length * stock.width;
    const efficiency = (usedArea / sheetArea) * 100;
    const success = placements.length === partInstances.length;

    return {
      placements,
      usedArea,
      freeSpaces,
      efficiency,
      strategy: strategy.name,
      success
    };
    } catch (error) {
      console.error(`[UNIFIED ENGINE] Error in executeStrategy for ${strategy.name}:`, error);
      // Return a safe fallback result
      return {
        placements: [],
        usedArea: 0,
        freeSpaces: [{ x: 0, y: 0, width: stock.length, height: stock.width }],
        efficiency: 0,
        strategy: strategy.name,
        success: false
      };
    }
  }

  /**
   * UNIFIED PLACEMENT FUNCTIONS (replaces multiple implementations)
   */

  private bottomLeftPlacement(
    instance: PackingInstance,
    freeSpaces: FreeSpace[],
    context: PackingContext
  ): PlacementResult | null {
    // Sort spaces by bottom-left preference
    const sortedSpaces = [...freeSpaces].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    return this.findBestSpace(instance, sortedSpaces, context, 'first-fit');
  }

  private bestFitPlacement(
    instance: PackingInstance,
    freeSpaces: FreeSpace[],
    context: PackingContext
  ): PlacementResult | null {
    return this.findBestSpace(instance, freeSpaces, context, 'best-fit');
  }

  private areaOptimizedPlacement(
    instance: PackingInstance,
    freeSpaces: FreeSpace[],
    context: PackingContext
  ): PlacementResult | null {
    // Prefer spaces that maximize area utilization
    const sortedSpaces = [...freeSpaces].sort((a, b) => {
      const aArea = a.width * a.height;
      const bArea = b.width * b.height;
      return aArea - bArea; // Smallest space first for tight packing
    });

    return this.findBestSpace(instance, sortedSpaces, context, 'best-fit');
  }

  private mixedSizePlacement(
    instance: PackingInstance,
    freeSpaces: FreeSpace[],
    context: PackingContext
  ): PlacementResult | null {
    // Use different strategies based on part size
    const partArea = instance.part.length * instance.part.width;
    const avgSpaceArea = freeSpaces.reduce((sum, s) => sum + (s.width * s.height), 0) / freeSpaces.length;

    if (partArea < avgSpaceArea * 0.3) {
      // Small part - use first-fit for speed
      return this.bottomLeftPlacement(instance, freeSpaces, context);
    } else {
      // Large part - use best-fit for efficiency
      return this.bestFitPlacement(instance, freeSpaces, context);
    }
  }

  /**
   * UNIFIED SPACE FINDING (replaces all findBestSpace implementations)
   */
  private findBestSpace(
    instance: PackingInstance,
    freeSpaces: FreeSpace[],
    context: PackingContext,
    strategy: 'first-fit' | 'best-fit'
  ): PlacementResult | null {
    const { part } = instance;
    const { kerfThickness, stockGrainDirection } = context;

    // Determine allowed orientations with STRICT grain enforcement
    const allowedOrientations = this.getAllowedOrientations(part, stockGrainDirection);
    
    let bestResult: PlacementResult | null = null;

    for (let spaceIndex = 0; spaceIndex < freeSpaces.length; spaceIndex++) {
      const space = freeSpaces[spaceIndex];

      for (const orientation of allowedOrientations) {
        const requiredWidth = orientation.width + kerfThickness;
        const requiredHeight = orientation.height + kerfThickness;

        // Check if part fits in space
        if (requiredWidth <= space.width && requiredHeight <= space.height) {
          // Check if within sheet bounds
          if (space.x + requiredWidth <= context.stock.length && 
              space.y + requiredHeight <= context.stock.width) {
            
            const score = this.calculatePlacementScore(space, orientation, part, kerfThickness);
            
            const result: PlacementResult = {
              spaceIndex,
              rotated: orientation.rotated,
              x: space.x,
              y: space.y,
              score,
              reason: `${orientation.rotated ? 'Rotated' : 'Normal'} placement in space ${spaceIndex}`
            };

            if (strategy === 'first-fit') {
              return result; // Take first valid placement
            } else if (!bestResult || score < bestResult.score) {
              bestResult = result; // Track best placement
            }
          }
        }
      }
    }

    return bestResult;
  }

  /**
   * UNIFIED GRAIN DIRECTION HANDLING (replaces multiple implementations)
   */
  private getAllowedOrientations(part: Part, stockGrainDirection?: string): Array<{width: number, height: number, rotated: boolean}> {
    if (!part.grainDirection || !stockGrainDirection) {
      // No grain constraints - allow both orientations
      return [
        { width: part.length, height: part.width, rotated: false },
        { width: part.width, height: part.length, rotated: true }
      ];
    }

    // STRICT grain enforcement - only one orientation allowed
    const requiresRotation = stockGrainDirection.toLowerCase() !== part.grainDirection.toLowerCase();
    
    if (requiresRotation) {
      return [{ width: part.width, height: part.length, rotated: true }];
    } else {
      return [{ width: part.length, height: part.width, rotated: false }];
    }
  }

  /**
   * UNIFIED SCORING SYSTEM (replaces multiple scoring implementations)
   */
  private calculatePlacementScore(
    space: FreeSpace,
    orientation: {width: number, height: number, rotated: boolean},
    part: Part,
    kerfThickness: number
  ): number {
    const widthWaste = space.width - (orientation.width + kerfThickness);
    const heightWaste = space.height - (orientation.height + kerfThickness);
    const wasteArea = widthWaste * heightWaste;

    // Lower score is better
    let score = wasteArea;

    // Position preference (bottom-left)
    score += space.y * 10 + space.x;

    // Rotation penalty (prefer non-rotated when possible)
    if (orientation.rotated) score += 1000;

    // Efficiency bonus
    const efficiency = (orientation.width * orientation.height) / (space.width * space.height);
    score -= efficiency * 10000;

    // Edge utilization bonus
    if (widthWaste < 10) score -= 500;
    if (heightWaste < 10) score -= 500;

    return score;
  }

  /**
   * UNIFIED SPACE MANAGEMENT (replaces multiple implementations)
   */
  private updateFreeSpaces(
    freeSpaces: FreeSpace[],
    usedSpaceIndex: number,
    part: Part,
    x: number,
    y: number,
    rotated: boolean,
    kerfThickness: number
  ): FreeSpace[] {
    const newSpaces = [...freeSpaces];
    const usedSpace = newSpaces[usedSpaceIndex];
    
    // Remove used space
    newSpaces.splice(usedSpaceIndex, 1);

    // Calculate part dimensions
    const partWidth = rotated ? part.width : part.length;
    const partHeight = rotated ? part.length : part.width;
    const adjustedWidth = partWidth + kerfThickness;
    const adjustedHeight = partHeight + kerfThickness;

    // Create new spaces using guillotine method
    const splitSpaces = this.splitSpace(usedSpace, adjustedWidth, adjustedHeight, x, y);
    newSpaces.push(...splitSpaces);

    // Merge adjacent spaces
    return this.mergeAdjacentSpaces(newSpaces);
  }

  private splitSpace(
    space: FreeSpace,
    partWidth: number,
    partHeight: number,
    partX: number,
    partY: number
  ): FreeSpace[] {
    const result: FreeSpace[] = [];

    // Right space
    if (space.x + space.width > partX + partWidth) {
      result.push({
        x: partX + partWidth,
        y: space.y,
        width: (space.x + space.width) - (partX + partWidth),
        height: space.height
      });
    }

    // Bottom space
    if (space.y + space.height > partY + partHeight) {
      result.push({
        x: space.x,
        y: partY + partHeight,
        width: space.width,
        height: (space.y + space.height) - (partY + partHeight)
      });
    }

    // Left space
    if (partX > space.x) {
      result.push({
        x: space.x,
        y: space.y,
        width: partX - space.x,
        height: space.height
      });
    }

    // Top space
    if (partY > space.y) {
      result.push({
        x: space.x,
        y: space.y,
        width: space.width,
        height: partY - space.y
      });
    }

    return result.filter(s => s.width > 0 && s.height > 0);
  }

  private mergeAdjacentSpaces(spaces: FreeSpace[]): FreeSpace[] {
    const merged: FreeSpace[] = [];
    const used = new Set<number>();

    for (let i = 0; i < spaces.length; i++) {
      if (used.has(i)) continue;

      let currentSpace = { ...spaces[i] };
      let mergedAny = true;

      while (mergedAny) {
        mergedAny = false;

        for (let j = i + 1; j < spaces.length; j++) {
          if (used.has(j)) continue;

          const other = spaces[j];

          // Horizontal merge
          if (currentSpace.y === other.y && 
              currentSpace.height === other.height &&
              ((currentSpace.x + currentSpace.width === other.x) || 
               (other.x + other.width === currentSpace.x))) {
            
            const newX = Math.min(currentSpace.x, other.x);
            const newWidth = currentSpace.width + other.width;
            currentSpace = { x: newX, y: currentSpace.y, width: newWidth, height: currentSpace.height };
            used.add(j);
            mergedAny = true;
          }
          // Vertical merge
          else if (currentSpace.x === other.x && 
                   currentSpace.width === other.width &&
                   ((currentSpace.y + currentSpace.height === other.y) || 
                    (other.y + other.height === currentSpace.y))) {
            
            const newY = Math.min(currentSpace.y, other.y);
            const newHeight = currentSpace.height + other.height;
            currentSpace = { x: currentSpace.x, y: newY, width: currentSpace.width, height: newHeight };
            used.add(j);
            mergedAny = true;
          }
        }
      }

      merged.push(currentSpace);
    }

    return merged;
  }
}

// Export singleton instance
export const unifiedPackingEngine = new UnifiedPackingEngine();
