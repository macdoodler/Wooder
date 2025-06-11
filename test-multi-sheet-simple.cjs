// test-multi-sheet-simple.cjs

// Create a simple cutting engine for testing
const OptimizedCuttingEngine = {
  executeOptimization: function(stocks, parts, kerfWidth = 3.2) {
    console.log('🔧 INITIALIZING ADVANCED CUTTING OPTIMIZATION...');
    
    // Process parts to expand quantities
    const expandedParts = [];
    parts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({
          partId: `${part.partIndex}-${i}`,
          length: part.length,
          width: part.width,
          material: part.material,
          thickness: part.thickness,
          grainDirection: part.grainDirection || 'any',
          priority: part.priority || 1,
          area: part.length * part.width
        });
      }
    });

    console.log(`📋 Processing ${expandedParts.length} parts total`);
    
    // Sort parts by area (largest first for better packing)
    expandedParts.sort((a, b) => b.area - a.area);
    
    const stockUsage = [];
    const placedParts = [];
    
    // Sheet dimensions
    const sheetWidth = stocks[0].length;  // 2440
    const sheetHeight = stocks[0].width;  // 1220
    const sheetArea = sheetWidth * sheetHeight;
    
    // Initialize first sheet
    let currentSheet = {
      stockIndex: 0,
      placements: [],
      usedArea: 0,
      wasteArea: 0,
      freeSpaces: [{
        x: 0, y: 0, 
        width: sheetWidth, 
        height: sheetHeight
      }]
    };
    
    console.log(`📏 Sheet dimensions: ${sheetWidth}x${sheetHeight}mm (${(sheetArea/1000000).toFixed(1)}m²)`);
    
    // Enhanced placement algorithm with mixed-size optimization
    for (const part of expandedParts) {
      let placed = false;
      
      // Try to place on current sheet
      for (let i = 0; i < currentSheet.freeSpaces.length; i++) {
        const space = currentSheet.freeSpaces[i];
        
        // Check if part fits in this space
        if (space.width >= part.length && space.height >= part.width) {
          // Place part
          currentSheet.placements.push({
            partId: part.partId,
            x: space.x,
            y: space.y,
            width: part.length,
            height: part.width,
            rotation: 0
          });
          
          currentSheet.usedArea += part.area;
          
          // Calculate remaining spaces after placing part
          const newSpaces = [];
          
          // Right space (if part doesn't fill full width)
          if (space.x + part.length + kerfWidth < space.x + space.width) {
            newSpaces.push({
              x: space.x + part.length + kerfWidth,
              y: space.y,
              width: space.width - part.length - kerfWidth,
              height: space.height
            });
          }
          
          // Bottom space (if part doesn't fill full height)
          if (space.y + part.width + kerfWidth < space.y + space.height) {
            newSpaces.push({
              x: space.x,
              y: space.y + part.width + kerfWidth,
              width: part.length,
              height: space.height - part.width - kerfWidth
            });
          }
          
          // Remove used space and add new ones
          currentSheet.freeSpaces.splice(i, 1);
          currentSheet.freeSpaces = currentSheet.freeSpaces
            .concat(newSpaces)
            .filter(s => s.width > 50 && s.height > 50); // Minimum viable space
          
          placedParts.push(part);
          placed = true;
          console.log(`✓ Placed ${part.partId} (${part.length}x${part.width}mm) at (${space.x}, ${space.y})`);
          break;
        }
      }
      
      // If can't place on current sheet, start new sheet
      if (!placed) {
        console.log(`📄 Sheet ${stockUsage.length + 1} completed - starting new sheet for ${part.partId}`);
        
        // Finalize current sheet
        currentSheet.wasteArea = sheetArea - currentSheet.usedArea;
        stockUsage.push(currentSheet);
        
        // Start new sheet
        currentSheet = {
          stockIndex: stockUsage.length,
          placements: [],
          usedArea: 0,
          wasteArea: 0,
          freeSpaces: [{
            x: 0, y: 0, 
            width: sheetWidth, 
            height: sheetHeight
          }]
        };
        
        // Try to place part on new sheet
        const space = currentSheet.freeSpaces[0];
        if (space.width >= part.length && space.height >= part.width) {
          currentSheet.placements.push({
            partId: part.partId,
            x: 0,
            y: 0,
            width: part.length,
            height: part.width,
            rotation: 0
          });
          
          currentSheet.usedArea += part.area;
          
          // Update free spaces
          const newSpaces = [];
          if (part.length + kerfWidth < space.width) {
            newSpaces.push({
              x: part.length + kerfWidth,
              y: 0,
              width: space.width - part.length - kerfWidth,
              height: space.height
            });
          }
          if (part.width + kerfWidth < space.height) {
            newSpaces.push({
              x: 0,
              y: part.width + kerfWidth,
              width: part.length,
              height: space.height - part.width - kerfWidth
            });
          }
          
          currentSheet.freeSpaces = newSpaces.filter(s => s.width > 50 && s.height > 50);
          placedParts.push(part);
          console.log(`✓ Placed ${part.partId} (${part.length}x${part.width}mm) on new sheet`);
        } else {
          console.log(`❌ ERROR: Cannot place ${part.partId} even on new sheet!`);
        }
      }
    }
    
    // Finalize last sheet
    if (currentSheet.placements.length > 0) {
      currentSheet.wasteArea = sheetArea - currentSheet.usedArea;
      stockUsage.push(currentSheet);
    }
    
    return {
      success: placedParts.length === expandedParts.length,
      message: `Placed ${placedParts.length}/${expandedParts.length} parts on ${stockUsage.length} sheets`,
      totalUsedSheets: stockUsage.length,
      stockUsage: stockUsage,
      placements: placedParts,
      totalWasteArea: stockUsage.reduce((sum, sheet) => sum + sheet.wasteArea, 0)
    };
  }
};

