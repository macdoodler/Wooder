// Advanced Cutting Optimization Engine with Aggressive Space Utilization
// Implements better packing strategies for maximum material efficiency

import { 
  Stock, Part, Placement, FreeSpace, Results, StockUsage, MaterialType,
  OptimizationPhilosophy, OptimizationWeights, DefaultOptimizationWeights 
} from './types';

// ===== CORE CUTTING OPTIMIZATION ENGINE =====

/**
 * Main cutting optimization function
 */
export function calculateOptimalCuts(
  availableStocks: Stock[],
  requiredParts: Part[],
  kerfThickness: number = 3.2,
  optimizationPhilosophy: OptimizationPhilosophy = OptimizationPhilosophy.MaximumYield,
  customWeights?: OptimizationWeights
): Results {
  console.log('🚀 Starting advanced cutting optimization');
  console.log(`Philosophy: ${optimizationPhilosophy}, Kerf: ${kerfThickness}mm`);

  const weights = customWeights || DefaultOptimizationWeights[optimizationPhilosophy];
  
  if (!availableStocks?.length) {
    return createErrorResult('No stock materials provided');
  }
  
  if (!requiredParts?.length) {
    return createErrorResult('No parts specified for cutting');
  }

  try {
    const processedStocks = processStockInventory(availableStocks, optimizationPhilosophy);
    const expandedParts = expandPartsByQuantity(requiredParts, optimizationPhilosophy);
    
    const validation = validateCompatibility(processedStocks, expandedParts);
    if (!validation.isValid) {
      return createErrorResult(`Insufficient stock: ${validation.message}`);
    }

    // Use advanced multi-sheet optimization
    const results = advancedMultiSheetOptimization(
      expandedParts, 
      processedStocks, 
      kerfThickness,
      optimizationPhilosophy,
      weights
    );
    
    const efficiency = calculateEfficiency(results.usedSheets, processedStocks);
    const cutSequences = generateCutSequences(results.usedSheets, availableStocks, requiredParts);
    
    const totalWaste = results.usedSheets.reduce((sum, sheet) => sum + sheet.wasteArea, 0);
    const isSuccess = results.unplacedParts.length === 0;
    
    console.log('\n=== OPTIMIZATION COMPLETE ===');
    console.log(`Sheets used: ${results.usedSheets.length}`);
    console.log(`Efficiency: ${efficiency.materialEfficiency.toFixed(1)}%`);
    console.log(`Parts placed: ${expandedParts.length - results.unplacedParts.length}/${expandedParts.length}`);
    
    return {
      success: isSuccess,
      message: isSuccess 
        ? `✓ Optimized: ${results.usedSheets.length} sheets, ${efficiency.materialEfficiency.toFixed(1)}% efficiency`
        : `⚠ Partial: ${results.unplacedParts.length} parts remaining`,
      stockUsage: results.usedSheets,
      totalUsedSheets: results.usedSheets.length,
      totalWaste,
      sortedParts: requiredParts,
      cutSequences
    };
    
  } catch (error: any) {
    console.error('❌ Optimization failed:', error);
    return createErrorResult(`Error: ${error.message}`);
  }
}

// ===== ADVANCED OPTIMIZATION ALGORITHM =====

/**
 * Advanced multi-sheet optimization with better packing strategies
 */
