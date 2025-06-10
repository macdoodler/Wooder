// Test the floating point precision fix
// This script tests the algorithm directly without needing the full Next.js environment

const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts');
const { MaterialType } = require('./app/lib/types');

console.log('🔧 === FLOATING POINT PRECISION FIX TEST ===\n');

// Test data that reproduces the original issue
const testStock = [
  {
    length: 2440,
    width: 1220,
    thickness: 18,
    quantity: 3,
    material: "Plywood",
    materialType: MaterialType.Sheet
  }
];

const testParts = [
  {
    name: "Large Panel",
    length: 800,
    width: 400,
    thickness: 18,
    quantity: 6, // This was the problematic quantity
    material: "Plywood",
    materialType: MaterialType.Sheet
  },
  {
    name: "Small Panel", 
    length: 200,
    width: 200,
    thickness: 18,
    quantity: 4, // These parts were failing to place
    material: "Plywood",
    materialType: MaterialType.Sheet
  }
];

console.log('📋 Test Case: 6x 800x400mm + 4x 200x200mm parts');
console.log('🎯 Expected: All 10 parts should be placed successfully\n');

try {
  const result = calculateOptimalCuts(testStock, testParts, 3.2);
  
  console.log('=== RESULTS ===');
  console.log(`Success: ${result.success}`);
  
  if (result.success) {
    const totalPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const expectedTotal = testParts.reduce((sum, part) => sum + part.quantity, 0);
    
    console.log(`✅ SUCCESS: Algorithm completed successfully`);
    console.log(`📊 Parts placed: ${totalPlaced}/${expectedTotal}`);
    
    if (totalPlaced === expectedTotal) {
      console.log('🎉 FLOATING POINT PRECISION FIX CONFIRMED WORKING!');
      
      // Analyze placement details
      result.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1}:`);
        console.log(`  Placements: ${usage.placements.length}`);
        console.log(`  Efficiency: ${usage.efficiency?.toFixed(1)}% `);
        
        let largePanels = 0, smallPanels = 0;
        usage.placements.forEach(placement => {
          if (placement.name?.includes('Large')) largePanels++;
          if (placement.name?.includes('Small')) smallPanels++;
        });
        console.log(`  Large panels: ${largePanels}, Small panels: ${smallPanels}`);
      });
      
    } else {
      console.log(`⚠️  Partial success: ${totalPlaced}/${expectedTotal} parts placed`);
    }
    
  } else {
    console.log(`❌ ALGORITHM FAILED: ${result.message}`);
    console.log('🔍 This indicates the floating point fix may not be complete');
  }
  
} catch (error) {
  console.error('❌ ERROR during test:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n=== FIX SUMMARY ===');
console.log('✨ Added 0.01mm floating point tolerance to collision detection');
console.log('🎯 This resolves microscopic precision errors that were preventing placement');
console.log('🔧 The fix is in PlacementEngine.hasCollision() method');
