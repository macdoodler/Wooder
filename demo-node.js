// Node.js demo script to test the cut sequence optimization feature
const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');
const { MaterialType } = require('./app/lib/types.ts');

// Mock window for Node.js environment
global.window = { DEBUG_CUTTING: false };

console.log('🔧 Cut Sequence Optimization Demo\n');

// Demo 1: Sheet Material Cutting
console.log('=== Demo 1: Sheet Material Cutting ===');
const sheetStocks = [
  {
    length: 2400,
    width: 1200,
    thickness: 18,
    quantity: 1,
    material: 'Plywood',
    materialType: 'sheet',
    grainDirection: 'horizontal'
  }
];

const sheetParts = [
  {
    length: 600,
    width: 400,
    thickness: 18,
    quantity: 2,
    material: 'Plywood',
    materialType: 'sheet',
    grainDirection: 'horizontal',
    name: 'Cabinet Door'
  },
  {
    length: 800,
    width: 300,
    thickness: 18,
    quantity: 1,
    material: 'Plywood',
    materialType: 'sheet',
    grainDirection: 'horizontal',
    name: 'Shelf Panel'
  }
];

const sheetResult = calculateOptimalCuts(sheetStocks, sheetParts, 3);

if (sheetResult.success && sheetResult.cutSequences) {
  console.log(`✅ Successfully generated ${sheetResult.cutSequences.length} cutting sequence(s)`);
  
  sheetResult.cutSequences.forEach((sequence, index) => {
    console.log(`\nSequence ${index + 1}: ${sequence.sheetId}`);
    console.log(`  Steps: ${sequence.totalSteps}`);
    console.log(`  Safety Score: ${sequence.safetyScore}/10`);
    console.log(`  Efficiency Score: ${sequence.efficiencyScore}/10`);
    console.log(`  Estimated Time: ${sequence.estimatedTime} minutes`);
    
    console.log(`  Cutting Steps:`);
    sequence.steps.forEach((step, stepIndex) => {
      console.log(`    ${step.stepNumber}. ${step.description} (${step.cutType.toUpperCase()})`);
      if (step.safetyNotes && step.safetyNotes.length > 0) {
        console.log(`       ⚠️  ${step.safetyNotes[0]}`);
      }
    });
    
    if (sequence.recommendations && sequence.recommendations.length > 0) {
      console.log(`  Recommendations:`);
      sequence.recommendations.forEach(rec => {
        console.log(`    💡 ${rec}`);
      });
    }
  });
} else {
  console.log('❌ Failed to generate cut sequences for sheet material');
}

console.log('\n🎉 Cut Sequence Optimization Demo Complete!');
console.log('\nThe feature provides:');
console.log('- Step-by-step cutting instructions');
console.log('- Safety notes and warnings');
console.log('- Tool suggestions');
console.log('- Efficiency and safety scoring');
console.log('- Time estimates');
console.log('- Personalized recommendations');