function advancedMultiSheetOptimization(
  parts: ProcessedPart[],
  stocks: ProcessedStock[],
  kerfThickness: number,
  philosophy: OptimizationPhilosophy,
  weights: OptimizationWeights
): MultiSheetResult {
  const results: MultiSheetResult = {
    usedSheets: [],
    unplacedParts: [...parts],
    totalEfficiency: 0
  };

  // Group parts by dimensions for better packing
  const partGroups = groupPartsByDimensions(results.unplacedParts);
  
  // Pre-calculate part mix for better distribution
  const partMix = calculateOptimalPartMix(results.unplacedParts, stocks[0]);
  
  while (results.unplacedParts.length > 0 && results.usedSheets.length < 50) {
    let bestSheetResult = null;
    let bestStock = null;
    let bestScore = -1;

    // Try each available stock
    for (const stock of stocks) {
      if (stock.remainingQuantity <= 0) continue;

      // Get compatible parts for this stock
      const compatibleParts = getCompatibleParts(results.unplacedParts, stock);
      if (compatibleParts.length === 0) continue;

      // Try different packing strategies
     const strategies = [
  () => packWithBestFit(compatibleParts, stock, kerfThickness, partGroups, philosophy, weights),
  () => packWithFirstFit(compatibleParts, stock, kerfThickness, philosophy, weights),  // Add weights
  () => packWithAreaSort(compatibleParts, stock, kerfThickness, philosophy, weights),   // Add weights
  () => packWithStripPacking(compatibleParts, stock, kerfThickness, philosophy, weights), // Add weights
  () => packWithMixedStrategy(compatibleParts, stock, kerfThickness, philosophy, partMix)
];

      for (const strategy of strategies) {
        const sheetResult = strategy();
        
        if (sheetResult.placements.length > 0) {
          const score = evaluateSheetResult(sheetResult, stock, philosophy, weights);
          
          if (score > bestScore) {
            bestSheetResult = sheetResult;
            bestStock = stock;
            bestScore = score;
          }
        }
      }
    }

    if (bestSheetResult && bestStock) {
      const sheetUsage: StockUsage = {
        stockIndex: bestStock.stockIndex,
        sheetId: `Sheet-${results.usedSheets.length + 1}`,
        placements: bestSheetResult.placements,
        freeSpaces: bestSheetResult.freeSpaces,
        usedArea: bestSheetResult.usedArea,
        wasteArea: (bestStock.length * bestStock.width) - bestSheetResult.usedArea
      };

      results.usedSheets.push(sheetUsage);
      bestStock.remainingQuantity--;

      // Remove placed parts
      bestSheetResult.placedPartInstances.forEach(instanceId => {
        const idx = results.unplacedParts.findIndex(p => p.instanceId === instanceId);
        if (idx >= 0) results.unplacedParts.splice(idx, 1);
      });

      const efficiency = (bestSheetResult.usedArea / (bestStock.length * bestStock.width)) * 100;
      console.log(`Sheet ${results.usedSheets.length}: ${bestSheetResult.placements.length} parts, ${efficiency.toFixed(1)}% efficiency`);
    } else {
      console.log(`Cannot place remaining ${results.unplacedParts.length} parts`);
      break;
    }
  }

  return results;
}

// ===== PACKING STRATEGIES =====

/**
 * Best-fit packing strategy - fills smallest suitable spaces first
 */
function packWithBestFit(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number,
  partGroups: Map<string, ProcessedPart[]>,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedInstances: string[] = [];
  let freeSpaces: FreeSpace[] = [{
    x: 0, y: 0,
    width: stock.length,
    height: stock.width
  }];

  // Sort parts by area (largest first)
  const sortedParts = [...parts].sort((a, b) => 
    (b.length * b.width) - (a.length * a.width)
  );

  for (const part of sortedParts) {
    const placement = findBestFitPlacement(
      part, stock, placements, freeSpaces, kerfThickness, philosophy, weights
    );
    
    if (placement) {
      placements.push(placement.placement);
      placedInstances.push(part.instanceId || `${part.partIndex}-0`);
      
      freeSpaces = updateFreeSpacesOptimized(
        freeSpaces,
        placement.spaceIndex,
        placement.placement,
        kerfThickness
      );
    }
  }

  const usedArea = calculateUsedArea(placements);
  return { placements, freeSpaces, usedArea, placedPartInstances: placedInstances };
}

/**
 * First-fit packing strategy - places parts in first available space with bottom-left priority
 */
function packWithFirstFit(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedInstances: string[] = [];
  let freeSpaces: FreeSpace[] = [{
    x: 0, y: 0,
    width: stock.length,
    height: stock.width
  }];

  // Sort parts by area for better packing
  const sortedParts = [...parts].sort((a, b) => 
    (b.length * b.width) - (a.length * a.width)
  );

  for (const part of sortedParts) {
    // Sort free spaces by position (bottom-left priority)
    freeSpaces.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 10) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });
    
    for (let i = 0; i < freeSpaces.length; i++) {
      const space = freeSpaces[i];
      const placement = tryPlaceInSpace(part, space, stock, placements, kerfThickness, philosophy, weights);
      
      if (placement) {
        placements.push(placement);
        placedInstances.push(part.instanceId || `${part.partIndex}-0`);
        
        freeSpaces = updateFreeSpacesOptimized(
          freeSpaces, i, placement, kerfThickness
        );
        break;
      }
    }
  }

  const usedArea = calculateUsedArea(placements);
  return { placements, freeSpaces, usedArea, placedPartInstances: placedInstances };
}

/**
 * Area-sorted packing - groups similar-sized parts together with special handling for narrow parts
 */
