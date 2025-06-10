/**
 * Test for part naming functionality
 * This test verifies that parts can be assigned custom names and that these names
 * are properly propagated through the cutting optimization system.
 */

import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Part, Stock } from '../lib/types';

describe('Part Naming Functionality', () => {
  it('should correctly assign and display custom names for parts', () => {
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 2,
        materialType: MaterialType.Sheet,
        name: 'Cabinet Door' // Custom name
      },
      {
        length: 600,
        width: 200,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        name: 'Shelf Panel' // Custom name
      },
      {
        length: 300,
        width: 150,
        thickness: 18,
        quantity: 3,
        materialType: MaterialType.Sheet
        // No name provided - should use default
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);

    if (results.success) {
      console.log('\n=== PART NAMING TEST RESULTS ===');
      
      // Check that all placements have names
      let totalPlacements = 0;
      let namedPlacements = 0;
      let customNamedPlacements = 0;

      results.stockUsage.forEach((usage, usageIndex) => {
        console.log(`\nSheet ${usageIndex + 1}:`);
        
        usage.placements.forEach((placement, placementIndex) => {
          totalPlacements++;
          
          console.log(`  Placement ${placementIndex + 1}:`);
          console.log(`    - Part ID: ${placement.partId}`);
          console.log(`    - Name: ${placement.name || 'NO NAME'}`);
          
          // Verify placement has a name
          expect(placement.name).toBeDefined();
          expect(placement.name).not.toBe('');
          
          if (placement.name) {
            namedPlacements++;
            
            // Check if it's a custom name or default name
            if (placement.name.startsWith('Cabinet Door') || placement.name.startsWith('Shelf Panel')) {
              customNamedPlacements++;
              console.log(`    - ✓ Custom name detected: ${placement.name}`);
            } else if (placement.name.startsWith('Part-')) {
              console.log(`    - ✓ Default name used: ${placement.name}`);
            } else {
              console.log(`    - ? Unexpected name format: ${placement.name}`);
            }
          }
        });
      });

      console.log(`\n=== NAMING STATISTICS ===`);
      console.log(`Total placements: ${totalPlacements}`);
      console.log(`Named placements: ${namedPlacements}`);
      console.log(`Custom named placements: ${customNamedPlacements}`);
      
      // All placements should have names
      expect(namedPlacements).toBe(totalPlacements);
      
      // Should have some custom names (from Cabinet Door and Shelf Panel)
      expect(customNamedPlacements).toBeGreaterThan(0);
      
      // Total parts should match expected (2 Cabinet Doors + 1 Shelf Panel + 3 unnamed = 6)
      const expectedTotalParts = parts.reduce((sum, part) => sum + part.quantity, 0);
      expect(totalPlacements).toBe(expectedTotalParts);
    }
  });

  it('should handle parts without names by using default naming', () => {
    const stocks: Stock[] = [
      {
        length: 1200,
        width: 600,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 2,
        materialType: MaterialType.Sheet
        // No name property - should use default
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);

    if (results.success) {
      console.log('\n=== DEFAULT NAMING TEST ===');
      
      results.stockUsage.forEach(usage => {
        usage.placements.forEach(placement => {
          console.log(`Placement: ${placement.name}`);
          
          // Should have a default name
          expect(placement.name).toBeDefined();
          expect(placement.name).toMatch(/^Part-\d+$/);
        });
      });
    }
  });

  it('should handle dimensional lumber with custom names', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 100,
        thickness: 50,
        quantity: 1,
        materialType: MaterialType.Dimensional,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 800,
        width: 100,
        thickness: 50,
        quantity: 2,
        materialType: MaterialType.Dimensional,
        name: 'Table Leg'
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);

    if (results.success) {
      console.log('\n=== DIMENSIONAL LUMBER NAMING TEST ===');
      
      results.stockUsage.forEach(usage => {
        usage.placements.forEach(placement => {
          console.log(`Dimensional placement: ${placement.name}`);
          
          // Should have the custom name
          expect(placement.name).toBe('Table Leg');
        });
      });
    }
  });
});
