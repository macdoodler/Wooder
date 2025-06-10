// Test to verify the three visualization improvements
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Visualization Improvements', () => {
  test('should show correct part numbers in parts placed list', () => {
    const stocks: Stock[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 200,
        width: 150,
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet
      },
      {
        length: 180,
        width: 120,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    expect(results.stockUsage).toHaveLength(1);
    
    const usage = results.stockUsage[0];
    expect(usage.placements.length).toBeGreaterThan(0);

    console.log('\n=== PART NUMBERING VERIFICATION ===');
    console.log('Placements and part number display:');
    usage.placements.forEach((placement, index) => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      const part = results.sortedParts![partIndex];
      
      console.log(`  Placement ${index + 1}:`);
      console.log(`    - PartId: ${placement.partId}`);
      console.log(`    - Extracted partIndex: ${partIndex}`);
      console.log(`    - Will display as: Part #${partIndex + 1}`);
      
      // Verify partIndex is valid
      expect(partIndex).toBeGreaterThanOrEqual(0);
      expect(partIndex).toBeLessThan(results.sortedParts!.length);
      expect(part).toBeDefined();
    });

    // Verify that we don't have all parts showing as "Part #1"
    const displayedPartNumbers = usage.placements.map(placement => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      return partIndex + 1;
    });
    
    console.log(`\nDisplayed part numbers: [${displayedPartNumbers.join(', ')}]`);
    
    if (usage.placements.length > 1) {
      const uniquePartNumbers = new Set(displayedPartNumbers);
      console.log(`Unique part numbers: ${uniquePartNumbers.size}`);
      expect(uniquePartNumbers.size).toBeGreaterThan(1);
      console.log('✓ Multiple different part numbers displayed (not all "Part #1")');
    }
  });
});
