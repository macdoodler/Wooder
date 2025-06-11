// Browser-based collision detection test
// Copy and paste this into the browser console at http://localhost:3000

console.log("🔧 Starting collision detection fix test...");

// Enable debug logging
window.DEBUG_COLLISION = true;
window.DEBUG_PLACEMENT = true;
window.DEBUG_MULTI_SHEET = true;

// Test data - 5 identical parts that were causing overlaps
const testData = {
  parts: [
    { name: "keith", length: 300, width: 200, thickness: 18, material: "Plywood", quantity: 5, grainDirection: "any" }
  ],
  stock: [
    { name: "Sheet 1", length: 2440, width: 1220, thickness: 18, material: "Plywood", quantity: 1, grainDirection: "lengthwise" }
  ],
  kerfThickness: 3.175
};

console.log("📊 Test data:", testData);

// Function to check for overlaps
function checkForOverlaps(results) {
  if (!results || !results.usedSheets) {
    console.error("❌ No results to check");
    return false;
  }

  let hasOverlaps = false;
  let totalPlacements = 0;

  console.log("\n🔍 Checking for overlaps...");

  results.usedSheets.forEach((sheet, sheetIndex) => {
    const placements = sheet.placements;
    totalPlacements += placements.length;

    console.log(`\n📋 Sheet ${sheetIndex}: ${placements.length} placements`);

    // List all placements first
    placements.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name}: (${p.x}, ${p.y}) rotated: ${p.rotated}`);
    });

    // Check each placement against every other placement
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];

        // Calculate bounds for each placement (using 300x200 for keith parts)
        const p1Right = p1.x + 300;
        const p1Bottom = p1.y + 200;
        const p2Right = p2.x + 300;
        const p2Bottom = p2.y + 200;

        // Check for overlap with tolerance
        const TOLERANCE = 0.01;
        const xOverlap = !(p1Right <= p2.x + TOLERANCE || p1.x >= p2Right - TOLERANCE);
        const yOverlap = !(p1Bottom <= p2.y + TOLERANCE || p1.y >= p2Bottom - TOLERANCE);

        if (xOverlap && yOverlap) {
          console.error(`❌ OVERLAP DETECTED: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
          hasOverlaps = true;
        } else {
          console.log(`✅ No overlap: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
        }
      }
    }
  });

  console.log(`\n📈 Summary: ${totalPlacements} total placements checked`);
  if (hasOverlaps) {
    console.error("❌ COLLISION DETECTION FIX FAILED - Overlaps still detected");
    return false;
  } else {
    console.log("✅ COLLISION DETECTION FIX SUCCESS - No overlaps found");
    return true;
  }
}

// Run the test
console.log("🚀 Running API call...");

fetch('/api/calculations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
})
.then(results => {
  console.log("✨ Optimization completed!");
  console.log("📊 Full results:", results);
  
  const success = checkForOverlaps(results);
  
  if (success) {
    console.log("\n🎉 COLLISION DETECTION FIX VERIFIED SUCCESSFUL!");
    console.log("🔧 The overlap issue has been resolved");
  } else {
    console.error("\n💥 COLLISION DETECTION FIX FAILED!");
    console.error("🚨 Overlaps are still occurring");
  }
  
  // Store results globally for inspection
  window.testResults = results;
  console.log("\n💾 Results stored in window.testResults for inspection");
})
.catch(error => {
  console.error("❌ Test failed:", error);
  console.error("🚨 Error details:", error.message);
});

console.log("⏳ Test initiated... waiting for results...");