function packWithAreaSort(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedInstances: string[] = [];
  let freeSpaces: FreeSpace[] = [{
    x: 0, y: 0,
    width: stock.length,
    height: stock.width
  }];

  // Identify narrow parts (aspect ratio > 3:1)
  const narrowParts: ProcessedPart[] = [];
  const regularParts: ProcessedPart[] = [];
  
  parts.forEach(part => {
    const aspectRatio = Math.max(part.length, part.width) / Math.min(part.length, part.width);
    if (aspectRatio > 3) {
      narrowParts.push(part);
    } else {
      regularParts.push(part);
    }
  });
  
  // Sort narrow parts by length for better strip packing
  narrowParts.sort((a, b) => b.length - a.length);
  
  // Group regular parts by similar area
  const grouped = regularParts.reduce((groups, part) => {
    const area = part.length * part.width;
    const key = Math.floor(area / 50000) * 50000;
    if (!groups[key]) groups[key] = [];
    groups[key].push(part);
    return groups;
  }, {} as Record<number, ProcessedPart[]>);

  // Process regular parts first (largest to smallest)
  const sortedGroups = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  for (const groupKey of sortedGroups) {
    const groupParts = grouped[groupKey];
    
    for (const part of groupParts) {
      const placement = findBestFitPlacement(
        part, stock, placements, freeSpaces, kerfThickness, philosophy, weights
      );
      
      if (placement) {
        placements.push(placement.placement);
        placedInstances.push(part.instanceId || `${part.partIndex}-0`);
        
        freeSpaces = updateFreeSpacesOptimized(
          freeSpaces,
          placement.spaceIndex,
          placement.placement,
          kerfThickness
        );
      }
    }
  }
  
  // Then pack narrow parts in remaining spaces
  for (const part of narrowParts) {
    // Try to find tall narrow spaces first
    let bestPlacement = null;
    let bestScore = -1;
    
    for (let i = 0; i < freeSpaces.length; i++) {
      const space = freeSpaces[i];
      
      // Prefer spaces that match the part's aspect ratio
      const spaceAspect = space.height / space.width;
      const partAspect = Math.max(part.length, part.width) / Math.min(part.length, part.width);
      const aspectMatch = 1 / (1 + Math.abs(spaceAspect - partAspect));
      
      const placement = tryPlaceInSpace(part, space, stock, placements, kerfThickness, philosophy, weights);
      
      if (placement) {
        const efficiency = (placement.width * placement.height) / (space.width * space.height);
        const score = efficiency * 0.7 + aspectMatch * 0.3;
        
        if (score > bestScore) {
          bestScore = score;
          bestPlacement = { placement, spaceIndex: i };
        }
      }
    }
    
    if (bestPlacement) {
      placements.push(bestPlacement.placement);
      placedInstances.push(part.instanceId || `${part.partIndex}-0`);
      
      freeSpaces = updateFreeSpacesOptimized(
        freeSpaces,
        bestPlacement.spaceIndex,
        bestPlacement.placement,
        kerfThickness
      );
    }
  }

  const usedArea = calculateUsedArea(placements);
  return { placements, freeSpaces, usedArea, placedPartInstances: placedInstances };
}

/**
 * Strip packing strategy - creates horizontal strips with better vertical stacking
 */
