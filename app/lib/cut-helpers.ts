// Helper functions for cutting algorithm
import { 
  Stock, Part, FreeSpace, Placement, StockUsage, MaterialType 
} from "./types";
// ALGORITHM CONSOLIDATION: Use unified algorithms instead of multiple redundant implementations
import { 
  consolidatedPackParts, 
  enhancedLayoutOptimization, 
  advancedSpaceManagement 
} from "./algorithm-integration";
import { tryReorganizeSheet } from "./calculateOptimalCuts";

export const handleSheetMaterialCutting = (
  part: Part,
  stockUsage: StockUsage[],
  remainingStocks: any[],
  partIndex: number,
  inputTotalUsedSheets: number,
  availableStocks: Stock[],
  kerfThickness: number,
  splitFreeSpace: (space: FreeSpace, partWidth: number, partHeight: number, partX: number, partY: number, kerfThickness?: number) => FreeSpace[],
  requiredParts?: Part[],
  inputRemainingQuantity?: number
): { placed: boolean; remainingQuantity: number; currentErrorMessage: string | null; totalUsedSheets: number } => {
  let placed = false;
  let remainingQuantity = inputRemainingQuantity || 1;
  let currentErrorMessage: string | null = null;
  let totalUsedSheets = inputTotalUsedSheets;
  let placedInThisCall = 0;

  // Try to place in existing used sheets first
  for (const usage of stockUsage) {
    if (remainingQuantity <= 0) break;
    
    const stockDefinitionForUsage = availableStocks[usage.stockIndex];
    
    // Skip if not sheet material
    if (stockDefinitionForUsage.materialType !== MaterialType.Sheet) {
      continue;
    }
    
    // Check material compatibility for existing sheets
    if (part.material && stockDefinitionForUsage.material && 
        part.material.toLowerCase() !== stockDefinitionForUsage.material.toLowerCase()) {
      continue;
    }
    
    // Check thickness compatibility
    if (part.thickness > stockDefinitionForUsage.thickness) {
      continue;
    }

    // Try to place parts on this sheet
    let placedOnThisSheet = 0;
    const maxAttemptsPerSheet = 100;
    let attempts = 0;
    
    while (remainingQuantity > 0 && attempts < maxAttemptsPerSheet) {
      attempts++;
      
      // ALGORITHM CONSOLIDATION: Use unified packing engine instead of multiple findBestSpace implementations
      // CRITICAL FIX: Generate instance ID using global part numbering
      const currentGlobalInstanceNumber = stockUsage.reduce((count, usageItem) => {
        return count + usageItem.placements.filter(p => p.partId.startsWith(`Part-${partIndex}-`)).length;
      }, 0);
      
      const packingResult = consolidatedPackParts(
        [{ part, partIndex, instanceId: `Part-${partIndex}-${currentGlobalInstanceNumber}` }],
        stockDefinitionForUsage,
        kerfThickness,
        requiredParts
      );
      
      if (packingResult.success && packingResult.placements.length > 0) {
        const placement = packingResult.placements[0];
        
        // Find the corresponding free space that can accommodate this placement
        const spaceIndex = usage.freeSpaces.findIndex(space => 
          space.x <= placement.x && 
          space.y <= placement.y &&
          space.x + space.width >= placement.x + (placement.rotated ? part.width : part.length) &&
          space.y + space.height >= placement.y + (placement.rotated ? part.length : part.width)
        );
        
        if (spaceIndex !== -1) {
          const space = usage.freeSpaces[spaceIndex];
          const rotated = placement.rotated;
          
          // CRITICAL FIX: Count part instances GLOBALLY across all sheets, not just current sheet
          const globalPartInstanceNumber = stockUsage.reduce((count, usageItem) => {
            return count + usageItem.placements.filter(p => p.partId.startsWith(`Part-${partIndex}-`)).length;
          }, 0);
          
          usage.placements.push({
            partId: `Part-${partIndex}-${globalPartInstanceNumber}`,
            x: space.x,
            y: space.y,
            rotated,
            name: part.name || `Part-${partIndex}`
          });
          usage.usedArea += part.length * part.width;
          
          const newSpaces = splitFreeSpace(
            space,
            rotated ? part.width : part.length,
            rotated ? part.length : part.width,
            space.x,
            space.y,
            kerfThickness
          );
          
          // Replace the used space with new resulting spaces
          usage.freeSpaces.splice(spaceIndex, 1, ...newSpaces);
          
          placed = true;
          remainingQuantity--;
          placedOnThisSheet++;
          placedInThisCall++;
        } else {
          // No suitable space found
          break;
        }
      } else {
        // No more space on this sheet
        break;
      }
    }
    
    if (attempts >= maxAttemptsPerSheet) {
      console.warn(`[WARNING] Reached max attempts (${maxAttemptsPerSheet}) for sheet ${usage.sheetId}`);
    }
  }

  // Try reorganizing existing sheets if we still have remaining quantity
  if (remainingQuantity > 0) {
    for (const usage of stockUsage) {
      if (remainingQuantity <= 0) break;
      
      const stockDefinitionForUsage = availableStocks[usage.stockIndex];
      
      if (stockDefinitionForUsage.materialType !== MaterialType.Sheet) continue;
      
      // Check material and thickness compatibility
      if (part.material && stockDefinitionForUsage.material && 
          part.material.toLowerCase() !== stockDefinitionForUsage.material.toLowerCase()) {
        continue;
      }
      
      if (part.thickness > stockDefinitionForUsage.thickness) continue;

      console.log(`[REORGANIZE] Attempting to reorganize sheet ${usage.sheetId} to fit remaining parts`);
      
      const reorganizeResult = tryReorganizeSheet(
        usage.placements,
        [{ part, partIndex, quantity: remainingQuantity }],
        requiredParts || [],
        stockDefinitionForUsage,
        kerfThickness
      );
      
      if (reorganizeResult.success && reorganizeResult.placements.length > usage.placements.length) {
        // Apply the reorganization
        usage.placements = reorganizeResult.placements;
        usage.usedArea = reorganizeResult.usedArea;
        usage.freeSpaces = reorganizeResult.freeSpaces;
        
        // Count how many of the current part were placed
        let currentPartPlaced = 0;
        for (const placement of reorganizeResult.placements) {
          if (placement.partId.startsWith(`Part-${partIndex}-`)) {
            currentPartPlaced++;
          }
        }
        
        if (currentPartPlaced > 0) {
          placed = true;
          const partsToPlaceThisCall = 1;
          remainingQuantity -= partsToPlaceThisCall;
          placedInThisCall += partsToPlaceThisCall;
          console.log(`[REORGANIZE] Successfully placed ${partsToPlaceThisCall} parts using sheet reorganization`);
          break;
        }
      }
    }
  }

  // If we still have remaining quantity, try to use new sheets
  const maxNewSheets = 100;
  let newSheetsCreated = 0;
  
  while (remainingQuantity > 0 && !currentErrorMessage && newSheetsCreated < maxNewSheets) {
    let stockToUseFromRemainingIndex = -1;

    // Find a suitable stock with inventory-first approach
    const suitableStockIndex = remainingStocks.findIndex(s => 
      s.remainingQuantity > 0 &&
      part.thickness <= s.thickness &&
      ((part.length <= s.length && part.width <= s.width) || 
       (part.width <= s.length && part.length <= s.width)) &&
      (part.material ? s.material?.toLowerCase() === part.material.toLowerCase() : true) &&
      s.materialType === MaterialType.Sheet
    );

    if (suitableStockIndex !== -1) {
      stockToUseFromRemainingIndex = suitableStockIndex;
    } else if (!part.material) { 
      const fallbackStockIndex = remainingStocks.findIndex(s => 
        s.remainingQuantity > 0 && 
        part.thickness <= s.thickness &&
        ((part.length <= s.length && part.width <= s.width) || 
         (part.width <= s.length && part.length <= s.width)) &&
        s.materialType === MaterialType.Sheet
      );
      
      if (fallbackStockIndex !== -1) {
        stockToUseFromRemainingIndex = fallbackStockIndex;
      }
    }

    if (stockToUseFromRemainingIndex !== -1) {
      const stockToUse = remainingStocks[stockToUseFromRemainingIndex];
      
      if (stockToUse.remainingQuantity > 0) {
        stockToUse.remainingQuantity--;
        totalUsedSheets++;
        newSheetsCreated++;
        
        const newSheetId = `Sheet-${stockUsage.length + 1}`;
        const originalStockIndex = stockToUse.stockIndex;
        const stockDefinition = availableStocks[originalStockIndex];
        
        console.log(`[INVENTORY] Using Sheet #${newSheetId} from Stock #${originalStockIndex} (${stockToUse.remainingQuantity} remaining)`);
        
        const initialFreeSpaces: FreeSpace[] = [{
          x: 0, y: 0, width: stockDefinition.length, height: stockDefinition.width
        }];
        
        const newUsage: StockUsage = {
          sheetId: newSheetId,
          stockIndex: originalStockIndex,
          placements: [],
          usedArea: 0,
          wasteArea: 0,
          freeSpaces: initialFreeSpaces
        };
        
        stockUsage.push(newUsage);
        
        // Try to place parts on this new sheet
        let placedOnNewSheet = 0;
        const maxAttemptsPerSheet = 100;
        let attempts = 0;
        
        while (remainingQuantity > 0 && attempts < maxAttemptsPerSheet) {
          attempts++;
          
          // ALGORITHM CONSOLIDATION: Use unified packing engine
          // CRITICAL FIX: Generate instance ID using global part numbering
          const currentGlobalInstanceNumber = stockUsage.reduce((count, usage) => {
            return count + usage.placements.filter(p => p.partId.startsWith(`Part-${partIndex}-`)).length;
          }, 0);
          
          const packingResult = consolidatedPackParts(
            [{ part, partIndex, instanceId: `Part-${partIndex}-${currentGlobalInstanceNumber}` }],
            stockDefinition,
            kerfThickness,
            requiredParts
          );
          
          if (packingResult.success && packingResult.placements.length > 0) {
            const placement = packingResult.placements[0];
            
            const spaceIndex = newUsage.freeSpaces.findIndex(space => 
              space.x <= placement.x && 
              space.y <= placement.y &&
              space.x + space.width >= placement.x + (placement.rotated ? part.width : part.length) &&
              space.y + space.height >= placement.y + (placement.rotated ? part.length : part.width)
            );
            
            if (spaceIndex !== -1) {
              const space = newUsage.freeSpaces[spaceIndex];
              const rotated = placement.rotated;
              
              // CRITICAL FIX: Count part instances GLOBALLY across all sheets, not just current sheet
              const globalPartInstanceNumber = stockUsage.reduce((count, usage) => {
                return count + usage.placements.filter(p => p.partId.startsWith(`Part-${partIndex}-`)).length;
              }, 0);
              
              newUsage.placements.push({
                partId: `Part-${partIndex}-${globalPartInstanceNumber}`,
                x: space.x,
                y: space.y,
                rotated,
                name: part.name || `Part-${partIndex}`
              });
              
              newUsage.usedArea += part.length * part.width;
              
              const newSpaces = splitFreeSpace(
                space,
                rotated ? part.width : part.length,
                rotated ? part.length : part.width,
                space.x,
                space.y,
                kerfThickness
              );
              
              newUsage.freeSpaces.splice(spaceIndex, 1, ...newSpaces);
              
              placed = true;
              remainingQuantity--;
              placedOnNewSheet++;
              placedInThisCall++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        if (placedOnNewSheet === 0) {
          // Try optimal layout as fallback
          console.log(`[FALLBACK] Standard placement failed for part ${partIndex}, trying optimal layout...`);
          
          if (requiredParts) {
            // CRITICAL FIX: Calculate the correct starting instance number for this part
            const globalPartInstanceNumber = stockUsage.reduce((count, usage) => {
              return count + usage.placements.filter(p => p.partId.startsWith(`Part-${partIndex}-`)).length;
            }, 0);
            
            const remainingParts: { part: Part; quantity: number; partIndex: number }[] = [];
            remainingParts.push({
              part: part,
              quantity: 1,
              partIndex: partIndex
            });
            
            // ALGORITHM CONSOLIDATION: Use unified packing engine
            const optimalResult = enhancedLayoutOptimization(remainingParts, stockDefinition, kerfThickness);
            
            if (optimalResult.success && optimalResult.placements.length > 0) {
              console.log(`[FALLBACK SUCCESS] Optimal layout placed ${optimalResult.placements.length} parts`);
              
              // CRITICAL FIX: Don't replace existing placements, add to them with corrected part IDs
              for (const placement of optimalResult.placements) {
                if (placement.partId.startsWith(`Part-${partIndex}-`)) {
                  // Fix the part ID to use global numbering
                  const correctedPlacement = {
                    ...placement,
                    partId: `Part-${partIndex}-${globalPartInstanceNumber}`,
                    name: part.name || `Part-${partIndex}`
                  };
                  newUsage.placements.push(correctedPlacement);
                }
              }
              
              newUsage.usedArea = optimalResult.usedArea;
              newUsage.freeSpaces = optimalResult.freeSpaces;
              
              const currentPartPlaced = optimalResult.placements.filter(p => 
                p.partId.startsWith(`Part-${partIndex}-`)
              ).length;
              
              if (currentPartPlaced > 0) {
                placed = true;
                const partsToPlaceThisCall = Math.min(remainingQuantity, currentPartPlaced);
                remainingQuantity -= partsToPlaceThisCall;
                placedOnNewSheet = partsToPlaceThisCall;
                placedInThisCall += partsToPlaceThisCall;
                console.log(`[FALLBACK] Successfully placed ${partsToPlaceThisCall} parts using optimal layout`);
              } else {
                currentErrorMessage = `Part ${partIndex} (${part.length}x${part.width}) cannot fit on sheet material even with optimal layout.`;
                break;
              }
            } else {
              currentErrorMessage = `Part ${partIndex} (${part.length}x${part.width}) cannot fit on sheet material.`;
              break;
            }
          }
        }
      } else {
        currentErrorMessage = `No more inventory available for stock index ${stockToUseFromRemainingIndex}.`;
        break;
      }
    } else {
      currentErrorMessage = `No suitable sheet stock available for part ${partIndex} (${part.length}x${part.width}x${part.thickness}mm, Material: ${part.material || 'Any'}).`;
      break;
    }
  }

  return { placed, remainingQuantity, currentErrorMessage, totalUsedSheets };
};

export const handleDimensionalLumberCutting = (
  part: Part,
  stockUsage: StockUsage[],
  remainingStocks: any[],
  partIndex: number,
  inputTotalUsedSheets: number,
  availableStocks: Stock[],
  kerfThickness: number,
  inputRemainingQuantity?: number
): { placed: boolean; remainingQuantity: number; currentErrorMessage: string | null; totalUsedSheets: number } => {
  let placed = false;
  let remainingQuantity = inputRemainingQuantity || 1;
  let currentErrorMessage: string | null = null;
  let totalUsedSheets = inputTotalUsedSheets;

  while (remainingQuantity > 0 && !currentErrorMessage) {
    const suitableStockIndex = remainingStocks.findIndex(s => 
      s.remainingQuantity > 0 &&
      s.materialType === MaterialType.Dimensional &&
      s.width === part.width &&
      s.thickness === part.thickness &&
      s.length >= part.length &&
      (part.material ? s.material?.toLowerCase() === part.material.toLowerCase() : true)
    );

    if (suitableStockIndex !== -1) {
      const stockToUse = remainingStocks[suitableStockIndex];
      const availableLength = stockToUse.length;
      const partLength = part.length;
      
      // Calculate how many parts can fit in this piece of lumber
      const partsPerPiece = Math.floor(availableLength / (partLength + kerfThickness));
      const actualPartsToPlace = Math.min(remainingQuantity, partsPerPiece);
      
      if (actualPartsToPlace > 0 && stockToUse.remainingQuantity > 0) {
        stockToUse.remainingQuantity--;
        totalUsedSheets++;
        
        const newSheetId = `Lumber-${stockUsage.length + 1}`;
        const originalStockIndex = stockToUse.stockIndex;
        
        console.log(`[LUMBER] Using ${newSheetId} from Stock #${originalStockIndex}, placing ${actualPartsToPlace} parts`);
        
        const newUsage: StockUsage = {
          sheetId: newSheetId,
          stockIndex: originalStockIndex,
          placements: [],
          usedArea: actualPartsToPlace * part.length * part.width,
          wasteArea: 0,
          freeSpaces: []
        };
        
        // Place parts along the length of the lumber
        let currentPosition = 0;
        for (let i = 0; i < actualPartsToPlace; i++) {
          newUsage.placements.push({
            partId: `Part-${partIndex}-${i}`,
            x: currentPosition,
            y: 0,
            rotated: false,
            name: part.name || `Part-${partIndex}`
          });
          
          currentPosition += partLength + kerfThickness;
          remainingQuantity--;
        }
        
        stockUsage.push(newUsage);
        placed = true;
      } else {
        currentErrorMessage = `Not enough quantity of dimensional lumber available.`;
      }
    } else {
      currentErrorMessage = `Not enough suitable dimensional lumber to fit part ${partIndex}.`;
      break;
    }
  }
  
  return { placed, remainingQuantity, currentErrorMessage, totalUsedSheets };
};

// Helper function to validate grain orientation
export function validateGrainOrientation(part: Part, space: any): boolean {
  if (!part.grainDirection) return true;

  const isGrainAligned =
    (part.grainDirection === 'horizontal' && part.width <= space.width && part.length <= space.length) ||
    (part.grainDirection === 'vertical' && part.length <= space.width && part.width <= space.length);

  return isGrainAligned;
}

// Helper function to validate placement - required by unified packing engine
export function validatePlacement(
  part: Part,
  x: number,
  y: number,
  rotated: boolean,
  stockLength: number,
  stockWidth: number,
  existingPlacements: Placement[] = [],
  kerfThickness: number = 0
): boolean {
  const partWidth = rotated ? part.length : part.width;
  const partHeight = rotated ? part.width : part.length;
  
  // Check bounds
  if (x < 0 || y < 0 || x + partWidth > stockLength || y + partHeight > stockWidth) {
    return false;
  }
  
  // Check for overlaps with existing placements
  for (const existing of existingPlacements) {
    const existingPartWidth = existing.rotated ? part.length : part.width;
    const existingPartHeight = existing.rotated ? part.width : part.length;
    
    // Check if rectangles overlap (with kerf consideration)
    const noOverlap = 
      x >= existing.x + existingPartWidth + kerfThickness ||
      existing.x >= x + partWidth + kerfThickness ||
      y >= existing.y + existingPartHeight + kerfThickness ||
      existing.y >= y + partHeight + kerfThickness;
    
    if (!noOverlap) {
      return false;
    }
  }
  
  return true;
}
