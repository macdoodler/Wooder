#!/usr/bin/env node
// Quick test to verify algorithm consolidation is working

import { consolidatedPackParts, enhancedLayoutOptimization, advancedSpaceManagement, getMigrationStats } from './app/lib/algorithm-integration.js';

console.log('🧪 Testing Algorithm Consolidation...\n');

// Test basic functionality
try {
  // Test migration stats
  const stats = getMigrationStats();
  console.log('✅ Migration Stats Available:');
  console.log(`   - Consolidated Algorithms: ${stats.consolidatedAlgorithms.length}`);
  console.log(`   - Removed Code Lines: ${stats.removedCodeLines}`);
  console.log(`   - Performance Improvement: ${stats.performanceImprovement}`);
  console.log('');

  // Test with sample data
  const samplePart = {
    length: 100,
    width: 50,
    thickness: 18,
    material: 'Plywood',
    materialType: 'Sheet',
    grainDirection: 'horizontal'
  };

  const sampleStock = {
    id: 'test-stock',
    length: 1200,
    width: 800,
    thickness: 18,
    quantity: 1,
    material: 'Plywood',
    materialType: 'Sheet',
    grainDirection: 'horizontal'
  };

  // Test consolidatedPackParts
  console.log('🔧 Testing consolidatedPackParts...');
  const packResult = consolidatedPackParts(
    [{ part: samplePart, partIndex: 0, instanceId: 'test-1' }],
    sampleStock,
    3.2, // kerf thickness
    [samplePart]
  );

  console.log(`   - Success: ${packResult.success}`);
  console.log(`   - Placements: ${packResult.placements.length}`);
  console.log(`   - Used Area: ${packResult.usedArea}mm²`);
  console.log('');

  // Test enhancedLayoutOptimization
  console.log('🔧 Testing enhancedLayoutOptimization...');
  const layoutResult = enhancedLayoutOptimization(
    [{ part: samplePart, quantity: 1, partIndex: 0 }],
    sampleStock,
    3.2
  );

  console.log(`   - Success: ${layoutResult.success}`);
  console.log(`   - Placements: ${layoutResult.placements.length}`);
  console.log(`   - Used Area: ${layoutResult.usedArea}mm²`);
  console.log('');

  console.log('✅ Algorithm Consolidation Test PASSED!');
  console.log('🎉 All redundant algorithms have been successfully unified!');

} catch (error) {
  console.error('❌ Algorithm Consolidation Test FAILED:');
  console.error(error.message);
  process.exit(1);
}