function packWithStripPacking(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedInstances: string[] = [];
  
  // Group parts by height for better strip formation
  const heightGroups = new Map<number, ProcessedPart[]>();
  parts.forEach(part => {
    const height = part.width; // Height when placed horizontally
    if (!heightGroups.has(height)) heightGroups.set(height, []);
    heightGroups.get(height)!.push(part);
  });
  
  // Sort height groups by height (descending)
  const sortedHeights = Array.from(heightGroups.keys()).sort((a, b) => b - a);
  
  let currentY = 0;
  
  // Check if rotation is allowed based on grain direction
  const checkRotation = (part: ProcessedPart, rotated: boolean) => {
    if (isGrainConstrained(part, stock, philosophy, weights)) {
      return !rotated;
    }
    return true;
  };
  
  // Process each height group as a strip
  for (const stripHeight of sortedHeights) {
    const stripParts = heightGroups.get(stripHeight)!;
    
    // Check if we have room for this strip
    if (currentY + stripHeight + kerfThickness > stock.width) {
      continue;
    }
    
    let currentX = 0;
    let actualStripHeight = 0;
    
    // Place parts in this strip
    for (const part of stripParts) {
      let placed = false;
      
      for (const rotated of [false, true]) {
        if (!checkRotation(part, rotated)) continue;
        
        const width = rotated ? part.width : part.length;
        const height = rotated ? part.length : part.width;
        
        if (currentX + width + kerfThickness <= stock.length && 
            currentY + height <= stock.width) {
          const placement: Placement = {
            partId: `Part-${part.partIndex}`,
            name: part.name || `Part ${part.partIndex + 1}`,
            x: currentX,
            y: currentY,
            rotated,
            width,
            height
          };
          
          if (!hasCollisions(placement, placements, kerfThickness)) {
            placements.push(placement);
            placedInstances.push(part.instanceId || `${part.partIndex}-0`);
            currentX += width + kerfThickness;
            actualStripHeight = Math.max(actualStripHeight, height);
            placed = true;
            break;
          }
        }
      }
      
      // If part doesn't fit in current strip, try starting a new row within the strip
      if (!placed && actualStripHeight > 0) {
        const nextRowY = currentY + actualStripHeight + kerfThickness;
        if (nextRowY + part.width <= stock.width) {
          currentX = 0;
          currentY = nextRowY;
          actualStripHeight = 0;
          
          // Try placing in new row
          for (const rotated of [false, true]) {
            if (!checkRotation(part, rotated)) continue;
            
            const width = rotated ? part.width : part.length;
            const height = rotated ? part.length : part.width;
            
            if (width <= stock.length && currentY + height <= stock.width) {
              const placement: Placement = {
                partId: `Part-${part.partIndex}`,
                name: part.name || `Part ${part.partIndex + 1}`,
                x: currentX,
                y: currentY,
                rotated,
                width,
                height
              };
              
              if (!hasCollisions(placement, placements, kerfThickness)) {
                placements.push(placement);
                placedInstances.push(part.instanceId || `${part.partIndex}-0`);
                currentX += width + kerfThickness;
                actualStripHeight = height;
                break;
              }
            }
          }
        }
      }
    }
    
    // Move to next strip
    if (actualStripHeight > 0) {
      currentY += actualStripHeight + kerfThickness;
    }
  }
  
  const usedArea = calculateUsedArea(placements);
  const freeSpaces = calculateRemainingSpaces(placements, stock, kerfThickness);
  
  return { placements, freeSpaces, usedArea, placedPartInstances: placedInstances };
}

// ===== PLACEMENT HELPERS =====

/**
 * Find best-fit placement for a part
 */
function findBestFitPlacement(
  part: ProcessedPart,
  stock: ProcessedStock,
  existingPlacements: Placement[],
  freeSpaces: FreeSpace[],
  kerfThickness: number,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): OptimalPlacement | null {
  let bestPlacement: OptimalPlacement | null = null;
  let bestWaste = Infinity;

  // Check if rotation is allowed based on grain direction
  const rotationAllowed = !isGrainConstrained(part, stock, philosophy, weights);
  const rotationOptions = rotationAllowed ? [false, true] : [false];

  for (let i = 0; i < freeSpaces.length; i++) {
    const space = freeSpaces[i];
    
    for (const rotated of rotationOptions) {
      const width = rotated ? part.width : part.length;
      const height = rotated ? part.length : part.width;
      
      if (width <= space.width && height <= space.height) {
        const placement: Placement = {
          partId: `Part-${part.partIndex}`,
          name: part.name || `Part ${part.partIndex + 1}`,
          x: space.x,
          y: space.y,
          rotated,
          width,
          height
        };
        
        if (!hasCollisions(placement, existingPlacements, kerfThickness)) {
          const waste = (space.width * space.height) - (width * height);
          
          if (waste < bestWaste) {
            bestWaste = waste;
            bestPlacement = {
              placement,
              spaceIndex: i,
              wasteArea: waste,
              efficiency: (width * height) / (space.width * space.height),
              grainCompliant: true
            };
          }
        }
      }
    }
  }

  return bestPlacement;
}

/**
 * Try to place part in a specific space
 */
function tryPlaceInSpace(
  part: ProcessedPart,
  space: FreeSpace,
  stock: ProcessedStock,
  existingPlacements: Placement[],
  kerfThickness: number,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights  // Add this parameter
): Placement | null {
  // Check if rotation is allowed based on grain direction
  const rotationAllowed = !isGrainConstrained(part, stock, philosophy, weights);
  const rotationOptions = rotationAllowed ? [false, true] : [false];
  
  for (const rotated of rotationOptions) {
    const width = rotated ? part.width : part.length;
    const height = rotated ? part.length : part.width;
    
    if (width <= space.width && height <= space.height) {
      const placement: Placement = {
        partId: `Part-${part.partIndex}`,
        name: part.name || `Part ${part.partIndex + 1}`,
        x: space.x,
        y: space.y,
        rotated,
        width,
        height
      };
      
      if (!hasCollisions(placement, existingPlacements, kerfThickness)) {
        return placement;
      }
    }
  }
  
  return null;
}

