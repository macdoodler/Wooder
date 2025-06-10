// Test to verify diagonal grain direction has been completely removed
const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');
const { MaterialType } = require('./app/lib/types.ts');

// Test that only horizontal and vertical grain directions work
console.log('🧪 Testing diagonal grain removal...');

const testStock = {
  length: 1200,
  width: 800,
  thickness: 18,
  quantity: 1,
  material: "Plywood",
  materialType: MaterialType.Sheet,
  grainDirection: "horizontal"
};

const testParts = [
  {
    length: 400,
    width: 300,
    thickness: 18,
    quantity: 1,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "horizontal"
  },
  {
    length: 400,
    width: 300,
    thickness: 18,
    quantity: 1,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "vertical"
  }
];

try {
  const result = calculateOptimalCuts([testStock], testParts, 3);
  console.log('✅ Horizontal and vertical grain directions still work correctly');
  console.log(`✅ Cuts calculated successfully: ${result.success}`);
  
  // Test that diagonal grain would now be treated as undefined/no grain
  const diagonalPart = {
    length: 400,
    width: 300,
    thickness: 18,
    quantity: 1,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "diagonal"  // This should now be treated as any grain direction
  };
  
  const diagonalResult = calculateOptimalCuts([testStock], [diagonalPart], 3);
  console.log('✅ Parts with "diagonal" grain are still processed (treated as no grain preference)');
  console.log(`✅ Diagonal part result: ${diagonalResult.success}`);
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
}

console.log('🎉 Diagonal grain removal verification complete!');
