// Multi-sheet optimization fix test
const { execSync } = require('child_process');
const fs = require('fs');

// Create a test file that we can run
const testContent = `
import { OptimizedCuttingEngine } from './app/lib/optimized-cutting-engine.js';
import { MaterialType } from './app/lib/types.js';

console.log('\\n🧪 === MULTI-SHEET OPTIMIZATION FIX TEST ===');
console.log('Testing: 16 parts (10x 600x400mm + 6x 200x200mm) across 3 sheets\\n');

const testParts = [
  { 
    length: 600, 
    width: 400, 
    quantity: 10,
    material: 'plywood',
    materialType: MaterialType.Sheet,
    thickness: 18,
    grainDirection: 'any'
  },
  { 
    length: 200, 
    width: 200, 
    quantity: 6,
    material: 'plywood',
    materialType: MaterialType.Sheet,
    thickness: 18,
    grainDirection: 'any'
  }
];

const testStock = [
  {
    length: 2440,
    width: 1220,
    thickness: 18,
    material: 'plywood',
    materialType: MaterialType.Sheet,
    quantity: 3,
    grainDirection: 'horizontal'
  }
];

try {
  const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 3.2);
  
  console.log('📈 RESULTS:');
  console.log(\`   Success: \${result.success}\`);
  console.log(\`   Message: \${result.message}\`);
  console.log(\`   Sheets Used: \${result.totalUsedSheets}\\n\`);
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1);
      console.log(\`📄 Sheet \${index + 1}:\`);
      console.log(\`   Parts Placed: \${sheet.placements.length}\`);
      console.log(\`   Efficiency: \${efficiency}%\`);
      console.log(\`   Used Area: \${sheet.usedArea.toLocaleString()}mm²\`);
      console.log(\`   Waste Area: \${sheet.wasteArea.toLocaleString()}mm²\\n\`);
    });
  }
  
  console.log('🔍 ANALYSIS:');
  if (result.totalUsedSheets > 1) {
    console.log('✅ SUCCESS: Parts distributed across multiple sheets!');
    console.log('   The multi-sheet optimization fix is working.');
  } else {
    console.log('❌ ISSUE: Still cramming all parts onto single sheet');
    console.log('   Multi-sheet optimization needs further fixes.');
  }
  
} catch (error) {
  console.error('❌ Error running test:', error.message);
  console.error('Stack:', error.stack);
}
`;

fs.writeFileSync('./test-multi-sheet-fix.mjs', testContent);

console.log('✅ Created test file: test-multi-sheet-fix.mjs');
console.log('To run the test manually: node test-multi-sheet-fix.mjs');