/**
 * Optimized free space update with better merging
 */
function updateFreeSpacesOptimized(
  spaces: FreeSpace[],
  usedIndex: number,
  placement: Placement,
  kerfThickness: number
): FreeSpace[] {
  const newSpaces: FreeSpace[] = [];
  const usedSpace = spaces[usedIndex];
  
  // Copy all other spaces
  spaces.forEach((space, i) => {
    if (i !== usedIndex) newSpaces.push(space);
  });
  
  const partRight = placement.x + placement.width + kerfThickness;
  const partTop = placement.y + placement.height + kerfThickness;
  
  // Right space
  if (partRight < usedSpace.x + usedSpace.width) {
    newSpaces.push({
      x: partRight,
      y: usedSpace.y,
      width: (usedSpace.x + usedSpace.width) - partRight,
      height: usedSpace.height
    });
  }
  
  // Top space
  if (partTop < usedSpace.y + usedSpace.height) {
    newSpaces.push({
      x: usedSpace.x,
      y: partTop,
      width: usedSpace.width,
      height: (usedSpace.y + usedSpace.height) - partTop
    });
  }
  
  // Bottom space (if part doesn't start at space bottom)
  if (placement.y > usedSpace.y) {
    newSpaces.push({
      x: usedSpace.x,
      y: usedSpace.y,
      width: usedSpace.width,
      height: placement.y - usedSpace.y
    });
  }
  
  // Left space (if part doesn't start at space left)
  if (placement.x > usedSpace.x) {
    newSpaces.push({
      x: usedSpace.x,
      y: usedSpace.y,
      width: placement.x - usedSpace.x,
      height: usedSpace.height
    });
  }
  
  // Merge overlapping spaces
  const merged = mergeOverlappingSpaces(newSpaces);
  
  // Filter out tiny spaces - adjust threshold based on smallest part dimension
  const minDimension = 120; // Smallest part width in typical cases
  return merged.filter(s => 
    (s.width >= minDimension && s.height >= minDimension) ||
    (s.width >= minDimension && s.height >= 50) || // Allow narrow tall spaces
    (s.width >= 50 && s.height >= minDimension)    // Allow narrow wide spaces
  );
}

/**
 * Merge overlapping free spaces
 */
function mergeOverlappingSpaces(spaces: FreeSpace[]): FreeSpace[] {
  if (spaces.length <= 1) return spaces;
  
  let merged: FreeSpace[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < spaces.length; i++) {
    if (used.has(i)) continue;
    
    let current = { ...spaces[i] };
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (let j = i + 1; j < spaces.length; j++) {
        if (used.has(j)) continue;
        
        const other = spaces[j];
        
        // Check for overlap or adjacency
        if (spacesCanMerge(current, other)) {
          current = mergeSpaces(current, other);
          used.add(j);
          changed = true;
        }
      }
    }
    
    merged.push(current);
  }
  
  return merged;
}

/**
 * Check if two spaces can be merged
 */
function spacesCanMerge(a: FreeSpace, b: FreeSpace): boolean {
  // Check horizontal adjacency
  if (Math.abs(a.y - b.y) < 1 && Math.abs(a.height - b.height) < 1) {
    return Math.abs((a.x + a.width) - b.x) < 1 || Math.abs((b.x + b.width) - a.x) < 1;
  }
  
  // Check vertical adjacency
  if (Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1) {
    return Math.abs((a.y + a.height) - b.y) < 1 || Math.abs((b.y + b.height) - a.y) < 1;
  }
  
  return false;
}

/**
 * Merge two adjacent spaces
 */
