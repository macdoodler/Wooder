// Debug script to trace material constraint issue
import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from './app/lib/types';

// Simplified test case to debug the material constraint issue
const stocks: Stock[] = [
  {
    id: '1',
    material: 'Plywood',
    materialType: MaterialType.Sheet,
    length: 1200,
    width: 800,
    thickness: 18,
    grainDirection: 'horizontal',
    quantity: 1
  },
  {
    id: '2',
    material: 'MDF',
    materialType: MaterialType.Sheet,
    length: 1200,
    width: 800,
    thickness: 18,
    grainDirection: 'none',
    quantity: 1
  }
];

const parts: Part[] = [
  // Part 0: Plywood
  {
    length: 600,
    width: 400,
    thickness: 18,
    quantity: 1,
    material: 'Plywood',
    materialType: MaterialType.Sheet,
    grainDirection: 'horizontal'
  },
  // Part 1: MDF  
  {
    length: 500,
    width: 350,
    thickness: 18,
    quantity: 1,
    material: 'MDF',
    materialType: MaterialType.Sheet,
    grainDirection: 'none'
  }
];

console.log('\n=== DEBUGGING MATERIAL CONSTRAINT ISSUE ===');
console.log('Stock 0: Plywood');
console.log('Stock 1: MDF');
console.log('Part 0: Plywood 600x400');
console.log('Part 1: MDF 500x350');
console.log('\nExpected result:');
console.log('- Part 0 should be placed on Stock 0 (Plywood)');
console.log('- Part 1 should be placed on Stock 1 (MDF)');

const result = calculateOptimalCuts(stocks, parts, 3);

console.log('\n=== ACTUAL RESULT ===');
if (result.success) {
  result.stockUsage.forEach((usage, index) => {
    const stock = stocks[usage.stockIndex];
    console.log(`\nSheet ${usage.sheetId} uses Stock #${usage.stockIndex} (${stock.material}):`);
    
    usage.placements.forEach(placement => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      const originalPart = parts[partIndex]; // Use original parts array, not sorted
      console.log(`  - ${placement.partId}: Original Part-${partIndex} (${originalPart.material}) placed on ${stock.material} stock`);
      
      if (originalPart.material !== stock.material) {
        console.log(`    ❌ MATERIAL MISMATCH! ${originalPart.material} part on ${stock.material} stock`);
      } else {
        console.log(`    ✅ Material match: ${originalPart.material} part on ${stock.material} stock`);
      }
    });
  });
} else {
  console.log('Calculation failed:', result.message);
}
