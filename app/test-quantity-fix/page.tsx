'use client';

import { useState } from 'react';
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

export default function TestQuantityFixPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuantityTest = async () => {
    console.log('🧪 Starting Quantity Handling Test...');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test stocks
      const testStock = [
        {
          id: "stock-1",
          length: 1200,
          width: 800,
          thickness: 18,
          quantity: 2,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        }
      ];

      // Test parts with multiple quantities
      const testParts = [
        {
          name: "Test Part 1",
          length: 300,
          width: 200,
          thickness: 18,
          quantity: 3, // Should place 3 instances
          material: "Plywood",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        },
        {
          name: "Test Part 2",
          length: 250,
          width: 150,
          thickness: 18,
          quantity: 2, // Should place 2 instances
          material: "Plywood",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        }
      ];

      console.log('📊 Input Data:');
      console.log(`Stocks: ${testStock.length} type(s)`);
      console.log(`Parts: ${testParts.length} type(s), ${testParts.reduce((sum, p) => sum + p.quantity, 0)} total instances`);

      const calculationResult = calculateOptimalCuts(testStock, testParts, 3.2);
      
      // Count total placements
      const totalPlacements = calculationResult.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      const expectedTotal = testParts.reduce((sum, p) => sum + p.quantity, 0);
      
      console.log('✅ Results:');
      console.log(`Success: ${calculationResult.success}`);
      console.log(`Total placements: ${totalPlacements}`);
      console.log(`Expected placements: ${expectedTotal}`);
      console.log(`Correct quantity handling: ${totalPlacements === expectedTotal ? '✅ YES' : '❌ NO'}`);

      // Log placement details
      calculationResult.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`\nSheet ${sheetIndex + 1}:`);
        usage.placements.forEach(placement => {
          console.log(`  - ${placement.partId} at (${placement.x}, ${placement.y}) ${placement.rotated ? '(rotated)' : ''}`);
        });
      });

      setResult({
        ...calculationResult,
        totalPlacements,
        expectedTotal,
        quantityCorrect: totalPlacements === expectedTotal
      });
    } catch (err) {
      console.error('❌ Error during test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Quantity Handling Fix</h1>
      <p className="text-gray-600 mb-4">
        This test verifies that the optimized cutting engine correctly handles multiple quantities of parts.
      </p>
      
      <button 
        onClick={runQuantityTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Quantity Test'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 border rounded ${result.quantityCorrect ? 'bg-green-100 border-green-400 text-green-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>
          <h3 className="font-bold">
            {result.quantityCorrect ? '✅ Test PASSED' : '❌ Test FAILED'}
          </h3>
          <div className="mt-2">
            <p><strong>Expected placements:</strong> {result.expectedTotal}</p>
            <p><strong>Actual placements:</strong> {result.totalPlacements}</p>
            <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            <p><strong>Sheets used:</strong> {result.totalUsedSheets}</p>
            <p><strong>Message:</strong> {result.message}</p>
          </div>
          
          {result.stockUsage && result.stockUsage.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold">Placement Details:</h4>
              {result.stockUsage.map((usage: any, sheetIndex: number) => (
                <div key={sheetIndex} className="mt-2">
                  <p className="font-medium">Sheet {sheetIndex + 1}:</p>
                  <ul className="list-disc list-inside ml-4">
                    {usage.placements.map((placement: any, index: number) => (
                      <li key={index} className="text-sm">
                        {placement.partId} at ({placement.x}, {placement.y}) 
                        {placement.rotated ? ' (rotated)' : ''}
                        {placement.name ? ` - ${placement.name}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>Check the browser console for detailed logs.</p>
        <p>Expected: 3 instances of "Test Part 1" + 2 instances of "Test Part 2" = 5 total placements</p>
      </div>
    </div>
  );
}