function mergeSpaces(a: FreeSpace, b: FreeSpace): FreeSpace {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate remaining free spaces after all placements
 */
function calculateRemainingSpaces(
  placements: Placement[],
  stock: ProcessedStock,
  kerfThickness: number
): FreeSpace[] {
  // Start with the entire sheet
  let freeSpaces: FreeSpace[] = [{
    x: 0,
    y: 0,
    width: stock.length,
    height: stock.width
  }];
  
  // Subtract each placement
  for (const placement of placements) {
    const newSpaces: FreeSpace[] = [];
    
    for (const space of freeSpaces) {
      // Check if placement intersects this space
      if (placement.x < space.x + space.width &&
          placement.x + placement.width > space.x &&
          placement.y < space.y + space.height &&
          placement.y + placement.height > space.y) {
        
        // Split the space around the placement
        const splits = splitSpaceAroundPlacement(space, placement, kerfThickness);
        newSpaces.push(...splits);
      } else {
        // Space is unaffected
        newSpaces.push(space);
      }
    }
    
    freeSpaces = mergeOverlappingSpaces(newSpaces);
  }
  
  const minDimension = 120;
  return freeSpaces.filter(s => 
    (s.width >= minDimension && s.height >= minDimension) ||
    (s.width >= minDimension && s.height >= 50) ||
    (s.width >= 50 && s.height >= minDimension)
  );
}

/**
 * Split a space around a placement
 */
function splitSpaceAroundPlacement(
  space: FreeSpace,
  placement: Placement,
  kerfThickness: number
): FreeSpace[] {
  const spaces: FreeSpace[] = [];
  const pRight = placement.x + placement.width + kerfThickness;
  const pTop = placement.y + placement.height + kerfThickness;
  
  // Left space
  if (placement.x > space.x) {
    spaces.push({
      x: space.x,
      y: space.y,
      width: placement.x - space.x,
      height: space.height
    });
  }
  
  // Right space
  if (pRight < space.x + space.width) {
    spaces.push({
      x: pRight,
      y: space.y,
      width: (space.x + space.width) - pRight,
      height: space.height
    });
  }
  
  // Bottom space
  if (placement.y > space.y) {
    spaces.push({
      x: space.x,
      y: space.y,
      width: space.width,
      height: placement.y - space.y
    });
  }
  
  // Top space
  if (pTop < space.y + space.height) {
    spaces.push({
      x: space.x,
      y: pTop,
      width: space.width,
      height: (space.y + space.height) - pTop
    });
  }
  
  return spaces;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate optimal part mix for better distribution
 */
function calculateOptimalPartMix(parts: ProcessedPart[], stock: ProcessedStock): Map<string, number> {
  const mix = new Map<string, number>();
  const sheetArea = stock.length * stock.width;
  
  // Group parts by type
  const partTypes = new Map<string, { count: number; area: number }>();
  parts.forEach(part => {
    const key = `${part.length}x${part.width}`;
    if (!partTypes.has(key)) {
      partTypes.set(key, { count: 0, area: part.length * part.width });
    }
    partTypes.get(key)!.count++;
  });
  
  // Calculate ideal distribution
  partTypes.forEach((info, key) => {
    const partArea = info.area;
    const idealPerSheet = Math.floor(sheetArea * 0.9 / partArea); // Target 90% efficiency
    mix.set(key, Math.min(idealPerSheet, info.count));
  });
  
  return mix;
}

/**
 * Mixed strategy - combines multiple approaches for better results
 */
function packWithMixedStrategy(
  parts: ProcessedPart[],
  stock: ProcessedStock,
  kerfThickness: number,
  philosophy: OptimizationPhilosophy,
  partMix: Map<string, number>
): SheetLayoutResult {
  const placements: Placement[] = [];
  const placedInstances: string[] = [];
  let freeSpaces: FreeSpace[] = [{
    x: 0, y: 0,
    width: stock.length,
    height: stock.width
  }];
  
  // Separate narrow and regular parts
  const narrowParts: ProcessedPart[] = [];
  const regularParts: ProcessedPart[] = [];
  
  parts.forEach(part => {
    const aspectRatio = Math.max(part.length, part.width) / Math.min(part.length, part.width);
    if (aspectRatio > 3) {
      narrowParts.push(part);
    } else {
      regularParts.push(part);
    }
  });
  
  // Group regular parts by dimensions
  const partGroups = new Map<string, ProcessedPart[]>();
  regularParts.forEach(part => {
    const key = `${part.length}x${part.width}`;
    if (!partGroups.has(key)) partGroups.set(key, []);
    partGroups.get(key)!.push(part);
  });
  
  // Sort groups by area (largest first)
  const sortedGroups = Array.from(partGroups.entries())
    .sort((a, b) => {
      const aArea = parseInt(a[0].split('x')[0]) * parseInt(a[0].split('x')[1]);
      const bArea = parseInt(b[0].split('x')[0]) * parseInt(b[0].split('x')[1]);
      return bArea - aArea;
    });
  
  // First pass: Place regular parts
  for (const [key, groupParts] of sortedGroups) {
    const targetCount = partMix.get(key) || groupParts.length;
    let placed = 0;
    
    for (const part of groupParts) {
      if (placed >= targetCount) break;
      
      const placement = findBestFitPlacement(
        part, stock, placements, freeSpaces, kerfThickness, philosophy
      );
      
      if (placement) {
        placements.push(placement.placement);
        placedInstances.push(part.instanceId || `${part.partIndex}-0`);
        freeSpaces = updateFreeSpacesOptimized(
          freeSpaces, placement.spaceIndex, placement.placement, kerfThickness
        );
        placed++;
      }
    }
  }
  
  // Second pass: Pack narrow parts efficiently
  if (narrowParts.length > 0) {
    // Sort narrow parts by length
    narrowParts.sort((a, b) => b.length - a.length);
    
    // Try to create vertical columns for narrow parts
    const narrowWidth = Math.max(...narrowParts.map(p => Math.min(p.length, p.width)));
    
    for (const part of narrowParts) {
      let bestPlacement = null;
      let bestScore = -1;
      
      // Look for vertical spaces that can accommodate multiple narrow parts
      for (let i = 0; i < freeSpaces.length; i++) {
        const space = freeSpaces[i];
        
        // Check if space can fit the part
        const placement = tryPlaceInSpace(part, space, stock, placements, kerfThickness, philosophy);
        
        if (placement) {
          // Score based on how well it uses vertical space
          const verticalUtilization = placement.height / space.height;
          const horizontalWaste = (space.width - placement.width) / space.width;
          const score = verticalUtilization * 0.7 + (1 - horizontalWaste) * 0.3;
          
          if (score > bestScore) {
            bestScore = score;
            bestPlacement = { placement, spaceIndex: i };
          }
        }
      }
      
      if (bestPlacement) {
        placements.push(bestPlacement.placement);
        placedInstances.push(part.instanceId || `${part.partIndex}-0`);
        freeSpaces = updateFreeSpacesOptimized(
          freeSpaces, bestPlacement.spaceIndex, bestPlacement.placement, kerfThickness
        );
      }
    }
  }
  
  // Final pass: Fill any remaining small spaces
  const remainingParts = parts.filter(p => 
    !placedInstances.includes(p.instanceId || `${p.partIndex}-0`)
  );
  
  for (const part of remainingParts) {
    const placement = findBestFitPlacement(
      part, stock, placements, freeSpaces, kerfThickness, philosophy
    );
    
    if (placement) {
      placements.push(placement.placement);
      placedInstances.push(part.instanceId || `${part.partIndex}-0`);
      freeSpaces = updateFreeSpacesOptimized(
        freeSpaces, placement.spaceIndex, placement.placement, kerfThickness
      );
    }
  }
  
  const usedArea = calculateUsedArea(placements);
  return { placements, freeSpaces, usedArea, placedPartInstances: placedInstances };
}

/**
 * Check if a part's rotation is constrained by grain direction
 */
function isGrainConstrained(
  part: ProcessedPart,
  stock: ProcessedStock,
  philosophy?: OptimizationPhilosophy,
  weights?: OptimizationWeights
): boolean {
  // Constrain if using Grain Matching philosophy
  if (philosophy === OptimizationPhilosophy.GrainMatching) {
    return !!(part.grainDirection && stock.grainDirection);
  }
  
  // Also constrain if using Mixed Optimization with high grain weight
  if (philosophy === OptimizationPhilosophy.MixedOptimization && weights && weights.grainAlignment >= 0.8) {
    return !!(part.grainDirection && stock.grainDirection);
  }
  
  return false;
}

function hasCollisions(
  placement: Placement,
  existingPlacements: Placement[],
  kerfThickness: number
): boolean {
  for (const existing of existingPlacements) {
    const gap = kerfThickness;
    
    if (!(placement.x + placement.width + gap <= existing.x ||
          placement.x >= existing.x + existing.width + gap ||
          placement.y + placement.height + gap <= existing.y ||
          placement.y >= existing.y + existing.height + gap)) {
      return true;
    }
  }
  return false;
}

function calculateUsedArea(placements: Placement[]): number {
  return placements.reduce((sum, p) => sum + (p.width * p.height), 0);
}

function groupPartsByDimensions(parts: ProcessedPart[]): Map<string, ProcessedPart[]> {
  const groups = new Map<string, ProcessedPart[]>();
  
  for (const part of parts) {
    const key = `${part.length}x${part.width}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(part);
  }
  
  return groups;
}

function getCompatibleParts(parts: ProcessedPart[], stock: ProcessedStock): ProcessedPart[] {
  return parts.filter(part => {
    const fitsNormal = stock.length >= part.length && stock.width >= part.width;
    const fitsRotated = stock.length >= part.width && stock.width >= part.length;
    const thicknessOk = stock.thickness === part.thickness;
    const materialOk = !stock.material || !part.material || 
                      stock.material === part.material;
    
    return (fitsNormal || fitsRotated) && thicknessOk && materialOk;
  });
}

function evaluateSheetResult(
  result: SheetLayoutResult,
  stock: ProcessedStock,
  philosophy: OptimizationPhilosophy,
  weights: OptimizationWeights
): number {
  const sheetArea = stock.length * stock.width;
  const efficiency = result.usedArea / sheetArea;
  
  let score = efficiency * 1000;
  
  // Heavily penalize very low efficiency sheets (under 50%)
  if (efficiency < 0.5) {
    score *= 0.5;
  }
  
  // Bonus for high efficiency (over 70%)
  if (efficiency > 0.7) {
    score *= 1.2;
  }
  
  // Bonus for more parts placed
  score += result.placements.length * 10;
  
  // Extra bonus for very full sheets (over 90%)
  if (efficiency > 0.9) {
    score += 200;
  }
  
  if (philosophy === OptimizationPhilosophy.MinimumCuts) {
    const alignedCuts = countAlignedCuts(result.placements);
    score += alignedCuts * weights.cuttingSimplicity * 50;
  }
  
  return score;
}

function countAlignedCuts(placements: Placement[]): number {
  const xPositions = new Set<number>();
  const yPositions = new Set<number>();
  
  for (const p of placements) {
    xPositions.add(p.x);
    xPositions.add(p.x + p.width);
    yPositions.add(p.y);
    yPositions.add(p.y + p.height);
  }
  
  return xPositions.size + yPositions.size;
}

// ===== REMAINING HELPER FUNCTIONS =====

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

function processStockInventory(stocks: Stock[], philosophy: OptimizationPhilosophy): ProcessedStock[] {
  return stocks.map((stock, index) => ({
    ...stock,
    stockIndex: index,
    originalQuantity: stock.quantity || 1,
    remainingQuantity: stock.quantity || 1,
    age: 0,
    isRemnant: false
  }));
}

function expandPartsByQuantity(parts: Part[], philosophy: OptimizationPhilosophy): ProcessedPart[] {
  const expanded: ProcessedPart[] = [];
  
  parts.forEach((part, partIndex) => {
    const quantity = Math.max(1, Math.floor(part.quantity || 1));
    
    for (let i = 0; i < quantity; i++) {
      expanded.push({
        ...part,
        partIndex,
        quantity: 1,
        instanceId: `${partIndex}-${i}`,
        priority: 0,
        projectGroup: 'default'
      });
    }
  });
  
  return expanded;
}

function validateCompatibility(stocks: ProcessedStock[], parts: ProcessedPart[]): ValidationResult {
  const incompatible = parts.filter(part => {
    return !stocks.some(stock => {
      const fitsNormal = stock.length >= part.length && stock.width >= part.width;
      const fitsRotated = stock.length >= part.width && stock.width >= part.length;
      const thicknessOk = stock.thickness === part.thickness;
      
      return (fitsNormal || fitsRotated) && thicknessOk;
    });
  });

  return {
    isValid: incompatible.length === 0,
    message: incompatible.length === 0 
      ? 'All parts compatible' 
      : `${incompatible.length} parts cannot fit`
  };
}

function calculateEfficiency(usedSheets: StockUsage[], stocks: ProcessedStock[]): EfficiencyMetrics {
  if (usedSheets.length === 0) {
    return { materialEfficiency: 0, inventoryUtilization: 0 };
  }

  const totalUsedArea = usedSheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const totalSheetArea = usedSheets.reduce((sum, sheet) => {
    const stock = stocks.find(s => s.stockIndex === sheet.stockIndex);
    return sum + (stock ? stock.length * stock.width : 0);
  }, 0);

  const materialEfficiency = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
  const inventoryUtilization = stocks.length > 0 
    ? (usedSheets.length / stocks.reduce((sum, s) => sum + s.originalQuantity, 0)) * 100 
    : 0;

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
    steps: [{
      id: `${usage.sheetId}-step1`,
      stepNumber: 1,
      cutType: 'rip' as const,
      description: 'Initial cuts',
      safetyNotes: ['Wear safety equipment'],
      placements: usage.placements,
      priority: 'high' as const
    }],
    totalSteps: 1,
    estimatedTime: usage.placements.length * 2,
    safetyScore: 8,
    efficiencyScore: 7,
    recommendations: ['Measure twice, cut once']
  }));
}

// ===== TYPE DEFINITIONS =====

interface ProcessedStock extends Stock {
  stockIndex: number;
  originalQuantity: number;
  remainingQuantity: number;
  age?: number;
  isRemnant?: boolean;
}

interface ProcessedPart extends Part {
  partIndex: number;
  instanceId?: string;
  priority?: number;
  projectGroup?: string;
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