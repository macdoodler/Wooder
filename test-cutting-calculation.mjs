#!/usr/bin/env node
// Test cutting calculation functionality after algorithm consolidation

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.ts';

console.log('🧪 Testing Cutting Calculation After Consolidation...\n');

// Test with simple parts
const testParts = [
  {
    name: "Test Part 1",
    length: 300,
    width: 200,
    thickness: 18,
    quantity: 2,
    material: "Plywood",
    grainDirection: "horizontal"
  },
  {
    name: "Test Part 2", 
    length: 150,
    width: 100,
    thickness: 18,
    quantity: 1,
    material: "Plywood",
    grainDirection: "horizontal"
  }
];

const testStock = [
  {
    id: "stock-1",
    length: 1200,
    width: 800,
    thickness: 18,
    quantity: 2,
    material: "Plywood",
    materialType: "Sheet",
    grainDirection: "horizontal"
  }
];

try {
  console.log('Testing calculateOptimalCuts...');
  const result = calculateOptimalCuts(testParts, testStock, 3.2);
  
  console.log('✅ Cutting calculation SUCCESS!');
  console.log(`- Sheets used: ${result.stockUsage.length}`);
  console.log(`- Total parts placed: ${result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0)}`);
  console.log(`- Efficiency: ${result.overallEfficiency?.toFixed(1)}%`);
  
} catch (error) {
  console.error('❌ Cutting calculation FAILED:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