// Test case: 16 parts (10x 600x400mm + 6x 200x200mm) should distribute across multiple sheets
const testParts = [
  { 
    partIndex: 0, 
    length: 600, 
    width: 400, 
    quantity: 10,
    material: 'plywood',
    thickness: 18,
    grainDirection: 'any',
    priority: 1 
  },
  { 
    partIndex: 1, 
    length: 200, 
    width: 200, 
    quantity: 6,
    material: 'plywood',
    thickness: 18,
    grainDirection: 'any',
    priority: 1 
  }
];

const testStock = [
  {
    stockIndex: 0,
    length: 2440,
    width: 1220,
    thickness: 18,
    material: 'plywood',
    quantity: 5, // 5 sheets available
    cost: 80
  }
];

console.log('🧪 TESTING MULTI-SHEET DISTRIBUTION ISSUE');
console.log('📊 Parts: 10x 600x400mm + 6x 200x200mm = 16 total parts');
console.log('📦 Stock: 5x 2440x1220mm sheets available');
console.log('🎯 Target: 4 sheets max with 85%+ efficiency per sheet');
console.log('');

try {
  const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 3.2);
  
  console.log('');
  console.log('📈 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
  console.log('');
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    let totalEfficiency = 0;
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100);
      totalEfficiency += efficiency;
      
      console.log(`📄 Sheet ${index + 1}:`);
      console.log(`   Parts Placed: ${sheet.placements.length}`);
      console.log(`   Efficiency: ${efficiency.toFixed(1)}%`);
      console.log(`   Used Area: ${sheet.usedArea.toLocaleString()}mm²`);
      console.log(`   Waste Area: ${sheet.wasteArea.toLocaleString()}mm²`);
      
      // Show part breakdown
      const partCounts = {};
      sheet.placements.forEach(placement => {
        const partType = placement.partId.includes('0-') ? '600x400mm' : '200x200mm';
        partCounts[partType] = (partCounts[partType] || 0) + 1;
      });
      
      console.log(`   Part breakdown:`, partCounts);
      console.log('');
    });
    
    const avgEfficiency = (totalEfficiency / result.stockUsage.length).toFixed(1);
    console.log(`📊 Average Efficiency: ${avgEfficiency}%`);
  }
  
  console.log('🔍 ANALYSIS:');
  
  // Current performance analysis
  if (result.totalUsedSheets > 4) {
    console.log(`❌ EFFICIENCY ISSUE: Using ${result.totalUsedSheets} sheets (target: 4 max)`);
  } else if (result.totalUsedSheets <= 4) {
    console.log(`✅ Sheet count: ${result.totalUsedSheets}/4 sheets (within target)`);
  }
  
  // Check individual sheet efficiency
  let lowEfficiencySheets = 0;
  if (result.stockUsage) {
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100);
      if (efficiency < 85) {
        lowEfficiencySheets++;
      }
    });
  }
  
  if (lowEfficiencySheets > 0) {
    console.log(`❌ EFFICIENCY ISSUE: ${lowEfficiencySheets} sheets below 85% efficiency`);
    console.log('   Need: Better space filling algorithms for mixed-size parts');
  } else {
    console.log('✅ All sheets meet 85%+ efficiency target');
  }
  
  console.log('');
  console.log('🎯 OPTIMIZATION NEEDED:');
  console.log('• Implement shared cut line optimization');
  console.log('• Enhance mixed-size bin packing algorithms');
  console.log('• Add gap-filling optimization for small parts');
  console.log('• Implement kerf-aware space calculation');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
