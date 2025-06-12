// Direct test scenario for global distribution fix
// This tests the exact scenario from the conversation summary

console.log('🎯 TESTING GLOBAL DISTRIBUTION FIX - Exact Scenario');
console.log('=====================================================');

// The exact problematic scenario from the conversation summary:
// - 4 bob parts 800×400mm + 24 keith parts 200×200mm
// - BEFORE: 28 parts on sheet 1, 4 keith parts on sheet 2 (poor distribution)
// - AFTER: Should have better distribution across sheets

const exactScenario = {
  stock: [
    {
      length: 2440,
      width: 1220,
      thickness: 18,
      material: 'Plywood',
      grainDirection: 'any',
      quantity: 10
    }
  ],
  parts: [
    // Bob parts (800×400mm) - 4 pieces = 1,280,000 mm²
    { 
      length: 800, 
      width: 400, 
      thickness: 18, 
      quantity: 4, 
      material: 'Plywood', 
      grainDirection: 'any', 
      name: 'bob'
    },
    
    // Keith parts (200×200mm) - 24 pieces = 960,000 mm²  
    { 
      length: 200, 
      width: 200, 
      thickness: 18, 
      quantity: 24, 
      material: 'Plywood', 
      grainDirection: 'any', 
      name: 'keith'
    }
  ]
};

console.log('📊 Scenario Analysis:');
console.log('Bob parts: 4 × 800×400mm = 1,280,000 mm²');
console.log('Keith parts: 24 × 200×200mm = 960,000 mm²');
console.log('Total area: 2,240,000 mm²');
console.log('Sheet area: 2440×1220 = 2,976,800 mm²');
console.log('Theoretical efficiency: 75.3%');
console.log('');

console.log('Expected Results:');
console.log('✅ Global distribution triggered (mixed sizes: 800×400 vs 200×200)');
console.log('✅ Better than 28+4 distribution (e.g., 16+16 or 14+18)');
console.log('✅ More balanced efficiency across sheets');
console.log('✅ Console logs showing global distribution plan');
console.log('');

console.log('🔍 Global Distribution Trigger Conditions:');
const bobArea = 800 * 400; // 320,000
const keithArea = 200 * 200; // 40,000
const sizeRatio = bobArea / keithArea; // 8.0
console.log(`Size ratio: ${sizeRatio} (should be > 2.5 ✅)`);
console.log(`Total parts: 28 (should be >= 6 ✅)`);
console.log(`Mixed sizes: Yes ✅`);
console.log('Should trigger global distribution planning!');
console.log('');

console.log('🌐 Test this exact scenario in the web interface:');
console.log('1. Add Stock: 10 sheets of 2440×1220×18mm Plywood');
console.log('2. Add Parts: 4×bob (800×400×18mm) + 24×keith (200×200×18mm)');
console.log('3. Run optimization');
console.log('4. Check console for "[GLOBAL-DISTRIBUTION]" logs');
console.log('5. Verify parts distributed across multiple sheets');

export { exactScenario };
