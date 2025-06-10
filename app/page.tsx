'use client';

import React, { useState, useEffect } from "react";
import { 
  fetchCalculations, 
  createCalculation, 
  updateCalculation, 
  deleteCalculation,
  deleteAllCalculations,
  fetchWarehouseStock,
  updateWarehouseStockItem // Added import
} from "./lib/api";
import { 
  SavedCalculation, 
  Stock, 
  Part, 
  FreeSpace, 
  Placement, 
  StockUsage, 
  Results,
  MaterialType,
  formatDimensions,
  createDimensionKey
} from "./lib/types";
import { handleSheetMaterialCutting, handleDimensionalLumberCutting } from "./lib/cut-helpers";
import { calculateOptimalCuts as calculateOptimalCutsExternal } from "./lib/calculateOptimalCuts";
import Link from "next/link";

// Add a warning to display placed/required count in the summary panel
type SummaryPanelProps = {
  placedPartsCount: Record<string, number>;
  requiredParts: Part[];
};

const SummaryPanel: React.FC<SummaryPanelProps> = ({ placedPartsCount, requiredParts }) => {
  return (
    <div className="summary-panel">
      <h3>Summary</h3>
      {requiredParts.map((part, index) => {
        const key = createDimensionKey(part);
        const placedCount = placedPartsCount[key] || 0;
        return (
          <div key={index} className="summary-item">
            <span>Part {index + 1}: {formatDimensions(part)}</span>
            <span>Placed: {placedCount} / Required: {part.quantity}</span>
            {placedCount > part.quantity && (
              <span className="warning">Warning: Extra parts placed!</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Add color assignment function before the main component
const getPartColor = (partIndex: number) => {
  const colors = [
    { border: 'border-blue-700', bg: 'bg-blue-200' },
    { border: 'border-red-700', bg: 'bg-red-200' },
    { border: 'border-green-700', bg: 'bg-green-200' },
    { border: 'border-yellow-700', bg: 'bg-yellow-200' },
    { border: 'border-purple-700', bg: 'bg-purple-200' },
    { border: 'border-pink-700', bg: 'bg-pink-200' },
    { border: 'border-indigo-700', bg: 'bg-indigo-200' },
    { border: 'border-orange-700', bg: 'bg-orange-200' },
    { border: 'border-teal-700', bg: 'bg-teal-200' },
    { border: 'border-cyan-700', bg: 'bg-cyan-200' },
    { border: 'border-lime-700', bg: 'bg-lime-200' },
    { border: 'border-rose-700', bg: 'bg-rose-200' }
  ];
  return colors[partIndex % colors.length];
};

export default function Home() {
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [kerfThickness, setKerfThickness] = useState(0);
  const [availableStocks, setAvailableStocks] = useState<Stock[]>([]);
  const [requiredParts, setRequiredParts] = useState<Part[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCalcId, setCurrentCalcId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseStock, setWarehouseStock] = useState<Stock[]>([]);
  const [useWarehouseStock, setUseWarehouseStock] = useState(false);
  const [resultsAreFreshForDeduction, setResultsAreFreshForDeduction] = useState(false); // New state
  const [cutStatus, setCutStatus] = useState<{ [placementKey: string]: boolean }>({}); // Track cut status
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes

  // Load saved calculations and warehouse stock from database on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [calculations, stock] = await Promise.all([
          fetchCalculations(),
          fetchWarehouseStock()
        ]);
        setSavedCalculations(calculations);
        setWarehouseStock(stock);
      } catch (error) {
        console.error("Error loading data:", error);
        // Consider setting an error message for the user here
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Reset resultsAreFreshForDeduction if results become null
  useEffect(() => {
    if (results === null) {
      setResultsAreFreshForDeduction(false);
    }
  }, [results]);

  // Reset resultsAreFreshForDeduction if inputs change that would require recalculation
  useEffect(() => {
    setResultsAreFreshForDeduction(false);
  }, [availableStocks, requiredParts, kerfThickness, planName, description, useWarehouseStock]);

  // Track unsaved changes - mark as unsaved when form data changes
  useEffect(() => {
    if (isEditing && currentCalcId) {
      // Only check for changes if we're editing an existing calculation
      const currentCalculation = savedCalculations.find(calc => calc.id === currentCalcId);
      if (currentCalculation) {
        const hasFormChanges = 
          planName !== currentCalculation.name ||
          description !== (currentCalculation.description || "") ||
          kerfThickness !== currentCalculation.kerfThickness ||
          JSON.stringify(availableStocks) !== JSON.stringify(currentCalculation.availableStocks) ||
          JSON.stringify(requiredParts) !== JSON.stringify(currentCalculation.requiredParts) ||
          JSON.stringify(results) !== JSON.stringify(currentCalculation.results);
        
        setHasUnsavedChanges(hasFormChanges);
      }
    } else if (!isEditing && (planName || description || kerfThickness || availableStocks.length > 0 || requiredParts.length > 0)) {
      // Mark as having unsaved changes if we have data but haven't saved yet
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [planName, description, kerfThickness, availableStocks, requiredParts, results, isEditing, currentCalcId, savedCalculations]);

  // Add browser warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  const handleUseWarehouseStock = () => {
    if (warehouseStock.length === 0) {
      setErrorMessage("No warehouse stock available. Please add stock in the Warehouse page first.");
      return;
    }
    const stockFromWarehouse = warehouseStock.map(item => ({
      length: item.length,
      width: item.width,
      thickness: item.thickness,
      quantity: item.quantity,
      material: item.material,
      materialType: item.materialType || MaterialType.Sheet, // Use the warehouse material type or default to sheet
      grainDirection: item.grainDirection, // Include grain direction
      id: item.id 
    }));
    setAvailableStocks(stockFromWarehouse);
    setUseWarehouseStock(true);
  };

  const resetForm = () => {
    setPlanName("");
    setDescription("");
    setKerfThickness(0);
    setAvailableStocks([]);
    setRequiredParts([]);
    setResults(null);
    setCurrentCalcId(null);
    setIsEditing(false);
    setErrorMessage(null);
    setUseWarehouseStock(false);
    setHasUnsavedChanges(false); // Clear unsaved changes flag
  };

  const addStock = () => {
    setAvailableStocks([
      ...availableStocks,
      { 
        length: 0, 
        width: 0, 
        thickness: 0, 
        quantity: 1, 
        material: "",
        materialType: MaterialType.Sheet, // Default to sheet material
        grainDirection: "" // Default empty grain direction for sheet materials
      }
    ]);
  };

// Replace your updateStock function with this:
const updateStock = (index: number, field: keyof Stock, value: number | string) => {
  const updatedStocks = [...availableStocks];
  
  // Handle numeric fields to prevent NaN
  if (typeof value === 'string' && ['length', 'width', 'thickness', 'quantity'].includes(field)) {
    const numValue = parseFloat(value);
    (updatedStocks[index] as any)[field] = isNaN(numValue) ? 0 : numValue;
  } else {
    (updatedStocks[index] as any)[field] = value;
  }
  
  // If changing material type to dimensional, clear the grain direction
  if (field === 'materialType' && value === MaterialType.Dimensional) {
    (updatedStocks[index] as any)['grainDirection'] = '';
  }
  
  setAvailableStocks(updatedStocks);
  
  // Auto-recalculate if grain direction changes and we have results
  if (field === 'grainDirection' && results && planName && updatedStocks.length > 0 && requiredParts.length > 0) {
    console.log('Auto-recalculating due to stock grain direction change:', value);
    setTimeout(() => calculateOptimalCuts(), 100); // Small delay to ensure state is updated
  }
};


  const deleteStock = (index: number): void => {
    setAvailableStocks(availableStocks.filter((_, i) => i !== index));
  };

  const addPart = () => {
    setRequiredParts([
      ...requiredParts,
      { 
        length: 0, 
        width: 0, 
        thickness: 0, 
        quantity: 1, 
        material: "",
        materialType: MaterialType.Sheet, // Default to sheet material
        grainDirection: "", // Default empty grain direction for sheet materials
        name: "" // Default empty name
      }
    ]);
  };

  // Replace your updatePart function with this:
const updatePart = (index: number, field: keyof Part, value: number | string) => {
  const updatedParts = [...requiredParts];

 // Handle numeric fields to prevent NaN
  if (typeof value === 'string' && ['length', 'width', 'thickness', 'quantity'].includes(field)) {
    const numValue = parseFloat(value);
    (updatedParts[index] as any)[field] = isNaN(numValue) ? 0 : numValue;
  } else {
    (updatedParts[index] as any)[field] = value;
  }
  
  // If changing material type to dimensional, clear the grain direction
  if (field === 'materialType' && value === MaterialType.Dimensional) {
    (updatedParts[index] as any)['grainDirection'] = '';
  }
  
  setRequiredParts(updatedParts);
  
  // Auto-recalculate if grain direction changes and we have results
  if (field === 'grainDirection' && results && planName && availableStocks.length > 0 && updatedParts.length > 0) {
    console.log('Auto-recalculating due to part grain direction change:', value);
    setTimeout(() => calculateOptimalCuts(), 100); // Small delay to ensure state is updated
  }
};

  const deletePart = (index: number): void => {
    setRequiredParts(requiredParts.filter((_, i) => i !== index));
  };

  const validateInputs = (): boolean => {
    // Reset error message
    setErrorMessage(null);

    // Check if plan has a name
    if (!planName.trim()) {
      setErrorMessage("Please provide a name for the calculation plan.");
      return false;
    }

    // Check if we have stocks and parts defined
    if (availableStocks.length === 0) {
      setErrorMessage("Please add at least one stock sheet");
      return false;
    }

    if (requiredParts.length === 0) {
      setErrorMessage("Please add at least one required part");
      return false;
    }

    // Check if all values are valid numbers
    for (const stock of availableStocks) {
      if (stock.length <= 0 || stock.width <= 0 || stock.thickness <= 0 || stock.quantity <= 0) {
        setErrorMessage("All stock dimensions and quantities must be positive numbers.");
        return false;
      }
    }

    for (const part of requiredParts) {
      if (part.length <= 0 || part.width <= 0 || part.thickness <= 0 || part.quantity <= 0) {
        setErrorMessage("All part dimensions and quantities must be positive numbers.");
        return false;
      }
    }

    // Check if parts can fit in any stock with compatible thickness and material type
    for (const part of requiredParts) {
      const canFit = availableStocks.some(stock => 
        (
          // Check dimensions
          ((part.length <= stock.length && part.width <= stock.width) || 
           (part.width <= stock.length && part.length <= stock.width)) &&
          // Check thickness
          part.thickness <= stock.thickness &&
          // Check material type compatibility
          (!part.materialType || !stock.materialType || part.materialType === stock.materialType)
        )
      );
      
      if (!canFit) {
        if (part.materialType && !availableStocks.some(stock => stock.materialType === part.materialType)) {
          setErrorMessage(`Part (${part.length}x${part.width}) requires ${part.materialType} material but no compatible stock available`);
        } else if (availableStocks.some(stock => part.thickness <= stock.thickness)) {
          setErrorMessage(`Part (${part.length}x${part.width}) is too large to fit in any available stock`);
        } else {
          setErrorMessage(`Part (${part.length}x${part.width}x${part.thickness}mm) requires thicker stock material`);
        }
        return false;
      }
      
      // If material is specified for the part, check if we have compatible stock
      if (part.material) {
        const hasCompatibleMaterial = availableStocks.some(stock =>
          stock.material?.toLowerCase() === part.material?.toLowerCase() &&
          ((part.length <= stock.length && part.width <= stock.width) || 
           (part.width <= stock.length && part.length <= stock.width)) &&
          part.thickness <= stock.thickness &&
          // Check material type compatibility
          (!part.materialType || !stock.materialType || part.materialType === stock.materialType)
        );
        
        if (!hasCompatibleMaterial) {
          setErrorMessage(`No compatible ${part.material} stock available for part (${part.length}x${part.width}x${part.thickness}mm)`);
          return false;
        }
      }
    }
    
    return true;
  };

  // Helper function to find best matching space for a part with enhanced grain direction logic
  const findBestSpace = (
    part: Part, 
    freeSpaces: FreeSpace[], 
    strategy: 'best-fit' | 'first-fit' = 'best-fit',
    kerfThickness: number = 0,
    sheetLength?: number,
    sheetWidth?: number,
    existingPlacements: any[] = [],
    requiredParts?: Part[],
    stockGrainDirection?: string
  ): { spaceIndex: number; rotated: boolean } | null => {

    // Helper function to determine if a placement results in grain alignment
    const isGrainAligned = (rotated: boolean): boolean => {
      if (!stockGrainDirection || !part.grainDirection) {
        return true; // No grain constraints
      }
      
      // Logic: grain is aligned when:
      // - Stock and part grain match AND part is not rotated
      // - Stock and part grain differ AND part is rotated
      return (stockGrainDirection === part.grainDirection && !rotated) || 
             (stockGrainDirection !== part.grainDirection && rotated);
    };

    // Helper function to check if a rotation is allowed for this part
    const isRotationAllowed = (rotated: boolean): boolean => {
      // If part has no grain direction, rotation is always allowed
      if (!part.grainDirection) {
        return true;
      }
      
      // STRICT GRAIN DIRECTION ENFORCEMENT
      // If both part and stock have grain direction specified, enforce strict compliance
      if (part.grainDirection && stockGrainDirection) {
        // Only allow the orientation that keeps grain aligned
        // For matching grain directions: only allow non-rotated placement
        // For different grain directions: only allow rotated placement
        const requiresRotation = stockGrainDirection.toLowerCase() !== part.grainDirection.toLowerCase();
        return rotated === requiresRotation;
      }
      
      // Fallback: if only part has grain direction, allow any orientation
      return true;
    };

    // Helper function to validate placement doesn't conflict with existing placements
    const validatePlacementConflicts = (x: number, y: number, width: number, height: number): boolean => {
      // Check for exact duplicate positions
      for (const existing of existingPlacements) {
        if (existing.x === x && existing.y === y) {
          console.warn(`Duplicate position detected at (${x}, ${y}) - skipping this placement`);
          return false;
        }
        
        // Check for overlapping rectangles
        const partIndex = parseInt(existing.partId.split('-')[1]);
        if (partIndex >= 0 && requiredParts && partIndex < requiredParts.length) {
          const existingPart = requiredParts[partIndex];
          const existingWidth = existing.rotated ? existingPart.width : existingPart.length;
          const existingHeight = existing.rotated ? existingPart.length : existingPart.width;
          
          if (rectanglesOverlap(
            {x, y, width: width + kerfThickness, height: height + kerfThickness},
            {x: existing.x, y: existing.y, width: existingWidth + kerfThickness, height: existingHeight + kerfThickness}
          )) {
            console.warn(`Overlap detected between new placement (${x}, ${y}) and existing at (${existing.x}, ${existing.y}) - skipping`);
            return false;
          }
        }
      }
      return true;
    };

    console.log(`[GRAIN LOGIC] Part grain: ${part.grainDirection || 'None'}, Stock grain: ${stockGrainDirection || 'None'}`);

    // Try grain-aligned placements first, then fall back to any available space
    const placementOptions = [];
    
    // Check all possible placements and sort by grain alignment preference
    for (let i = 0; i < freeSpaces.length; i++) {
      const space = freeSpaces[i];
      
      // STRICT GRAIN DIRECTION ENFORCEMENT: Determine the ONLY allowed orientation
      let allowedOrientations = [];
      
      if (!part.grainDirection || !stockGrainDirection) {
        // No grain constraints - try both orientations
        allowedOrientations = [
          { rotated: false, required: false },
          { rotated: true, required: false }
        ];
      } else {
        // STRICT: Only one orientation is allowed
        const requiresRotation = stockGrainDirection.toLowerCase() !== part.grainDirection.toLowerCase();
        allowedOrientations = [
          { rotated: requiresRotation, required: true }
        ];
        console.log(`[STRICT GRAIN] Part grain: ${part.grainDirection}, Stock grain: ${stockGrainDirection}, Required rotation: ${requiresRotation}`);
      }
      
      // Check only the allowed orientations
      for (const orientation of allowedOrientations) {
        const { rotated } = orientation;
        const partWidth = rotated ? part.width : part.length;
        const partHeight = rotated ? part.length : part.width;
        
        // Check if part fits in this orientation
        if (partWidth + kerfThickness <= space.width && partHeight + kerfThickness <= space.height) {
          // Validate placement conflicts
          if (validatePlacementConflicts(space.x, space.y, partWidth, partHeight)) {
            const widthWaste = space.width - (partWidth + kerfThickness);
            const heightWaste = space.height - (partHeight + kerfThickness);
            const waste = widthWaste * heightWaste;
            const grainAligned = isGrainAligned(rotated);
            
            placementOptions.push({
              spaceIndex: i,
              rotated,
              waste,
              grainAligned
            });
            
            console.log(`[GRAIN LOGIC] ${rotated ? 'Rotated' : 'Normal'} orientation possible - grain aligned: ${grainAligned}, space: ${i}`);
          }
        } else if (orientation.required) {
          console.log(`[STRICT GRAIN] Required orientation (rotated: ${rotated}) doesn't fit in space ${i}`);
        }
      }
    }

    if (placementOptions.length === 0) {
      console.log(`[GRAIN LOGIC] No valid placements found`);
      return null;
    }

    // Sort by grain alignment first, then by waste (best-fit) or order (first-fit)
    if (strategy === 'first-fit') {
      // For first-fit, prioritize grain-aligned options first, then take the first available
      placementOptions.sort((a, b) => {
        if (a.grainAligned !== b.grainAligned) {
          return b.grainAligned ? 1 : -1; // Grain-aligned options first
        }
        return a.spaceIndex - b.spaceIndex; // Then by order
      });
    } else {
      // For best-fit, prioritize grain-aligned options first, then by waste
      placementOptions.sort((a, b) => {
        if (a.grainAligned !== b.grainAligned) {
          return b.grainAligned ? 1 : -1; // Grain-aligned options first
        }
        return a.waste - b.waste; // Then by waste (ascending)
      });
    }

    const selectedOption = placementOptions[0];
    console.log(`[GRAIN LOGIC] Selected placement - Rotated: ${selectedOption.rotated}, Grain Aligned: ${selectedOption.grainAligned}, Waste: ${selectedOption.waste}`);
    
    return {
      spaceIndex: selectedOption.spaceIndex,
      rotated: selectedOption.rotated
    };
  };

  // Helper function to check if two rectangles overlap
  const rectanglesOverlap = (
    rect1: {x: number, y: number, width: number, height: number},
    rect2: {x: number, y: number, width: number, height: number}
  ): boolean => {
    // Check if one rectangle is to the left of the other
    if (rect1.x + rect1.width <= rect2.x || rect2.x + rect2.width <= rect1.x) {
      return false;
    }
    
    // Check if one rectangle is above the other
    if (rect1.y + rect1.height <= rect2.y || rect2.y + rect2.height <= rect1.y) {
      return false;
    }
    
    // If neither of the above is true, the rectangles overlap
    return true;
  };

  // Helper function to subtract a rectangle from another and return resulting free spaces
  const subtractRectangle = (
    original: FreeSpace,
    subtracted: {x: number, y: number, width: number, height: number}
  ): FreeSpace[] => {
    // If they don't overlap, return the original space
    if (!rectanglesOverlap(original, subtracted)) {
      return [original];
    }
    
    const result: FreeSpace[] = [];
    
    // Check if there's space to the right of the subtracted rectangle
    if (original.x + original.width > subtracted.x + subtracted.width) {
      result.push({
        x: subtracted.x + subtracted.width,
        y: original.y,
        width: (original.x + original.width) - (subtracted.x + subtracted.width),
        height: original.height
      });
    }
    
    // Check if there's space to the left of the subtracted rectangle
    if (subtracted.x > original.x) {
      result.push({
        x: original.x,
        y: original.y,
        width: subtracted.x - original.x,
        height: original.height
      });
    }
    
    // Check if there's space above the subtracted rectangle
    if (subtracted.y > original.y) {
      result.push({
        x: original.x,
        y: original.y,
        width: original.width,
        height: subtracted.y - original.y
      });
    }
    
    // Check if there's space below the subtracted rectangle
    if (original.y + original.height > subtracted.y + subtracted.height) {
      result.push({
        x: original.x,
        y: subtracted.y + subtracted.height,
        width: original.width,
        height: (original.y + original.height) - (subtracted.y + subtracted.height)
      });
    }
    
    // Filter out any spaces that are too small or have invalid dimensions
    return result.filter(space => space.width > 0 && space.height > 0);
  };

  // Helper function to split free space after placing a part
  const splitFreeSpace = (
    space: FreeSpace,
    partWidth: number,
    partHeight: number,
    partX: number,
    partY: number,
    kerfThickness?: number
  ): FreeSpace[] => {
    const result: FreeSpace[] = [];

    // Use the provided kerf or fall back to the component's kerfThickness
    const actualKerfThickness = kerfThickness !== undefined ? kerfThickness : 0;

    // Adjust part dimensions to include kerf
    const adjustedWidth = partWidth + actualKerfThickness;
    const adjustedHeight = partHeight + actualKerfThickness;

    // Right space
    if (space.x + space.width > partX + adjustedWidth) {
      result.push({
        x: partX + adjustedWidth,
        y: space.y,
        width: (space.x + space.width) - (partX + adjustedWidth),
        height: space.height
      });
    }

    // Bottom space
    if (space.y + space.height > partY + adjustedHeight) {
      result.push({
        x: space.x,
        y: partY + adjustedHeight,
        width: space.width,
        height: (space.y + space.height) - (partY + adjustedHeight)
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

    // Filter out invalid or zero-area spaces
    return result.filter(space => space.width > 0 && space.height > 0);
  };

  // Calculate optimal cuts using the inventory-optimized algorithm
  const calculateOptimalCuts = () => {
    if (!validateInputs()) {
      return;
    }
    
    // Reset cut status when starting new calculation
    setCutStatus({});
    
    setIsLoading(true);
    setResultsAreFreshForDeduction(false); 
    
    try {
      console.log('=== STARTING INVENTORY-OPTIMIZED CALCULATION ===');
      console.log('Available stocks:', availableStocks);
      console.log('Required parts:', requiredParts);
      console.log('Kerf thickness:', kerfThickness);
      
      // Use the optimized inventory-first algorithm
      const results = calculateOptimalCutsExternal(availableStocks, requiredParts, kerfThickness);
      
      if (results.success) {
        console.log('✓ Calculation completed successfully');
        console.log('Results:', results);
        setResults(results);
        setErrorMessage(null);

        // If warehouse stock was used and calculation is successful, mark results as fresh for deduction
        if (useWarehouseStock && results.stockUsage && results.stockUsage.length > 0) {
          setResultsAreFreshForDeduction(true);
        }
      } else {
        console.log('✗ Calculation failed:', results.message);
        setErrorMessage(results.message || "Calculation failed");
        setResults(null);
        setResultsAreFreshForDeduction(false);
      }

    } catch (error: any) {
      console.error("Error calculating cuts:", error);
      setErrorMessage(error.message || "An error occurred during calculation");
      setResults(null); 
      setResultsAreFreshForDeduction(false);
    } finally {
      setIsLoading(false);
    }
  };



  // Save or update a calculation
  const saveCalculation = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    let calculationSavedSuccessfully = false;
    
    try {
      const timestamp = Date.now();
      
      const calculationToSave: SavedCalculation = {
        id: currentCalcId || `calc-${timestamp}`,
        name: planName,
        description,
        kerfThickness,
        availableStocks,
        requiredParts,
        results, 
        dateCreated: isEditing && currentCalcId ? (savedCalculations.find(c => c.id === currentCalcId)?.dateCreated || timestamp) : timestamp,
        dateModified: timestamp
      };

      if (isEditing && currentCalcId) {
        const success = await updateCalculation(calculationToSave);
        if (success) {
          const updatedCalculations = savedCalculations.map(calc => 
            calc.id === currentCalcId ? calculationToSave : calc
          );
          setSavedCalculations(updatedCalculations);
          alert("Calculation updated successfully!");
          calculationSavedSuccessfully = true;
          setHasUnsavedChanges(false); // Clear unsaved changes flag
        } else {
          alert("Failed to update calculation. Please try again.");
        }
      } else {
        const success = await createCalculation(calculationToSave);
        if (success) {
          setSavedCalculations([...savedCalculations, calculationToSave]);
          setCurrentCalcId(calculationToSave.id); // Set current ID for the new save
          setIsEditing(true); // Now we are editing this newly saved calculation
          alert("Calculation saved successfully!");
          calculationSavedSuccessfully = true;
          setHasUnsavedChanges(false); // Clear unsaved changes flag
        } else {
          alert("Failed to save calculation. Please try again.");
        }
      }

      // Perform warehouse stock deduction
      if (calculationSavedSuccessfully && resultsAreFreshForDeduction && useWarehouseStock && results && results.success && results.stockUsage && results.stockUsage.length > 0) {
        const currentServerWarehouseStock: Stock[] = await fetchWarehouseStock();
        const warehouseItemsToUpdateDetails = new Map<string, { originalItem: Stock, quantityToDeduct: number }>();

        // Count the number of usages per stock sheet type
        // This ensures we correctly track how many of each stock sheet are actually used
        const stockUsageCounts = new Map<number, number>();
        for (const usage of results.stockUsage) {
          const stockIndex = usage.stockIndex;
          stockUsageCounts.set(stockIndex, (stockUsageCounts.get(stockIndex) || 0) + 1);
        }
        
        // Update warehouse items based on usage counts
        for (const [stockIndex, usageCount] of stockUsageCounts.entries()) {
          const stockSheetDefinition = availableStocks[stockIndex];
          
          if (stockSheetDefinition.id) { 
            const actualWarehouseItem = currentServerWarehouseStock.find(s => s.id === stockSheetDefinition.id);
            
            if (actualWarehouseItem) {
              let details = warehouseItemsToUpdateDetails.get(stockSheetDefinition.id);
              if (!details) {
                details = { originalItem: { ...actualWarehouseItem }, quantityToDeduct: 0 };
                warehouseItemsToUpdateDetails.set(stockSheetDefinition.id, details);
              }
              details.quantityToDeduct += usageCount; 
            } else {
              console.warn(`Warehouse item with ID ${stockSheetDefinition.id} used in calculation but not found in current server stock. Skipping deduction for this item.`);
            }
          }
        }

        const updatePromises = [];
        for (const [itemId, { originalItem, quantityToDeduct }] of warehouseItemsToUpdateDetails.entries()) {
          if (quantityToDeduct > 0) {
            const newQuantity = Math.max(0, originalItem.quantity - quantityToDeduct);
            if (originalItem.quantity !== newQuantity) {
              const itemToUpdate: Stock = { ...originalItem, quantity: newQuantity };
              updatePromises.push(updateWarehouseStockItem(itemToUpdate));
            }
          }
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          const latestWarehouseStock = await fetchWarehouseStock(); 
          setWarehouseStock(latestWarehouseStock); 
          alert("Warehouse stock quantities have been updated based on the calculation.");
        }
        setResultsAreFreshForDeduction(false); 
      } else if (calculationSavedSuccessfully && resultsAreFreshForDeduction) {
        setResultsAreFreshForDeduction(false);
      }

    } catch (error: any) {
      console.error("Error saving calculation or deducting stock:", error);
      alert(error.message || "An error occurred while saving the calculation or updating stock.");
      // Ensure flag is reset on error too
      setResultsAreFreshForDeduction(false);
    } finally {
      setIsLoading(false);
      // If the save operation itself failed before deduction logic, ensure the flag is reset.
      // If save succeeded, it's handled within the try block.
      if (!calculationSavedSuccessfully) {
          setResultsAreFreshForDeduction(false);
      }
    }
  };

  // Create a duplicate with a new name
  const duplicateCalculation = async () => {
    if (!validateInputs()) { // Validate current form data before duplicating
      return;
    }

    setIsLoading(true);
    
    try {
      const timestamp = Date.now();
      const newId = `calc-${timestamp}`;
      
      const duplicatedCalculation: SavedCalculation = {
        id: newId,
        name: `${planName || "Unnamed Plan"} (Copy)`, // Use current planName or a default
        description,
        kerfThickness,
        availableStocks: JSON.parse(JSON.stringify(availableStocks)), // Deep copy
        requiredParts: JSON.parse(JSON.stringify(requiredParts)),   // Deep copy
        results: results ? JSON.parse(JSON.stringify(results)) : null, // Deep copy results if they exist
        dateCreated: timestamp,
        dateModified: timestamp
      };

      const success = await createCalculation(duplicatedCalculation);
      
      if (success) {
        setSavedCalculations([...savedCalculations, duplicatedCalculation]);
        
        // Optionally, load the duplicated calculation into the form
        setPlanName(duplicatedCalculation.name);
        setDescription(duplicatedCalculation.description);
        setKerfThickness(duplicatedCalculation.kerfThickness);
        setAvailableStocks(duplicatedCalculation.availableStocks);
        setRequiredParts(duplicatedCalculation.requiredParts);
        setResults(duplicatedCalculation.results);
        setCurrentCalcId(newId);
        setIsEditing(true); // Now editing the duplicated one
        setResultsAreFreshForDeduction(false); // Results from duplicate are not fresh for deduction
        
        alert("Calculation duplicated successfully. You are now editing the copy.");
      } else {
        alert("Failed to duplicate calculation. Please try again.");
      }
    } catch (error) {
      console.error("Error duplicating calculation:", error);
      alert("An error occurred while duplicating");
    } finally {
      setIsLoading(false);
    }
  };

  // Load a calculation
  const loadCalculation = (id: string) => {
    // Check for unsaved changes before loading
    if (hasUnsavedChanges) {
      const confirmed = confirm("You have unsaved changes. Loading a new calculation will discard them. Are you sure?");
      if (!confirmed) return;
    }
    
    const calculation = savedCalculations.find(calc => calc.id === id);
    if (!calculation) {
      alert("Calculation not found.");
      return;
    }

    setPlanName(calculation.name);
    setDescription(calculation.description || ""); // Ensure description is not undefined
    setKerfThickness(calculation.kerfThickness);
    // Deep copy arrays to prevent direct mutation of savedCalculations state
    setAvailableStocks(JSON.parse(JSON.stringify(calculation.availableStocks)));
    setRequiredParts(JSON.parse(JSON.stringify(calculation.requiredParts)));
    setResults(calculation.results ? JSON.parse(JSON.stringify(calculation.results)) : null);
    setCurrentCalcId(calculation.id);
    setIsEditing(true);
    setErrorMessage(null);
    setResultsAreFreshForDeduction(false); 
    setUseWarehouseStock(calculation.availableStocks.some(s => s.id)); // Set based on loaded data
    setHasUnsavedChanges(false); // Clear unsaved changes flag when loading
  };

  // Delete a saved calculation
  const deleteSavedCalculation = async (id: string) => {
    // Ask for confirmation before deleting
    if (!confirm("Are you sure you want to delete this calculation?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await deleteCalculation(id);
      
      if (success) {
        setSavedCalculations(savedCalculations.filter(calc => calc.id !== id));
        
        // If the deleted calculation was being edited, reset the form
        if (currentCalcId === id) {
          resetForm();
        }
      } else {
        alert("Failed to delete calculation. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting calculation:", error);
      alert("An error occurred while deleting");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all saved calculations
  const deleteAllSavedCalculations = async () => {
    if (!confirm("Are you sure you want to delete ALL saved calculations? This action cannot be undone.")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await deleteAllCalculations();
      
      if (success) {
        setSavedCalculations([]);
        resetForm(); // Reset the form to a clean state
        alert("All calculations have been deleted.");
      } else {
        alert("Failed to delete all calculations. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting all calculations:", error);
      alert("An error occurred while deleting all calculations");
    } finally {
      setIsLoading(false);
    }
  };

  // Cut status management helpers
  const generatePlacementKey = (placement: Placement, stockIndex: number) => {
    return `${stockIndex}-${placement.partId}-${placement.x}-${placement.y}-${placement.rotated}`;
  };

  const toggleCutStatus = (placementKey: string) => {
    setCutStatus(prev => ({
      ...prev,
      [placementKey]: !prev[placementKey]
    }));
  };

  const resetAllCutStatus = () => {
    setCutStatus({});
  };

  // Create a new calculation plan by resetting all data
  const createNewCalculation = () => {
    // Check for unsaved changes first
    if (hasUnsavedChanges) {
      const confirmed = confirm("You have unsaved changes. Creating a new calculation will discard them. Are you sure?");
      if (!confirmed) return;
    }
    
    if (isEditing || results || availableStocks.length > 0 || requiredParts.length > 0 || planName || description) {
      const confirmed = confirm("This will clear all current data and start a new calculation. Are you sure?");
      if (!confirmed) return;
    }

    // Reset all form data
    setPlanName("");
    setDescription("");
    setKerfThickness(0);
    setAvailableStocks([]);
    setRequiredParts([]);
    setResults(null);
    setErrorMessage(null);
    setCurrentCalcId(null);
    setIsEditing(false);
    setUseWarehouseStock(false);
    setResultsAreFreshForDeduction(false);
    setCutStatus({});
    setHasUnsavedChanges(false); // Clear unsaved changes flag
    
    // Optionally add some default stocks to get started
    const defaultStock: Stock = {
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 1,
      material: "",
      materialType: MaterialType.Sheet,
      grainDirection: ""
    };
    setAvailableStocks([defaultStock]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold">Cutting Optimization Tool</h1>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-300 rounded-md">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-orange-700 text-sm font-medium">Unsaved changes</span>
          </div>
        )}
      </div>
      
      {/* Main layout with left sidebar and main content */}
      <div className="flex gap-6">
        {/* Left Sidebar - Saved Calculations */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white p-4 rounded-md shadow-md sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Saved Calculations</h3>
            {savedCalculations.length === 0 ? (
              <p className="text-sm text-gray-500">No saved calculations found.</p>
            ) : (
              <div className="space-y-2">
                {savedCalculations.map(calc => (
                  <div key={calc.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="mb-2">
                      <p className="text-sm font-semibold truncate">{calc.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{calc.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => loadCalculation(calc.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                      >
                        Load
                      </button>
                      
                      <button 
                        onClick={() => deleteSavedCalculation(calc.id)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* New Calculation Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={createNewCalculation}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                New Calculation
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Calculation plan form */}
          <div className="bg-white p-4 rounded-md shadow-md mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Calculation Plan</h2>
              <div className="flex items-center gap-2 text-sm">
                {isEditing && currentCalcId && (
                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Editing: {planName || 'Untitled'}
                  </span>
                )}
                {hasUnsavedChanges && (
                  <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                    Unsaved
                  </span>
                )}
                {isEditing && !hasUnsavedChanges && (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                    Saved
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plan Name</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kerf Thickness (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={kerfThickness}
                  onChange={(e) => setKerfThickness(parseFloat(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
          
          {/* Stock and parts management */}
          <div className="bg-white p-4 rounded-md shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-4">Stocks and Parts</h2>
        
        {/* Warehouse stock usage */}
        <div className="mb-4">
          <button 
            onClick={handleUseWarehouseStock}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
          >
            Use Warehouse Stock
          </button>
        </div>
        
        {/* Form for available stocks */}
        <h3 className="text-xl font-semibold mb-4">Available Stocks</h3>
        {availableStocks.map((stock, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Length (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={stock.length || ''}
                  onChange={(e) => updateStock(index, 'length', parseFloat(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={stock.width || ''}
                  onChange={(e) => updateStock(index, 'width', parseFloat(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Thickness (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={stock.thickness || ''}
                  onChange={(e) => updateStock(index, 'thickness', parseFloat(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={stock.quantity || ''}
                  onChange={(e) => updateStock(index, 'quantity', parseFloat(e.target.value))}
                  min="1"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Material Type</label>
                <select
                  className="w-full px-2 py-1 border rounded-md"
                  value={stock.materialType || MaterialType.Sheet}
                  onChange={(e) => updateStock(index, 'materialType', e.target.value)}
                >
                  <option value={MaterialType.Sheet}>Sheet Material</option>
                  <option value={MaterialType.Dimensional}>Dimensional Lumber</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Material</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  placeholder={stock.materialType === MaterialType.Sheet ? 
                    "e.g., Plywood, MDF" : 
                    "e.g., Oak, Pine, Spruce"}
                  value={stock.material || ''}
                  onChange={(e) => updateStock(index, 'material', e.target.value)}
                />
              </div>
              
              {/* Only show grain direction for sheet materials */}
              {stock.materialType === MaterialType.Sheet && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grain Direction</label>
                  <select
                    className="w-full px-2 py-1 border rounded-md"
                    value={stock.grainDirection || ''}
                    onChange={(e) => updateStock(index, 'grainDirection', e.target.value)}
                  >
                    <option value="">Select Direction</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => deleteStock(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end">
          <button 
            onClick={addStock}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"
          >
            Add Stock
          </button>
        </div>
        
        {/* Form for adding required parts */}
        <h3 className="text-xl font-semibold mb-4">Required Parts</h3>
        {requiredParts.map((part, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  placeholder={`Part ${index + 1}`}
                  value={part.name || ''}
                  onChange={(e) => updatePart(index, 'name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Length (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={part.length}
                  onChange={(e) => updatePart(index, 'length', parseFloat(e.target.value))}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={part.width}
                  onChange={(e) => updatePart(index, 'width', parseFloat(e.target.value))}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Thickness (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={part.thickness || ''}
                  onChange={(e) => updatePart(index, 'thickness', parseFloat(e.target.value))}
                  min="0"
                  placeholder="18"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={part.quantity || ''}
                  onChange={(e) => updatePart(index, 'quantity', parseFloat(e.target.value))}
                  min="1"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Material Type</label>
                <select
                  className="w-full px-2 py-1 border rounded-md"
                  value={part.materialType || MaterialType.Sheet}
                  onChange={(e) => updatePart(index, 'materialType', e.target.value)}
                >
                  <option value={MaterialType.Sheet}>Sheet Material</option>
                  <option value={MaterialType.Dimensional}>Dimensional Lumber</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Material</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  placeholder={part.materialType === MaterialType.Sheet ? 
                    "e.g., Plywood, MDF" : 
                    "e.g., Oak, Pine, Spruce"}
                  value={part.material || ''}
                  onChange={(e) => updatePart(index, 'material', e.target.value)}
                />
              </div>
              
              {/* Only show grain direction for sheet materials */}
              {part.materialType === MaterialType.Sheet && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grain Direction</label>
                  <select
                    className="w-full px-2 py-1 border rounded-md"
                    value={part.grainDirection || ''}
                    onChange={(e) => updatePart(index, 'grainDirection', e.target.value)}
                  >
                    <option value="">Select Direction</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => deletePart(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end gap-2">
          <button 
            onClick={addPart}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"
          >
            Add Part
          </button>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={calculateOptimalCuts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Cuts'}
          </button>
          
          <button 
            onClick={saveCalculation}
            className={`px-4 py-2 text-white rounded-md shadow-md transition-colors flex items-center gap-2 ${
              hasUnsavedChanges 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={!results || !results.success}
          >
            {hasUnsavedChanges && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
            {isEditing ? 'Update Calculation' : 'Save Calculation'}
            {hasUnsavedChanges && <span className="text-xs">(Unsaved)</span>}
          </button>
        </div>
      </div>
      
      {/* Results and actions */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        
        {results && results.success ? (
          <div>
            <p className="text-green-600 text-sm mb-4">{results.message}</p>
            
            <h3 className="text-lg font-semibold mb-2">Stock Usage</h3>
            {results.stockUsage.map((usage, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 shadow-sm border border-gray-200">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="text-sm text-gray-500">Sheet ID:</span> 
                    <span className="font-semibold">{usage.sheetId}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Used Area:</span> 
                    <span className="font-semibold">{usage.usedArea.toFixed(2)} mm²</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {usage.placements.map((placement, pIndex) => (
                    <div key={pIndex} className="p-2 border rounded-md bg-white shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Part ID: {placement.partId}</p>
                      <p className="text-xs text-gray-500 mb-1">Position: ({placement.x}, {placement.y})</p>
                      <p className="text-xs text-gray-500">Rotation: {placement.rotated ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Total Waste:</p>
              <p className="text-lg font-semibold">{results.totalWaste.toFixed(2)} mm²</p>
            </div>
          </div>
        ) : (
          <p className="text-red-600 text-sm">{results ? results.message : "No results available."}</p>
        )}
      </div>
      
      {/* Results Section */}
      {results && results.success && (
        <div className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-brand-green">Results</h3>
          
          <div className="mb-4">
            <p>Total Sheets Used: <span className="font-semibold">{results.totalUsedSheets}</span></p>
            <p>Total Waste Area: <span className="font-semibold">{Math.round(results.totalWaste)} mm²</span></p>
          </div>

          {/* Cut Progress Summary */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Cutting Progress:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {(() => {
                const totalPlacements = results.stockUsage.reduce((total, usage) => total + usage.placements.length, 0);
                const totalCutPlacements = results.stockUsage.reduce((total, usage, stockIndex) => 
                  total + usage.placements.filter(p => cutStatus[generatePlacementKey(p, stockIndex)]).length, 0
                );
                const progressPercent = totalPlacements > 0 ? Math.round((totalCutPlacements / totalPlacements) * 100) : 0;
                
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-semibold">✓ Cut:</span>
                      <span className="font-semibold">{totalCutPlacements}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">○ Remaining:</span>
                      <span className="font-semibold">{totalPlacements - totalCutPlacements}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-semibold">Progress:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{progressPercent}%</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Grain Direction Legend */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Grain Direction Legend:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg font-bold">↕</span>
                <span className="text-green-600 font-semibold">ALIGNED</span>
                <span className="text-gray-600">- Grain matches orientation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg font-bold">↔</span>
                <span className="text-red-600 font-semibold">CROSS</span>
                <span className="text-gray-600">- Grain runs across</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm font-bold">||</span>
                <span className="text-blue-600 font-semibold">GRAIN</span>
                <span className="text-gray-600">- Dimensional lumber</span>
              </div>
            </div>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">Stock Usage:</h4>
          <div className="space-y-4">
            {results.stockUsage.map((usage, index) => {
              const stock = availableStocks[usage.stockIndex];
              return (
                <div key={index} className="bg-gray-50 p-4 rounded-md">
                  <h5 className="font-semibold text-brand-blue">
                    Stock #{index + 1} ({stock.length} x {stock.width} x {stock.thickness}mm)
                  </h5>
                  <div>
                    <p>
                      {stock.materialType === MaterialType.Sheet ? 'Sheet Material' : 'Dimensional Lumber'}: {stock.material || 'Unspecified'}
                      {stock.materialType === MaterialType.Sheet && stock.grainDirection && (
                        <span> - Grain: {stock.grainDirection}</span>
                      )}
                    </p>
                    <p>Parts placed: {usage.placements.length}</p>
                    <p>Waste area: {Math.round(usage.wasteArea)} mm²</p>
                  </div>

                  {/* Stock sheet visualization */}
                  {stock.materialType === MaterialType.Sheet && (
                    <div className="mt-2 mb-4 relative border-2 border-gray-400 bg-gray-50" 
                      style={{ 
                        width: "100%",
                        height: "350px",
                        overflow: "hidden"
                      }}>
                      {/* Prominent stock dimensions header */}
                      <div className="absolute top-0 left-0 right-0 bg-blue-900 text-white px-3 py-2 font-bold text-sm z-20 border-b-2 border-blue-700">
                        Stock Sheet: {formatDimensions(stock)}
                        {stock.material && <span className="ml-2">({stock.material})</span>}
                        {stock.grainDirection && (
                          <span className="ml-2 bg-blue-700 px-2 py-1 rounded text-xs">
                            Grain: {stock.grainDirection}
                          </span>
                        )}
                      </div>
                      
                      {/* Length dimension label (top) */}
                      <div className="absolute top-8 left-12 right-2 h-6 flex items-center justify-center bg-yellow-100 border border-yellow-300 text-xs font-semibold text-yellow-800 z-15">
                        Length: {stock.length}mm
                      </div>
                      
                      {/* Width dimension label (left side) */}
                      <div className="absolute top-16 left-0 w-10 bottom-2 flex items-center justify-center bg-yellow-100 border border-yellow-300 text-xs font-semibold text-yellow-800 z-15">
                        <div className="transform -rotate-90 whitespace-nowrap">
                          Width: {stock.width}mm
                        </div>
                      </div>
                      
                      {/* Grain direction pattern background */}
                      {stock.grainDirection && (
                        <div 
                          className="absolute opacity-20 pointer-events-none z-5"
                          style={{
                            left: '40px',
                            top: '58px',
                            right: '8px',
                            bottom: '8px',
                            backgroundImage: stock.grainDirection.toLowerCase().includes('horizontal') || stock.grainDirection.toLowerCase().includes('cross') 
                              ? 'repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 8px)'
                              : 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 8px)'
                          }}
                        />
                      )}
                      
                      {/* Grain direction arrows */}
                      {stock.grainDirection && (
                        <div className="absolute top-16 right-2 z-10 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow">
                          <div className="flex items-center gap-1">
                            <span>Grain:</span>
                            {stock.grainDirection.toLowerCase().includes('horizontal') || stock.grainDirection.toLowerCase().includes('cross') ? (
                              <div className="flex items-center">
                                <div className="w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent border-r-blue-600"></div>
                                <div className="h-0.5 w-4 bg-blue-600 mx-0.5"></div>
                                <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent border-l-blue-600"></div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-blue-600"></div>
                                <div className="w-0.5 h-4 bg-blue-600 my-0.5"></div>
                                <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-blue-600"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Parts placements */}
                      <div className="absolute left-10 right-2 bottom-2" style={{ top: '58px' }}>
                        {usage.placements.map((placement, pIndex) => {
                          const partIndex = parseInt(placement.partId.split('-')[1]);
                          const part = results.sortedParts[partIndex];
                          
                          // CRITICAL FIX #2: Validate part exists before rendering
                          if (!part || isNaN(partIndex) || partIndex < 0 || partIndex >= results.sortedParts.length) {
                            console.warn(`Invalid part reference at placement ${pIndex}: partIndex=${partIndex}, partId=${placement.partId}`);
                            return null; // Skip this placement
                          }
                          
                          const scaleX = 100 / stock.length;
                          const scaleY = 100 / stock.width;
                          const width = placement.rotated ? part.width : part.length;
                          const height = placement.rotated ? part.length : part.width;

                          // Get color for this part
                          const { border, bg } = getPartColor(partIndex);

                          return (
                            <div 
                              key={pIndex}
                              className={`absolute ${border} ${bg} flex items-center justify-center text-xs cursor-help shadow-sm`}
                              style={{
                                left: `${placement.x * scaleX}%`,
                                top: `${placement.y * scaleY}%`,
                                width: `${width * scaleX}%`,
                                height: `${height * scaleY}%`,
                                transition: "all 0.3s ease"
                              }}
                              title={`${placement.name || `Part #${partIndex + 1}`} (${formatDimensions(part)}) - Instance #${pIndex + 1} - Position: (${Math.round(placement.x)},${Math.round(placement.y)}) - ${placement.rotated ? 'Rotated' : 'Not Rotated'}`}
                            >
                              <div className="text-center">
                                <div className="font-bold">{placement.name || `#${partIndex + 1}`}</div>
                                <div className="text-[9px] leading-tight">
                                  {formatDimensions(part, { includeGrainDirection: false, includeUnits: false, rotated: placement.rotated })}
                                </div>
                                {placement.rotated && <div className="text-[10px]">↻</div>}
                                {part.grainDirection && stock.grainDirection && (
                                  <div className="text-[12px] mt-1 font-bold">
                                    {/* Enhanced grain direction indicator - properly considers both stock and part grain */}
                                    {(() => {
                                      const stockGrain = stock.grainDirection.toLowerCase();
                                      const partGrain = part.grainDirection.toLowerCase();
                                      const isAligned = (stockGrain === partGrain && !placement.rotated) ||
                                                       (stockGrain !== partGrain && placement.rotated);
                                      
                                      return isAligned ? (
                                        <div className="flex flex-col items-center bg-green-100 rounded px-1 py-0.5">
                                          <span className="text-green-600 text-lg leading-none">↕</span>
                                          <span className="text-green-600 text-[8px] leading-none font-bold">ALIGNED</span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center bg-red-100 rounded px-1 py-0.5">
                                          <span className="text-red-600 text-lg leading-none">↔</span>
                                          <span className="text-red-600 text-[8px] leading-none font-bold">CROSS</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Dimensional lumber visualization */}
                  {stock.materialType === MaterialType.Dimensional && (
                    <div className="mt-2 mb-4 relative border-2 border-gray-400 bg-gray-50" 
                      style={{ 
                        width: "100%",
                        height: "80px",
                        overflow: "hidden"
                      }}>
                      {/* Prominent stock dimensions header */}
                      <div className="absolute top-0 left-0 right-0 bg-green-900 text-white px-3 py-1 font-bold text-sm z-20 border-b-2 border-green-700">
                        Dimensional Lumber: {stock.length} × {stock.width} × {stock.thickness}mm
                        {stock.material && <span className="ml-2">({stock.material})</span>}
                      </div>
                      
                      {/* Length dimension label */}
                      <div className="absolute top-6 left-2 right-2 h-4 flex items-center justify-center bg-yellow-100 border border-yellow-300 text-xs font-semibold text-yellow-800 z-15">
                        Length: {stock.length}mm
                      </div>
                      
                      {/* Parts placements */}
                      <div className="absolute top-5 left-0 right-0 bottom-0" style={{ top: '44px' }}>
                        {usage.placements.map((placement, pIndex) => {
                          const partIndex = parseInt(placement.partId.split('-')[1]);
                          const part = results.sortedParts[partIndex];
                          
                          // CRITICAL FIX #2: Validate part exists before rendering
                          if (!part || isNaN(partIndex) || partIndex < 0 || partIndex >= results.sortedParts.length) {
                            console.warn(`Invalid part reference in dimensional lumber at placement ${pIndex}: partIndex=${partIndex}, partId=${placement.partId}`);
                            return null; // Skip this placement
                          }
                          
                          const scaleX = 100 / stock.length;

                          // Get color for this part
                          const { border, bg } = getPartColor(partIndex);

                          return (
                            <div 
                              key={pIndex}
                              className={`absolute border-2 ${border} ${bg} flex items-center justify-center text-xs cursor-help shadow-sm`}
                              style={{
                                left: `${placement.x * scaleX}%`,
                                top: `2px`,
                                width: `${part.length * scaleX}%`,
                                height: `28px`,
                                transition: "all 0.3s ease"
                              }}
                              title={`${placement.name || `Part #${partIndex + 1}`} (${part.length}mm) - Instance #${pIndex + 1} - Position: ${Math.round(placement.x)}mm`}
                            >
                              <div className="text-center font-bold">
                                <div>{placement.name || `#${partIndex + 1}`}</div>
                                <div className="text-[9px] leading-tight">{part.length}mm</div>
                                {part.grainDirection && (
                                  <div className="text-[10px] mt-1">
                                    {/* Dimensional lumber grain direction indicator */}
                                    <div className="flex items-center justify-center bg-blue-100 rounded px-1 py-0.5">
                                      <span className="text-green-600 text-sm font-bold">||</span>
                                      <span className="text-blue-600 text-[7px] ml-1 font-bold">GRAIN</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-800">Parts Placed ({usage.placements.length}):</h6>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Cut: {usage.placements.filter(p => cutStatus[generatePlacementKey(p, index)]).length} / {usage.placements.length}
                        </span>
                        <button
                          onClick={resetAllCutStatus}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                          title="Reset all cut status"
                        >
                          Reset All
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {usage.placements.map((placement, i) => {
                        // Extract the partIndex from the partId string format "Part-n"
                        const partIndex = parseInt(placement.partId.split('-')[1]);
                        const part = results.sortedParts[partIndex];
                        
                        // CRITICAL FIX #2: Validate part exists before rendering
                        if (!part || isNaN(partIndex) || partIndex < 0 || partIndex >= results.sortedParts.length) {
                          console.warn(`Invalid part reference in parts list at placement ${i}: partIndex=${partIndex}, partId=${placement.partId}`);
                          return (
                            <li key={i} className="text-red-600 bg-red-50 p-2 rounded border border-red-200">
                              ⚠️ Invalid part reference: {placement.partId}
                            </li>
                          );
                        }
                        
                        // Check grain direction alignment for sheet materials
                        const grainAligned = stock.materialType === MaterialType.Sheet && 
                          stock.grainDirection && part.grainDirection ? 
                          (stock.grainDirection.toLowerCase() === part.grainDirection.toLowerCase() && !placement.rotated) ||
                          (stock.grainDirection.toLowerCase() !== part.grainDirection.toLowerCase() && placement.rotated)
                          : null;
                        
                        // Generate unique key for this placement
                        const placementKey = generatePlacementKey(placement, index);
                        const isCut = cutStatus[placementKey] || false;
                        
                        // Get color for this part
                        const { border, bg } = getPartColor(partIndex);

                        return (
                          <li key={i} className={`text-sm p-2 rounded flex items-center justify-between ${
                            isCut ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}>
                            <div className={isCut ? 'opacity-75' : ''}>
                              <span className={`font-medium ${isCut ? 'line-through text-gray-500' : ''}`}>
                                {placement.name || `Part #${partIndex + 1}`}
                              </span>
                              <span className={`text-gray-600 ml-2 ${isCut ? 'line-through' : ''}`}>
                                ({formatDimensions(part)})
                              </span>
                              {part.materialType && <span className={`text-blue-600 ml-2 ${isCut ? 'line-through opacity-60' : ''}`}>- {part.materialType}</span>}
                              {part.material && <span className={`text-purple-600 ml-2 ${isCut ? 'line-through opacity-60' : ''}`}>- {part.material}</span>}
                              <span className={`text-gray-500 ml-2 ${isCut ? 'line-through opacity-60' : ''}`}>
                                @ ({Math.round(placement.x)}, {Math.round(placement.y)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isCut}
                                  onChange={() => toggleCutStatus(placementKey)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <span className={`text-xs font-medium ${
                                  isCut ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {isCut ? 'Cut ✓' : 'Not Cut'}
                                </span>
                              </label>
                              {placement.rotated && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                  Rotated ↻
                                </span>
                              )}
                              {part.grainDirection && (
                                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                  stock.materialType === MaterialType.Sheet ? (
                                    grainAligned === true ? 'bg-green-100 text-green-800' : 
                                    grainAligned === false ? 'bg-red-100 text-red-800' : 
                                    'bg-gray-100 text-gray-800'
                                  ) : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {stock.materialType === MaterialType.Sheet ? (
                                    <>
                                      {grainAligned === true ? (
                                        <>
                                          <span>↕</span>
                                          <span>Grain Aligned ✓</span>
                                        </>
                                      ) : grainAligned === false ? (
                                        <>
                                          <span>↔</span>
                                          <span>Grain Cross ⚠</span>
                                        </>
                                      ) : (
                                        <span>Grain: {part.grainDirection}</span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span>||</span>
                                      <span>Grain: {part.grainDirection}</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    
                    {/* Summary information */}
                    <div className="mt-3 pt-2 border-t border-gray-200 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Efficiency:</span> 
                          <span className="ml-1">{(((stock.length * stock.width - usage.wasteArea) / (stock.length * stock.width)) * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Waste:</span> 
                          <span className="ml-1">{Math.round(usage.wasteArea)} mm²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cut Sequence Optimization Section */}
          {results.cutSequences && results.cutSequences.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4 text-brand-green flex items-center gap-2">
                <span>🔧</span>
                Optimized Cutting Sequences
              </h4>
              <div className="text-sm text-gray-600 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="font-medium text-yellow-800 mb-1">Safety & Efficiency Guidelines:</p>
                <p>These sequences are optimized for safety and efficiency. Follow the suggested order and safety notes for best results.</p>
              </div>

              <div className="space-y-6">
                {results.cutSequences.map((sequence, sequenceIndex) => {
                  const stock = availableStocks[results.stockUsage[sequence.stockUsageIndex].stockIndex];
                  return (
                    <div key={sequenceIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-semibold text-brand-blue text-lg">
                            {sequence.sheetId} - Cutting Sequence
                          </h5>
                          <p className="text-sm text-gray-600">
                            Stock: {formatDimensions(stock)} ({stock.material || 'Unspecified'})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4 text-sm">
                            <div className="bg-green-50 px-3 py-1 rounded-md border border-green-200">
                              <span className="text-green-700 font-medium">Safety: {sequence.safetyScore}/10</span>
                            </div>
                            <div className="bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                              <span className="text-blue-700 font-medium">Efficiency: {sequence.efficiencyScore}/10</span>
                            </div>
                            <div className="bg-purple-50 px-3 py-1 rounded-md border border-purple-200">
                              <span className="text-purple-700 font-medium">Time: ~{sequence.estimatedTime}min</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Steps List */}
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-800 border-b border-gray-200 pb-1">
                          Cutting Steps ({sequence.totalSteps} steps)
                        </h6>
                        
                        {sequence.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className={`border-l-4 pl-4 py-2 rounded-r-md ${
                            step.priority === 'high' ? 'border-red-400 bg-red-50' :
                            step.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                            'border-green-400 bg-green-50'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  step.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  step.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {step.stepNumber}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-800">{step.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                      step.cutType === 'rip' ? 'bg-blue-100 text-blue-800' :
                                      step.cutType === 'crosscut' ? 'bg-green-100 text-green-800' :
                                      step.cutType === 'initial-breakdown' ? 'bg-purple-100 text-purple-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {step.cutType.replace('-', ' ').toUpperCase()}
                                    </span>
                                    {step.toolSuggestion && (
                                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                        🔧 {step.toolSuggestion}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Safety Notes */}
                            {step.safetyNotes && step.safetyNotes.length > 0 && (
                              <div className="mt-2 ml-11">
                                <p className="text-xs font-medium text-red-700 mb-1">⚠️ Safety Notes:</p>
                                <ul className="text-xs text-red-600 space-y-1">
                                  {step.safetyNotes.map((note, noteIndex) => (
                                    <li key={noteIndex} className="flex items-start gap-1">
                                      <span className="text-red-400 mt-0.5">•</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Parts affected by this step */}
                            {step.placements && step.placements.length > 0 && (
                              <div className="mt-2 ml-11">
                                <p className="text-xs font-medium text-gray-700 mb-1">Parts affected:</p>
                                <div className="flex flex-wrap gap-1">
                                  {step.placements.map((placement, placementIndex) => (
                                    <span key={placementIndex} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded-md">
                                      {placement.name || placement.partId}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      {sequence.recommendations && sequence.recommendations.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <h6 className="font-medium text-blue-800 mb-2">💡 Recommendations:</h6>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {sequence.recommendations.map((recommendation, recIndex) => (
                              <li key={recIndex} className="flex items-start gap-1">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cut Sequence Optimization Section */}
      {results && results.success && results.cutSequences && results.cutSequences.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-brand-green flex items-center">
            <span className="mr-2">🔧</span>
            Recommended Cutting Sequence
          </h3>
          
          {results.cutSequences.map((sequence, seqIndex) => (
            <div key={seqIndex} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Sequence Header */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-brand-blue">
                  Sheet #{seqIndex + 1} - {sequence.sheetId}
                </h4>
                <div className="flex gap-3 text-sm">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    📊 Safety: {sequence.safetyScore}/10
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    📈 Efficiency: {sequence.efficiencyScore}/10
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    ⏱️ Time: {sequence.estimatedTime}min
                  </span>
                </div>
              </div>

              {/* Cutting Steps */}
              <div className="space-y-3 mb-4">
                <h5 className="font-medium text-gray-700">Cutting Steps ({sequence.totalSteps} total):</h5>
                {sequence.steps.map((step, stepIndex) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white
                          ${step.priority === 'high' ? 'bg-red-500' : 
                            step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
                        `}>
                          {step.stepNumber}
                        </span>
                        <div>
                          <span className="font-medium text-gray-900">{step.description}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {step.cutType.replace('-', ' ').toUpperCase()} 
                            {step.priority && (
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium
                                ${step.priority === 'high' ? 'bg-red-100 text-red-700' : 
                                  step.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
                              `}>
                                {step.priority.toUpperCase()} PRIORITY
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tool Suggestion */}
                    {step.toolSuggestion && (
                      <div className="text-sm text-blue-700 mb-2 bg-blue-50 p-2 rounded border-l-4 border-blue-300">
                        <span className="font-medium">🔨 Recommended Tool:</span> {step.toolSuggestion}
                      </div>
                    )}
                    
                    {/* Safety Notes */}
                    {step.safetyNotes && step.safetyNotes.length > 0 && (
                      <div className="text-sm text-red-700 bg-red-50 p-2 rounded border-l-4 border-red-300">
                        <span className="font-medium">⚠️ Safety Notes:</span>
                        <ul className="mt-1 ml-4 list-disc space-y-1">
                          {step.safetyNotes.map((note, noteIndex) => (
                            <li key={noteIndex}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {sequence.recommendations && sequence.recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Recommendations for this cutting sequence:
                  </h5>
                  <ul className="text-sm text-blue-700 space-y-2">
                    {sequence.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
