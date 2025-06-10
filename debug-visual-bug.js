// Debug script to identify the visual rendering disconnect
const fs = require('fs');
const path = require('path');

// Load the calculation function
const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');
const { MaterialType } = require('./app/lib/types.ts');

// Test case: Simple scenario that should show 7-8 parts but might render fewer
const availableStocks = [
  {
    length: 2400,
    width: 1200,
    thickness: 18,
    quantity: 2,
    material: 'Plywood',
    materialType: MaterialType.Sheet
  }
];

const requiredParts = [
  {
    length: 400,
    width: 300,
    thickness: 18,
    quantity: 8,
    material: 'Plywood',
    materialType: MaterialType.Sheet
  }
];

console.log('=== DEBUGGING VISUAL RENDERING BUG ===');
console.log('Test scenario: 8 parts of 400x300mm on 2400x1200mm sheets');

// Run the calculation
const results = calculateOptimalCuts(availableStocks, requiredParts, 3);

if (results.success) {
  console.log('\n=== ALGORITHM RESULTS ===');
  console.log('Total sheets used:', results.totalUsedSheets);
  console.log('Stock usage entries:', results.stockUsage.length);
  
  let totalPlacementsCalculated = 0;
  results.stockUsage.forEach((usage, index) => {
    console.log(`\nSheet ${index + 1} (${usage.sheetId}):`);
    console.log(`  - Stock Index: ${usage.stockIndex}`);
    console.log(`  - Placements: ${usage.placements.length}`);
    console.log(`  - Used Area: ${usage.usedArea}mm²`);
    console.log(`  - Waste Area: ${usage.wasteArea}mm²`);
    
    // List each placement
    usage.placements.forEach((placement, pIndex) => {
      console.log(`    ${pIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y}) ${placement.rotated ? 'ROTATED' : 'NOT ROTATED'}`);
    });
    
    totalPlacementsCalculated += usage.placements.length;
  });
  
  console.log(`\n=== CALCULATED TOTALS ===`);
  console.log(`Total placements calculated: ${totalPlacementsCalculated}`);
  console.log(`Required parts: ${requiredParts[0].quantity}`);
  console.log(`Match: ${totalPlacementsCalculated === requiredParts[0].quantity ? 'YES ✓' : 'NO ✗'}`);
  
  console.log(`\n=== VISUAL RENDERING SIMULATION ===`);
  console.log('Simulating what the visual component would render...');
  
  results.stockUsage.forEach((usage, index) => {
    const stock = availableStocks[usage.stockIndex];
    console.log(`\nSheet ${index + 1} Visualization:`);
    console.log(`  Stock: ${stock.length} × ${stock.width} × ${stock.thickness}mm`);
    console.log(`  Visual rectangles that would be rendered: ${usage.placements.length}`);
    
    // Check if any placements might be rendered outside bounds
    usage.placements.forEach((placement, pIndex) => {
      const part = requiredParts[0]; // We know it's all the same part type
      const width = placement.rotated ? part.width : part.length;
      const height = placement.rotated ? part.length : part.width;
      
      const outsideBounds = 
        placement.x < 0 || 
        placement.y < 0 || 
        placement.x + width > stock.length || 
        placement.y + height > stock.width;
        
      if (outsideBounds) {
        console.log(`    ⚠️  Placement ${pIndex + 1} is OUTSIDE BOUNDS! Position: (${placement.x}, ${placement.y}), Size: ${width}×${height}`);
      }
    });
  });
  
} else {
  console.log('Algorithm failed:', results.message);
}
