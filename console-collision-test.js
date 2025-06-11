// Manual collision detection test for the browser console
// Copy this entire script and paste it into the browser console at http://localhost:3000

console.log("🔧 COLLISION DETECTION FIX TEST");
console.log("================================");

// Enable debug logging
window.DEBUG_COLLISION = true;
window.DEBUG_PLACEMENT = true;
window.DEBUG_MULTI_SHEET = true;

console.log("✅ Debug logging enabled");

// Test the collision detection by manually calling the optimization function
// First, let's create test data similar to what was causing overlaps

const testStock = [
  {
    name: "Test Sheet",
    length: 2440,
    width: 1220,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "lengthwise",
    materialType: "Sheet Material"
  }
];

const testParts = [
  {
    name: "keith-1",
    length: 300,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "any",
    materialType: "Sheet Material"
  },
  {
    name: "keith-2", 
    length: 300,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "any",
    materialType: "Sheet Material"
  },
  {
    name: "keith-3",
    length: 300,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "any",
    materialType: "Sheet Material"
  },
  {
    name: "keith-4",
    length: 300,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "any",
    materialType: "Sheet Material"
  },
  {
    name: "keith-5",
    length: 300,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "any",
    materialType: "Sheet Material"
  }
];

console.log("📊 Test data prepared:");
console.log("Stock:", testStock);
console.log("Parts:", testParts);

// Import the calculation function
import('./lib/calculateOptimalCuts.js').then((module) => {
  const { calculateOptimalCuts } = module;
  
  console.log("🚀 Running optimization...");
  
  try {
    const testResults = calculateOptimalCuts(testStock, testParts, 3.175);
    
    console.log("✨ Optimization completed!");
    console.log("📊 Results:", testResults);
    
    if (!testResults.success) {
      console.error("❌ Optimization failed:", testResults.message);
      return;
    }
    
    // Check for overlaps
    let hasOverlaps = false;
    let totalPlacements = 0;
    
    console.log("\n🔍 Checking for overlaps...");
    
    if (testResults.usedSheets) {
      testResults.usedSheets.forEach((sheet, sheetIndex) => {
        const placements = sheet.placements;
        totalPlacements += placements.length;
        
        console.log(`\n📋 Sheet ${sheetIndex}: ${placements.length} placements`);
        
        // List all placements
        placements.forEach((p, index) => {
          console.log(`  ${index + 1}. ${p.name}: (${p.x}, ${p.y}) rotated: ${p.rotated}`);
        });
        
        // Check for overlaps
        for (let i = 0; i < placements.length; i++) {
          for (let j = i + 1; j < placements.length; j++) {
            const p1 = placements[i];
            const p2 = placements[j];
            
            // Calculate bounds
            const p1Right = p1.x + 300;
            const p1Bottom = p1.y + 200;
            const p2Right = p2.x + 300;
            const p2Bottom = p2.y + 200;
            
            // Check for overlap with tolerance
            const TOLERANCE = 0.01;
            const xOverlap = !(p1Right <= p2.x + TOLERANCE || p1.x >= p2Right - TOLERANCE);
            const yOverlap = !(p1Bottom <= p2.y + TOLERANCE || p1.y >= p2Bottom - TOLERANCE);
            
            if (xOverlap && yOverlap) {
              console.error(`❌ OVERLAP: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
              hasOverlaps = true;
            } else {
              console.log(`✅ OK: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
            }
          }
        }
      });
    }
    
    console.log(`\n📈 FINAL RESULTS:`);
    console.log(`Total placements: ${totalPlacements}`);
    
    if (hasOverlaps) {
      console.error("❌ COLLISION DETECTION FIX FAILED");
      console.error("🚨 Parts are still overlapping!");
    } else {
      console.log("✅ COLLISION DETECTION FIX SUCCESS");
      console.log("🎉 No overlaps detected!");
    }
    
    // Store results for inspection
    window.testResults = testResults;
    console.log("\n💾 Results stored in window.testResults");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
  
}).catch((error) => {
  console.error("❌ Failed to import calculation module:", error);
  
  // Fallback: try to test using the React app's state if available
  console.log("🔄 Trying fallback approach...");
  
  // Check if we can access the React app's functions
  if (window.React && window.ReactDOM) {
    console.log("🎯 React detected, trying to use app functions...");
    
    // Set the test data in the app and trigger calculation
    // This would require manual interaction but let's provide instructions
    console.log("📝 MANUAL TEST INSTRUCTIONS:");
    console.log("1. Add the following stock:");
    console.log("   Name: Test Sheet, Length: 2440, Width: 1220, Thickness: 18");
    console.log("2. Add 5 parts named keith-1 to keith-5:");
    console.log("   Length: 300, Width: 200, Thickness: 18, Quantity: 1 each");
    console.log("3. Set kerf thickness to 3.175");
    console.log("4. Click 'Calculate Optimal Cuts'");
    console.log("5. Check the visualization for overlapping parts");
  }
});

console.log("⏳ Test script loaded. Running optimization...");
