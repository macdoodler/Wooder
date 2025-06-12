'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  fetchCalculations, 
  createCalculation, 
  updateCalculation, 
  deleteCalculation,
  deleteAllCalculations,
  fetchWarehouseStock,
  updateWarehouseStockItem
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
  createDimensionKey,
  OptimizationPhilosophy,
  OptimizationPhilosophyDescriptions,
  OptimizationWeights,
  DefaultOptimizationWeights
} from "./lib/types";
import { calculateOptimalCuts as calculateOptimalCutsExternal } from "./lib/cutting-engine";

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
    { border: 'border-blue-700', bg: 'bg-blue-200', hexBg: '#dbeafe', hexBorder: '#1d4ed8' },
    { border: 'border-red-700', bg: 'bg-red-200', hexBg: '#fecaca', hexBorder: '#b91c1c' },
    { border: 'border-green-700', bg: 'bg-green-200', hexBg: '#bbf7d0', hexBorder: '#15803d' },
    { border: 'border-yellow-700', bg: 'bg-yellow-200', hexBg: '#fef08a', hexBorder: '#a16207' },
    { border: 'border-purple-700', bg: 'bg-purple-200', hexBg: '#e9d5ff', hexBorder: '#7c3aed' },
    { border: 'border-pink-700', bg: 'bg-pink-200', hexBg: '#fce7f3', hexBorder: '#be185d' },
    { border: 'border-indigo-700', bg: 'bg-indigo-200', hexBg: '#c7d2fe', hexBorder: '#4338ca' },
    { border: 'border-orange-700', bg: 'bg-orange-200', hexBg: '#fed7aa', hexBorder: '#c2410c' },
    { border: 'border-teal-700', bg: 'bg-teal-200', hexBg: '#99f6e4', hexBorder: '#0f766e' },
    { border: 'border-cyan-700', bg: 'bg-cyan-200', hexBg: '#a5f3fc', hexBorder: '#0e7490' },
    { border: 'border-lime-700', bg: 'bg-lime-200', hexBg: '#d9f99d', hexBorder: '#4d7c0f' },
    { border: 'border-rose-700', bg: 'bg-rose-200', hexBg: '#fecdd3', hexBorder: '#be123c' }
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
  const [resultsAreFreshForDeduction, setResultsAreFreshForDeduction] = useState(false);
  const [cutStatus, setCutStatus] = useState<{ [placementKey: string]: boolean }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [optimizationPhilosophy, setOptimizationPhilosophy] = useState<OptimizationPhilosophy>(OptimizationPhilosophy.MaximumYield);
  const [customWeights, setCustomWeights] = useState<OptimizationWeights>(DefaultOptimizationWeights[OptimizationPhilosophy.MaximumYield]);
  const [showCustomWeights, setShowCustomWeights] = useState(false);
  
  // NEW: Auto-recalculation states
  const [autoRecalculate, setAutoRecalculate] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const recalcTimeoutRef = useRef<NodeJS.Timeout>();

  // NEW: Debounced recalculation function
  const debouncedRecalculate = useCallback((delay: number = 300) => {
    // Clear any existing timeout
    if (recalcTimeoutRef.current) {
      clearTimeout(recalcTimeoutRef.current);
    }
    
    // Only recalculate if auto-recalc is on and we have valid inputs
    if (autoRecalculate && results && planName && availableStocks.length > 0 && requiredParts.length > 0) {
      setIsRecalculating(true);
      
      recalcTimeoutRef.current = setTimeout(() => {
        calculateOptimalCuts();
        setIsRecalculating(false);
      }, delay);
    }
  }, [autoRecalculate, results, planName, availableStocks, requiredParts]);

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
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // NEW: Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (recalcTimeoutRef.current) {
        clearTimeout(recalcTimeoutRef.current);
      }
    };
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
      const currentCalculation = savedCalculations.find(calc => calc.id === currentCalcId);
      if (currentCalculation) {
        const hasFormChanges = 
          planName !== currentCalculation.name ||
          description !== (currentCalculation.description || "") ||
          kerfThickness !== currentCalculation.kerfThickness ||
          optimizationPhilosophy !== (currentCalculation.optimizationPhilosophy || OptimizationPhilosophy.MaximumYield) ||
          JSON.stringify(customWeights) !== JSON.stringify(currentCalculation.customWeights || DefaultOptimizationWeights[currentCalculation.optimizationPhilosophy || OptimizationPhilosophy.MaximumYield]) ||
          JSON.stringify(availableStocks) !== JSON.stringify(currentCalculation.availableStocks) ||
          JSON.stringify(requiredParts) !== JSON.stringify(currentCalculation.requiredParts) ||
          JSON.stringify(results) !== JSON.stringify(currentCalculation.results);
        
        setHasUnsavedChanges(hasFormChanges);
      }
    } else if (!isEditing && (planName || description || kerfThickness || availableStocks.length > 0 || requiredParts.length > 0)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [planName, description, kerfThickness, optimizationPhilosophy, customWeights, availableStocks, requiredParts, results, isEditing, currentCalcId, savedCalculations]);

  // Add browser warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
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
      materialType: item.materialType || MaterialType.Sheet,
      grainDirection: item.grainDirection,
      id: item.id 
    }));
    setAvailableStocks(stockFromWarehouse);
    setUseWarehouseStock(true);
  };

  const resetForm = () => {
    setPlanName("");
    setDescription("");
    setKerfThickness(0);
    setOptimizationPhilosophy(OptimizationPhilosophy.MaximumYield);
    setCustomWeights(DefaultOptimizationWeights[OptimizationPhilosophy.MaximumYield]);
    setShowCustomWeights(false);
    setAvailableStocks([]);
    setRequiredParts([]);
    setResults(null);
    setCurrentCalcId(null);
    setIsEditing(false);
    setErrorMessage(null);
    setUseWarehouseStock(false);
    setHasUnsavedChanges(false);
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
        materialType: MaterialType.Sheet,
        grainDirection: ""
      }
    ]);
  };

  const updateStock = (index: number, field: keyof Stock, value: number | string) => {
    const updatedStocks = [...availableStocks];
    
    if (typeof value === 'string' && ['length', 'width', 'thickness', 'quantity'].includes(field)) {
      if (value === '') {
        (updatedStocks[index] as any)[field] = '';
      } else {
        const numValue = parseFloat(value);
        (updatedStocks[index] as any)[field] = isNaN(numValue) ? '' : numValue;
      }
    } else {
      (updatedStocks[index] as any)[field] = value;
    }
    
    if (field === 'materialType' && value === MaterialType.Dimensional) {
      (updatedStocks[index] as any)['grainDirection'] = '';
    }
    
    setAvailableStocks(updatedStocks);
    
    // NEW: Trigger recalculation for important fields
    if (['length', 'width', 'thickness', 'quantity', 'grainDirection'].includes(field)) {
      debouncedRecalculate(800); // Longer delay for typing
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
        materialType: MaterialType.Sheet,
        grainDirection: "",
        name: ""
      }
    ]);
  };

  const updatePart = (index: number, field: keyof Part, value: number | string) => {
    const updatedParts = [...requiredParts];

    if (typeof value === 'string' && ['length', 'width', 'thickness', 'quantity'].includes(field)) {
      if (value === '') {
        (updatedParts[index] as any)[field] = '';
      } else {
        const numValue = parseFloat(value);
        (updatedParts[index] as any)[field] = isNaN(numValue) ? '' : numValue;
      }
    } else {
      (updatedParts[index] as any)[field] = value;
    }
    
    if (field === 'materialType' && value === MaterialType.Dimensional) {
      (updatedParts[index] as any)['grainDirection'] = '';
    }
    
    setRequiredParts(updatedParts);
    
    // NEW: Trigger recalculation for important fields
    if (['length', 'width', 'thickness', 'quantity', 'grainDirection'].includes(field)) {
      debouncedRecalculate(800); // Longer delay for typing
    }
  };

  const deletePart = (index: number): void => {
    setRequiredParts(requiredParts.filter((_, i) => i !== index));
  };

  const validateInputs = (): boolean => {
    setErrorMessage(null);

    if (!planName.trim()) {
      setErrorMessage("Please provide a name for the calculation plan.");
      return false;
    }

    if (availableStocks.length === 0) {
      setErrorMessage("Please add at least one stock sheet");
      return false;
    }

    if (requiredParts.length === 0) {
      setErrorMessage("Please add at least one required part");
      return false;
    }

    for (const stock of availableStocks) {
      const length = typeof stock.length === 'string' ? parseFloat(stock.length) : stock.length;
      const width = typeof stock.width === 'string' ? parseFloat(stock.width) : stock.width;
      const thickness = typeof stock.thickness === 'string' ? parseFloat(stock.thickness) : stock.thickness;
      const quantity = typeof stock.quantity === 'string' ? parseFloat(stock.quantity) : stock.quantity;
      
      if (isNaN(length) || isNaN(width) || isNaN(thickness) || isNaN(quantity) ||
          length <= 0 || width <= 0 || thickness <= 0 || quantity <= 0) {
        setErrorMessage("All stock dimensions and quantities must be valid positive numbers.");
        return false;
      }
    }

    for (const part of requiredParts) {
      const length = typeof part.length === 'string' ? parseFloat(part.length) : part.length;
      const width = typeof part.width === 'string' ? parseFloat(part.width) : part.width;
      const thickness = typeof part.thickness === 'string' ? parseFloat(part.thickness) : part.thickness;
      const quantity = typeof part.quantity === 'string' ? parseFloat(part.quantity) : part.quantity;
      
      if (isNaN(length) || isNaN(width) || isNaN(thickness) || isNaN(quantity) ||
          length <= 0 || width <= 0 || thickness <= 0 || quantity <= 0) {
        setErrorMessage("All part dimensions and quantities must be valid positive numbers.");
        return false;
      }
    }

    for (const part of requiredParts) {
      const canFit = availableStocks.some(stock => 
        (
          ((part.length <= stock.length && part.width <= stock.width) || 
           (part.width <= stock.length && part.length <= stock.width)) &&
          part.thickness <= stock.thickness &&
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
      
      if (part.material) {
        const hasCompatibleMaterial = availableStocks.some(stock =>
          stock.material?.toLowerCase() === part.material?.toLowerCase() &&
          ((part.length <= stock.length && part.width <= stock.width) || 
           (part.width <= stock.length && part.length <= stock.width)) &&
          part.thickness <= stock.thickness &&
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

  const calculateOptimalCuts = () => {
    const fixedStocks = availableStocks.map(stock => ({
      ...stock,
      materialType: (stock.materialType as any) === 'Sheet Material' ? MaterialType.Sheet : 
                   (stock.materialType as any) === 'Dimensional Lumber' ? MaterialType.Dimensional : 
                   stock.materialType
    }));
    
    const fixedParts = requiredParts.map(part => ({
      ...part,
      materialType: (part.materialType as any) === 'Sheet Material' ? MaterialType.Sheet : 
                   (part.materialType as any) === 'Dimensional Lumber' ? MaterialType.Dimensional : 
                   part.materialType
    }));
    
    if (JSON.stringify(fixedStocks) !== JSON.stringify(availableStocks)) {
      setAvailableStocks(fixedStocks);
    }
    
    if (JSON.stringify(fixedParts) !== JSON.stringify(requiredParts)) {
      setRequiredParts(fixedParts);
    }
    
    if (!validateInputs()) {
      return;
    }
    
    setCutStatus({});
    setIsLoading(true);
    setIsRecalculating(false); // NEW: Clear recalculating state
    setResultsAreFreshForDeduction(false); 
    
    try {
      const results = calculateOptimalCutsExternal(
        fixedStocks, 
        fixedParts, 
        kerfThickness,
        optimizationPhilosophy,
        optimizationPhilosophy === OptimizationPhilosophy.MixedOptimization ? customWeights : undefined
      );
      
      if (results.success) {
        setResults(results);
        setErrorMessage(null);

        if (useWarehouseStock && results.stockUsage && results.stockUsage.length > 0) {
          setResultsAreFreshForDeduction(true);
        }
      } else {
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
        optimizationPhilosophy,
        customWeights: optimizationPhilosophy === OptimizationPhilosophy.MixedOptimization ? customWeights : undefined,
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
          setHasUnsavedChanges(false);
        } else {
          alert("Failed to update calculation. Please try again.");
        }
      } else {
        const success = await createCalculation(calculationToSave);
        if (success) {
          setSavedCalculations([...savedCalculations, calculationToSave]);
          setCurrentCalcId(calculationToSave.id);
          setIsEditing(true);
          alert("Calculation saved successfully!");
          calculationSavedSuccessfully = true;
          setHasUnsavedChanges(false);
        } else {
          alert("Failed to save calculation. Please try again.");
        }
      }

      // Perform warehouse stock deduction
      if (calculationSavedSuccessfully && resultsAreFreshForDeduction && useWarehouseStock && results && results.success && results.stockUsage && results.stockUsage.length > 0) {
        const currentServerWarehouseStock: Stock[] = await fetchWarehouseStock();
        const warehouseItemsToUpdateDetails = new Map<string, { originalItem: Stock, quantityToDeduct: number }>();

        const stockUsageCounts = new Map<number, number>();
        for (const usage of results.stockUsage) {
          const stockIndex = usage.stockIndex;
          stockUsageCounts.set(stockIndex, (stockUsageCounts.get(stockIndex) || 0) + 1);
        }
        
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
      setResultsAreFreshForDeduction(false);
    } finally {
      setIsLoading(false);
      if (!calculationSavedSuccessfully) {
          setResultsAreFreshForDeduction(false);
      }
    }
  };

  const loadCalculation = (id: string) => {
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
    setDescription(calculation.description || "");
    setKerfThickness(calculation.kerfThickness);
    setOptimizationPhilosophy(calculation.optimizationPhilosophy || OptimizationPhilosophy.MaximumYield);
    setCustomWeights(calculation.customWeights || DefaultOptimizationWeights[calculation.optimizationPhilosophy || OptimizationPhilosophy.MaximumYield]);
    setShowCustomWeights(calculation.optimizationPhilosophy === OptimizationPhilosophy.MixedOptimization);
    setAvailableStocks(JSON.parse(JSON.stringify(calculation.availableStocks)));
    setRequiredParts(JSON.parse(JSON.stringify(calculation.requiredParts)));
    setResults(calculation.results ? JSON.parse(JSON.stringify(calculation.results)) : null);
    setCurrentCalcId(calculation.id);
    setIsEditing(true);
    setErrorMessage(null);
    setResultsAreFreshForDeduction(false); 
    setUseWarehouseStock(calculation.availableStocks.some(s => s.id));
    setHasUnsavedChanges(false);
  };

  const deleteSavedCalculation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await deleteCalculation(id);
      
      if (success) {
        setSavedCalculations(savedCalculations.filter(calc => calc.id !== id));
        
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

  const createNewCalculation = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm("You have unsaved changes. Creating a new calculation will discard them. Are you sure?");
      if (!confirmed) return;
    }
    
    if (isEditing || results || availableStocks.length > 0 || requiredParts.length > 0 || planName || description) {
      const confirmed = confirm("This will clear all current data and start a new calculation. Are you sure?");
      if (!confirmed) return;
    }

    resetForm();
    
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
          {/* Error message display */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {/* Calculation plan form */}
          <div className="bg-white p-4 rounded-md shadow-md mb-4 relative">
            {/* NEW: Loading overlay for recalculation */}
            {isRecalculating && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-md">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Recalculating...</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Calculation Plan</h2>
              <div className="flex items-center gap-4">
                {/* NEW: Auto-recalculate toggle */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRecalculate}
                    onChange={(e) => setAutoRecalculate(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Auto-recalculate</span>
                </label>
                
                {/* Status indicators */}
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plan Name</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  disabled={isRecalculating}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border rounded-md"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isRecalculating}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kerf Thickness (mm)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  value={kerfThickness}
                  onChange={(e) => {
                    setKerfThickness(parseFloat(e.target.value));
                    debouncedRecalculate(500); // 500ms delay for number inputs
                  }}
                  min="0"
                  disabled={isRecalculating}
                />
              </div>
              
              {/* Optimization Philosophy Dropdown */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Optimization Philosophy</label>
                <select
                  className="w-full px-2 py-1 border rounded-md"
                  value={optimizationPhilosophy}
                  onChange={(e) => {
                    const newPhilosophy = e.target.value as OptimizationPhilosophy;
                    setOptimizationPhilosophy(newPhilosophy);
                    setCustomWeights(DefaultOptimizationWeights[newPhilosophy]);
                    setShowCustomWeights(newPhilosophy === OptimizationPhilosophy.MixedOptimization);
                    debouncedRecalculate(100); // Faster for dropdown
                  }}
                  disabled={isRecalculating}
                >
                  <option value={OptimizationPhilosophy.MaximumYield}>Maximum Yield</option>
                  <option value={OptimizationPhilosophy.MinimumCuts}>Minimum Cuts</option>
                  <option value={OptimizationPhilosophy.GuillotineCutting}>Guillotine Cutting</option>
                  <option value={OptimizationPhilosophy.PartGrouping}>Part Grouping</option>
                  <option value={OptimizationPhilosophy.PriorityBased}>Priority Based</option>
                  <option value={OptimizationPhilosophy.GrainMatching}>Grain Matching</option>
                  <option value={OptimizationPhilosophy.InventoryManagement}>Inventory Management</option>
                  <option value={OptimizationPhilosophy.MixedOptimization}>Mixed Optimization</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {OptimizationPhilosophyDescriptions[optimizationPhilosophy]}
                </p>
              </div>
            </div>
            
            {/* Custom Weights Section for Mixed Optimization */}
            {showCustomWeights && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold mb-3">Custom Optimization Weights</h3>
                <p className="text-xs text-gray-600 mb-3">Adjust the importance of each factor (0-1 scale)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(customWeights).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          className="flex-1"
                          value={value}
                          onChange={(e) => {
                            setCustomWeights({
                              ...customWeights,
                              [key]: parseFloat(e.target.value)
                            });
                            debouncedRecalculate(300); // Debounce slider changes
                          }}
                          min="0"
                          max="1"
                          step="0.1"
                          disabled={isRecalculating}
                        />
                        <span className="text-sm text-gray-600 w-8">{value.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      onChange={(e) => updateStock(index, 'length', e.target.value)}
                      min="0"
                      placeholder="0"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={stock.width || ''}
                      onChange={(e) => updateStock(index, 'width', e.target.value)}
                      min="0"
                      placeholder="0"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={stock.thickness || ''}
                      onChange={(e) => updateStock(index, 'thickness', e.target.value)}
                      min="0"
                      placeholder="0"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={stock.quantity || ''}
                      onChange={(e) => updateStock(index, 'quantity', e.target.value)}
                      min="1"
                      placeholder="1"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Material Type</label>
                    <select
                      className="w-full px-2 py-1 border rounded-md"
                      value={stock.materialType || MaterialType.Sheet}
                      onChange={(e) => updateStock(index, 'materialType', e.target.value)}
                      disabled={isRecalculating}
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
                      disabled={isRecalculating}
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
                        disabled={isRecalculating}
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
                    disabled={isRecalculating}
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
                disabled={isRecalculating}
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
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Length (mm)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={part.length || ''}
                      onChange={(e) => updatePart(index, 'length', e.target.value)}
                      min="0"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (mm)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={part.width || ''}
                      onChange={(e) => updatePart(index, 'width', e.target.value)}
                      min="0"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={part.thickness || ''}
                      onChange={(e) => updatePart(index, 'thickness', e.target.value)}
                      min="0"
                      placeholder="18"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded-md"
                      value={part.quantity || ''}
                      onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                      min="1"
                      placeholder="1"
                      disabled={isRecalculating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Material Type</label>
                    <select
                      className="w-full px-2 py-1 border rounded-md"
                      value={part.materialType || MaterialType.Sheet}
                      onChange={(e) => updatePart(index, 'materialType', e.target.value)}
                      disabled={isRecalculating}
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
                      disabled={isRecalculating}
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
                        disabled={isRecalculating}
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
                    disabled={isRecalculating}
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
                disabled={isRecalculating}
              >
                Add Part
              </button>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={calculateOptimalCuts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={isLoading || isRecalculating}
              >
                {isLoading ? 'Calculating...' : isRecalculating ? 'Auto-recalculating...' : 'Calculate Cuts'}
              </button>
              
              <button 
                onClick={saveCalculation}
                className={`px-4 py-2 text-white rounded-md shadow-md transition-colors flex items-center gap-2 ${
                  hasUnsavedChanges 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={!results || !results.success || isRecalculating}
              >
                {hasUnsavedChanges && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
                {isEditing ? 'Update Calculation' : 'Save Calculation'}
                {hasUnsavedChanges && <span className="text-xs">(Unsaved)</span>}
              </button>
            </div>
          </div>
          
          {/* Results display */}
          {results && results.success && (
            <div className="bg-white p-4 rounded-md shadow-md mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cutting Results</h2>
                <div className="flex gap-2">
                  <button
                    onClick={resetAllCutStatus}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Reset All
                  </button>
                </div>
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Sheets Used</div>
                  <div className="text-2xl font-bold text-blue-800">{results.totalUsedSheets}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Parts Placed</div>
                  <div className="text-2xl font-bold text-green-800">
                    {results.stockUsage.reduce((total, usage) => total + usage.placements.length, 0)}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Total Waste</div>
                  <div className="text-2xl font-bold text-orange-800">{Math.round(results.totalWaste / 1000)}cm²</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Efficiency</div>
                  <div className="text-2xl font-bold text-purple-800">
                    {((results.stockUsage.reduce((total, usage) => total + usage.usedArea, 0) / 
                       results.stockUsage.reduce((total, usage) => {
                         const stock = availableStocks[usage.stockIndex];
                         return total + (stock.length * stock.width);
                       }, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Visual Cutting Diagrams */}
              <h3 className="text-lg font-semibold mb-4">Visual Cutting Diagrams</h3>
              {results.stockUsage.map((usage, index) => {
                const stock = availableStocks[usage.stockIndex];
                const scale = Math.min(600 / stock.length, 400 / stock.width);
                const scaledWidth = stock.length * scale;
                const scaledHeight = stock.width * scale;
                
                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-md mb-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-600">
                        Sheet #{index + 1} - {stock.length} × {stock.width} × {stock.thickness}mm
                      </h4>
                      <div className="text-sm text-gray-600">
                        {stock.materialType === MaterialType.Sheet ? 'Sheet Material' : 'Dimensional Lumber'}: {stock.material || 'Unspecified'}
                        {stock.materialType === MaterialType.Sheet && stock.grainDirection && (
                          <span className="ml-2">
                            (Grain: {stock.grainDirection})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Sheet Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>Parts: <span className="font-semibold">{usage.placements.length}</span></div>
                      <div>Used: <span className="font-semibold">{Math.round(usage.usedArea / 1000)}cm²</span></div>
                      <div>Waste: <span className="font-semibold">{Math.round(usage.wasteArea / 1000)}cm²</span></div>
                    </div>

                    {/* Visual Diagram */}
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-300 overflow-hidden">
                      <svg
                        width={scaledWidth + 40}
                        height={scaledHeight + 40}
                        className="border border-gray-400"
                      >
                        {/* Define clip path to prevent overflow */}
                        <defs>
                          <clipPath id={`sheet-clip-${index}`}>
                            <rect
                              x={20}
                              y={20}
                              width={scaledWidth}
                              height={scaledHeight}
                            />
                          </clipPath>
                        </defs>
                        
                        {/* Sheet outline */}
                        <rect
                          x={20}
                          y={20}
                          width={scaledWidth}
                          height={scaledHeight}
                          fill="#f8f9fa"
                          stroke="#343a40"
                          strokeWidth="2"
                        />
                        
                        {/* Grain direction indicator */}
                        {stock.materialType === MaterialType.Sheet && stock.grainDirection && (
                          <g clipPath={`url(#sheet-clip-${index})`}>
                            {stock.grainDirection === 'horizontal' ? (
                              Array.from({length: Math.floor(scaledHeight / 20)}, (_, i) => (
                                <line
                                  key={i}
                                  x1={25}
                                  y1={25 + i * 20}
                                  x2={scaledWidth + 15}
                                  y2={25 + i * 20}
                                  stroke="#e9ecef"
                                  strokeWidth="1"
                                  strokeDasharray="2,2"
                                />
                              ))
                            ) : (
                              Array.from({length: Math.floor(scaledWidth / 20)}, (_, i) => (
                                <line
                                  key={i}
                                  x1={25 + i * 20}
                                  y1={25}
                                  x2={25 + i * 20}
                                  y2={scaledHeight + 15}
                                  stroke="#e9ecef"
                                  strokeWidth="1"
                                  strokeDasharray="2,2"
                                />
                              ))
                            )}
                          </g>
                        )}
                        
                        {/* Part placements - CLIPPED to sheet bounds */}
                        <g clipPath={`url(#sheet-clip-${index})`}>
                          {usage.placements.map((placement, pIndex) => {
                            const partIndex = parseInt(placement.partId.split('-')[1]) || 0;
                            const part = requiredParts[partIndex] || requiredParts[0];
                            const partWidth = placement.rotated ? part.width : part.length;
                            const partHeight = placement.rotated ? part.length : part.width;
                            const color = getPartColor(partIndex);
                            const placementKey = generatePlacementKey(placement, index);
                            const isCut = cutStatus[placementKey] || false;
                            
                            return (
                              <g key={pIndex}>
                                <rect
                                  x={20 + placement.x * scale}
                                  y={20 + placement.y * scale}
                                  width={partWidth * scale}
                                  height={partHeight * scale}
                                  fill={isCut ? '#d4edda' : color.hexBg}
                                  stroke={isCut ? '#28a745' : color.hexBorder}
                                  strokeWidth="2"
                                  className="cursor-pointer transition-all duration-200"
                                  onClick={() => toggleCutStatus(placementKey)}
                                />
                                <text
                                  x={20 + (placement.x + partWidth/2) * scale}
                                  y={20 + (placement.y + partHeight/2) * scale}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="10"
                                  fill={isCut ? '#155724' : '#000'}
                                  className="pointer-events-none select-none"
                                >
                                  {part.name || `P${partIndex + 1}`}
                                </text>
                                {placement.rotated && (
                                  <text
                                    x={20 + (placement.x + partWidth/2) * scale}
                                    y={20 + (placement.y + partHeight/2 + 8) * scale}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="8"
                                    fill={isCut ? '#155724' : '#666'}
                                    className="pointer-events-none select-none"
                                  >
                                    ↻
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                        
                        {/* Dimensions */}
                        <text x={scaledWidth/2 + 20} y={15} textAnchor="middle" fontSize="12" fill="#666">
                          {stock.length}mm
                        </text>
                        <text x={10} y={scaledHeight/2 + 20} textAnchor="middle" fontSize="12" fill="#666" transform={`rotate(-90 10 ${scaledHeight/2 + 20})`}>
                          {stock.width}mm
                        </text>
                      </svg>
                    </div>
                    {/* Cut Progress Tracker */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cut Progress</span>
                        <span className="text-sm text-gray-600">
                          {usage.placements.filter(p => cutStatus[generatePlacementKey(p, index)]).length} / {usage.placements.length} parts cut
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(usage.placements.filter(p => cutStatus[generatePlacementKey(p, index)]).length / usage.placements.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Warning if parts exceed bounds */}
                    {usage.placements.some(placement => {
                      const partIndex = parseInt(placement.partId.split('-')[1]) || 0;
                      const part = requiredParts[partIndex];
                      if (!part) return false;
                      const partWidth = placement.rotated ? part.width : part.length;
                      const partHeight = placement.rotated ? part.length : part.width;
                      return placement.x + partWidth > stock.length || placement.y + partHeight > stock.width;
                    }) && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-400 rounded-md">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Layout Warning</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Some parts appear to extend beyond sheet boundaries. This may be due to the optimization algorithm. 
                              Try switching to "Maximum Yield" optimization or reducing the kerf thickness.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Parts List */}
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Parts on this sheet:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {usage.placements.map((placement, pIndex) => {
                          const partIndex = parseInt(placement.partId.split('-')[1]) || 0;
                          const part = requiredParts[partIndex] || requiredParts[0];
                          const partWidth = placement.rotated ? part.width : part.length;
                          const partHeight = placement.rotated ? part.length : part.width;
                          const color = getPartColor(partIndex);
                          const placementKey = generatePlacementKey(placement, index);
                          const isCut = cutStatus[placementKey] || false;
                          
                          return (
                            <div 
                              key={pIndex} 
                              className={`p-2 rounded-md border-2 cursor-pointer transition-all duration-200 ${
                                isCut ? 'bg-green-100 border-green-500' : `${color.bg} ${color.border}`
                              }`}
                              onClick={() => toggleCutStatus(placementKey)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    {part.name || `Part ${partIndex + 1}`}
                                    {placement.rotated && <span className="ml-1 text-xs">↻</span>}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {partWidth} × {partHeight}mm
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Position: ({placement.x}, {placement.y})
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full ${isCut ? 'bg-green-500' : 'bg-gray-300'}`}>
                                  {isCut && <span className="text-white text-xs">✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Summary Panel */}
              <SummaryPanel 
                placedPartsCount={
                  results.stockUsage.reduce((counts, usage) => {
                    usage.placements.forEach(placement => {
                      const partIndex = parseInt(placement.partId.split('-')[1]) || 0;
                      const part = requiredParts[partIndex] || requiredParts[0];
                      const key = createDimensionKey(part);
                      counts[key] = (counts[key] || 0) + 1;
                    });
                    return counts;
                  }, {} as Record<string, number>)
                }
                requiredParts={requiredParts}
              />
            </div>
          )}

          {results && !results.success && (
            <div className="bg-white p-4 rounded-md shadow-md mb-4">
              <h2 className="text-xl font-semibold mb-4">Results</h2>
              <p className="text-red-600 text-sm">{results.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}