// Multi-sheet distribution issue test - Node.js compatible version
const { readFileSync } = require('fs');
const path = require('path');

const __dirname = __dirname;

// Simple types
const MaterialType = {
  PLYWOOD: 'plywood',
  MDF: 'mdf',
  CHIPBOARD: 'chipboard'
};

// Read and execute TypeScript code (simplified for testing)
const tsCode = readFileSync(path.join(__dirname, 'app/lib/optimized-cutting-engine.ts'), 'utf8');

// Extract the class implementation
const engineCode = tsCode
  .replace(/import.*from.*['"].*['"];?\n/g, '') // Remove imports
  .replace(/export\s+interface.*\{[\s\S]*?\}/g, '') // Remove interface exports
  .replace(/interface\s+\w+.*\{[\s\S]*?\}/g, '') // Remove interface definitions
  .replace(/export\s+class/g, 'class'); // Remove export from class

// Create a simple implementation for testing
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
    
    // Initialize first sheet
    let currentSheet = {
      stockIndex: 0,
      placements: [],
      usedArea: 0,
      wasteArea: 0,
      freeSpaces: [{
        x: 0, y: 0, 
        width: stocks[0].length, 
        height: stocks[0].width
      }]
    };
    
    // Enhanced placement algorithm with mixed-size optimization
    for (const part of expandedParts) {
      let placed = false;
      
      // Try to place on current sheet
      for (const space of currentSheet.freeSpaces) {
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
          
          // Update free spaces (simplified)
          const newSpaces = [];
          // Right space
          if (space.x + part.length < space.x + space.width) {
            newSpaces.push({
              x: space.x + part.length + kerfWidth,
              y: space.y,
              width: space.width - part.length - kerfWidth,
              height: space.height
            });
          }
          // Bottom space
          if (space.y + part.width < space.y + space.height) {
            newSpaces.push({
              x: space.x,
              y: space.y + part.width + kerfWidth,
              width: part.length,
              height: space.height - part.width - kerfWidth
            });
          }
          
          // Remove used space and add new ones
          currentSheet.freeSpaces = currentSheet.freeSpaces
            .filter(s => s !== space)
            .concat(newSpaces)
            .filter(s => s.width > 0 && s.height > 0);
          
          placedParts.push(part);
          placed = true;
          break;
        }
      }
      
      // If can't place on current sheet, start new sheet
      if (!placed) {
        // Finalize current sheet
        const sheetArea = stocks[0].length * stocks[0].width;
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
            width: stocks[0].length, 
            height: stocks[0].width
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
          if (part.length < space.width) {
            newSpaces.push({
              x: part.length + kerfWidth,
              y: 0,
              width: space.width - part.length - kerfWidth,
              height: space.height
            });
          }
          if (part.width < space.height) {
            newSpaces.push({
              x: 0,
              y: part.width + kerfWidth,
              width: part.length,
              height: space.height - part.width - kerfWidth
            });
          }
          
          currentSheet.freeSpaces = newSpaces.filter(s => s.width > 0 && s.height > 0);
          placedParts.push(part);
        }
      }
    }
    
    // Finalize last sheet
    if (currentSheet.placements.length > 0) {
      const sheetArea = stocks[0].length * stocks[0].width;
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
    quantity: 3, // 3 sheets available
    cost: 80
  }
];

console.log('🧪 TESTING MULTI-SHEET DISTRIBUTION ISSUE');
console.log('📊 Parts: 10x 600x400mm + 6x 200x200mm = 16 total parts');
console.log('📦 Stock: 3x 2440x1220mm sheets available');
console.log('🎯 Expected: Parts should distribute across multiple sheets for better efficiency/practicality');
console.log('');

try {
  const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 3.2);
  
  console.log('📈 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
  console.log('');
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1);
      console.log(`📄 Sheet ${index + 1}:`);
      console.log(`   Parts Placed: ${sheet.placements.length}`);
      console.log(`   Efficiency: ${efficiency}%`);
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
  }
  
  console.log('🔍 ANALYSIS:');
  if (result.totalUsedSheets === 1) {
    console.log('❌ PROBLEM DETECTED: All parts crammed onto single sheet');
    console.log('   This creates practical cutting challenges and may not be optimal');
  } else {
    console.log('✅ Parts properly distributed across multiple sheets');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
