import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

describe('Quantity Fix Verification', () => {
  test('should generate unique part IDs for multiple quantities', () => {
    console.log('\n🔧 TESTING QUANTITY FIX VERIFICATION');
    console.log('=====================================\n');

    // Recreate the exact scenario from the user's input
    const availableStocks = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    const requiredParts = [
      {
        name: 'Part 1',
        length: 800,
        width: 400,
        thickness: 18,
        quantity: 2, // This should create Part-0-0 and Part-0-1, not two Part-0-0s
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    console.log('📋 Test Scenario:');
    console.log('Available Stocks:', availableStocks);
    console.log('Required Parts:', requiredParts);
    console.log('\n🎯 Expected Result:');
    console.log('- Part-0-0 should be placed on one sheet');
    console.log('- Part-0-1 should be placed on same or different sheet');
    console.log('- NO duplicate Part-0-0 should exist');
    console.log('- Both parts should fit on a single sheet efficiently\n');

    const result = calculateOptimalCuts(availableStocks, requiredParts, 0);
    
    console.log('\n🧪 TEST RESULTS:');
    console.log('===============');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    console.log(`Total Sheets Used: ${result.totalUsedSheets}`);
    
    expect(result.success).toBe(true);
    
    if (result.success && result.stockUsage) {
      console.log(`\n📊 Sheet Usage Analysis:`);
      
      // Collect all part IDs across all sheets
      const allPartIds: string[] = [];
      const partIdCounts: Record<string, number> = {};
      
      result.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`\n🔸 Sheet #${sheetIndex + 1} (${usage.sheetId}):`);
        console.log(`   Parts placed: ${usage.placements.length}`);
        console.log(`   Used area: ${usage.usedArea} mm²`);
        console.log(`   Waste area: ${usage.wasteArea} mm²`);
        
        usage.placements.forEach((placement, placementIndex) => {
          console.log(`   ${placementIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y}) - Rotated: ${placement.rotated}`);
          
          // Track part IDs for duplicate detection
          allPartIds.push(placement.partId);
          partIdCounts[placement.partId] = (partIdCounts[placement.partId] || 0) + 1;
        });
      });
      
      console.log(`\n🔍 PART ID ANALYSIS:`);
      console.log('==================');
      console.log(`Total parts placed: ${allPartIds.length}`);
      console.log(`Unique part IDs: ${Object.keys(partIdCounts).length}`);
      
      // Check for duplicates
      const duplicates = Object.entries(partIdCounts).filter(([id, count]) => count > 1);
      
      if (duplicates.length > 0) {
        console.log(`\n❌ DUPLICATE PART IDS FOUND:`);
        duplicates.forEach(([id, count]) => {
          console.log(`   ${id}: appears ${count} times`);
        });
        console.log(`\n🚨 THE FIX DID NOT WORK - DUPLICATES STILL EXIST`);
        fail('Duplicate part IDs found');
      } else {
        console.log(`\n✅ NO DUPLICATE PART IDS FOUND`);
        
        // Verify correct part ID sequence
        const partIds = Object.keys(partIdCounts).sort();
        console.log(`Part IDs found: ${partIds.join(', ')}`);
        
        const expectedPartIds = ['Part-0-0', 'Part-0-1'];
        const hasCorrectIds = expectedPartIds.every(id => partIds.includes(id));
        
        if (hasCorrectIds) {
          console.log(`\n🎉 SUCCESS: The fix is working correctly!`);
          console.log(`✅ Found expected part IDs: ${expectedPartIds.join(', ')}`);
          
          // Check efficiency
          const totalPartsPlaced = allPartIds.length;
          const requiredPartsTotal = requiredParts.reduce((sum, part) => sum + part.quantity, 0);
          
          expect(totalPartsPlaced).toBe(requiredPartsTotal);
          console.log(`✅ Correct quantity: ${totalPartsPlaced}/${requiredPartsTotal} parts placed`);
          
          // Check if they fit on single sheet (efficiency)
          if (result.stockUsage.length === 1) {
            console.log(`✅ Optimal sheet usage: All parts fit on 1 sheet`);
          } else {
            console.log(`⚠️  Using ${result.stockUsage.length} sheets when 1 should suffice`);
          }
          
        } else {
          console.log(`\n⚠️  PARTIAL SUCCESS: No duplicates but unexpected part IDs`);
          console.log(`Expected: ${expectedPartIds.join(', ')}`);
          console.log(`Found: ${partIds.join(', ')}`);
          fail('Expected part IDs not found');
        }
      }
      
      // Assertions for automated testing
      expect(duplicates.length).toBe(0);
      expect(allPartIds.length).toBe(2);
      expect(partIdCounts['Part-0-0']).toBe(1);
      expect(partIdCounts['Part-0-1']).toBe(1);
    }
    
    console.log('\n🏁 Test completed');
  });
});
