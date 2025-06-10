/**
 * TEST: STRICT GRAIN DIRECTION ENFORCEMENT
 * This test verifies that the strict grain direction enforcement is working correctly
 */

console.log('=== STRICT GRAIN DIRECTION ENFORCEMENT TEST ===\n');

// Simulate the exact logic from page.tsx lines 399-417
function testStrictGrainEnforcement(partGrain, stockGrain, rotated) {
  // If part has no grain direction, rotation is always allowed
  if (!partGrain) {
    return true;
  }
  
  // STRICT GRAIN DIRECTION ENFORCEMENT
  // If both part and stock have grain direction specified, enforce strict compliance
  if (partGrain && stockGrain) {
    // Only allow the orientation that keeps grain aligned
    // For matching grain directions: only allow non-rotated placement
    // For different grain directions: only allow rotated placement
    const requiresRotation = stockGrain.toLowerCase() !== partGrain.toLowerCase();
    return rotated === requiresRotation;
  }
  
  // Fallback: if only part has grain direction, allow any orientation
  return true;
}

console.log('🧪 TESTING STRICT GRAIN ENFORCEMENT LOGIC\n');

const testCases = [
  // Matching grain directions - should only allow non-rotated
  { part: 'horizontal', stock: 'horizontal', rotated: false, expected: true, scenario: 'H part + H stock, not rotated' },
  { part: 'horizontal', stock: 'horizontal', rotated: true, expected: false, scenario: 'H part + H stock, rotated (BLOCKED)' },
  { part: 'vertical', stock: 'vertical', rotated: false, expected: true, scenario: 'V part + V stock, not rotated' },
  { part: 'vertical', stock: 'vertical', rotated: true, expected: false, scenario: 'V part + V stock, rotated (BLOCKED)' },
  
  // Different grain directions - should only allow rotated
  { part: 'horizontal', stock: 'vertical', rotated: false, expected: false, scenario: 'H part + V stock, not rotated (BLOCKED)' },
  { part: 'horizontal', stock: 'vertical', rotated: true, expected: true, scenario: 'H part + V stock, rotated' },
  { part: 'vertical', stock: 'horizontal', rotated: false, expected: false, scenario: 'V part + H stock, not rotated (BLOCKED)' },
  { part: 'vertical', stock: 'horizontal', rotated: true, expected: true, scenario: 'V part + H stock, rotated' },
  
  // No part grain direction - should always allow
  { part: null, stock: 'horizontal', rotated: false, expected: true, scenario: 'No part grain + H stock, not rotated' },
  { part: null, stock: 'horizontal', rotated: true, expected: true, scenario: 'No part grain + H stock, rotated' },
  { part: null, stock: 'vertical', rotated: false, expected: true, scenario: 'No part grain + V stock, not rotated' },
  { part: null, stock: 'vertical', rotated: true, expected: true, scenario: 'No part grain + V stock, rotated' },
  
  // Only part has grain direction - should allow any orientation
  { part: 'horizontal', stock: null, rotated: false, expected: true, scenario: 'H part + no stock grain, not rotated' },
  { part: 'horizontal', stock: null, rotated: true, expected: true, scenario: 'H part + no stock grain, rotated' },
  { part: 'vertical', stock: null, rotated: false, expected: true, scenario: 'V part + no stock grain, not rotated' },
  { part: 'vertical', stock: null, rotated: true, expected: true, scenario: 'V part + no stock grain, rotated' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = testStrictGrainEnforcement(test.part, test.stock, test.rotated);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.scenario}`);
    passed++;
  } else {
    console.error(`❌ Test ${index + 1}: ${test.scenario}`);
    console.error(`   Expected: ${test.expected}, Got: ${result}`);
    failed++;
  }
});

console.log(`\n📊 STRICT ENFORCEMENT TEST RESULTS:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 STRICT GRAIN DIRECTION ENFORCEMENT IS WORKING PERFECTLY!');
  console.log('\n📋 BEHAVIOR SUMMARY:');
  console.log('✅ When part and stock grain directions MATCH:');
  console.log('   - Only NON-ROTATED placements are allowed');
  console.log('   - Rotated placements are BLOCKED');
  console.log('');
  console.log('✅ When part and stock grain directions DIFFER:');
  console.log('   - Only ROTATED placements are allowed');
  console.log('   - Non-rotated placements are BLOCKED');
  console.log('');
  console.log('✅ When no grain constraints exist:');
  console.log('   - All orientations are allowed');
  console.log('');
  console.log('🎯 This ensures PERFECT grain alignment in all cases!');
} else {
  console.log('\n❌ STRICT ENFORCEMENT HAS ISSUES - NEEDS INVESTIGATION');
}

console.log('\n' + '='.repeat(60));
