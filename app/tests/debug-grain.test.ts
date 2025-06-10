/**
 * Simple debug test to understand why the algorithm is failing
 */

import { calculateOptimalCuts } from "../lib/calculateOptimalCuts";
import { Stock, Part } from "../lib/types";

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

test("should debug simple grain direction case", () => {
  const stock: Stock = {
    id: "test-stock",
    length: 2400,
    width: 1200,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "horizontal"
  };

  const part: Part = {
    length: 800,
    width: 400,
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "horizontal"
  };

  const result = calculateOptimalCuts([stock], [part], 3);
  
  console.log("Result:", JSON.stringify(result, null, 2));
  
  if (!result.success) {
    console.log("Error message:", result.message);
  }
  
  expect(result).toBeDefined();
});
