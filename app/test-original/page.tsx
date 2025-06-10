'use client';

import { useState } from 'react';
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

function TestOriginalAlgorithmPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (step: string, success: boolean, data?: any, error?: any) => {
    setResults(prev => [...prev, { 
      step, 
      success, 
      data, 
      error: error instanceof Error ? error.message : error, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const runOriginalTest = async () => {
    console.log('🧪 Testing original algorithm (bypassing consolidation)...');
    setLoading(true);
    setResults([]);

    try {
      // Test data
      const testParts = [
        {
          name: "Simple Part",
          length: 200,
          width: 100,
          thickness: 18,
          quantity: 1,
          material: "Plywood",
          grainDirection: "horizontal" as const
        }
      ];

      const testStock = [
        {
          id: "test-stock",
          length: 1200,
          width: 800,
          thickness: 18,
          quantity: 1,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        }
      ];

      addResult('Test data created', true, 'Basic test data ready');

      // Step 1: Import types only
      addResult('Import types', true, 'Starting...');
      const typesModule = await import('../lib/types');
      addResult('Import types', true, 'Types imported successfully');

      // Step 2: Import cut helpers (which should have original algorithms)
      addResult('Import cut helpers', true, 'Starting...');
      const cutHelpersModule = await import('../lib/cut-helpers');
      addResult('Import cut helpers', true, 'Cut helpers imported successfully');

      // Step 3: Try calling handleSheetMaterialCutting directly
      addResult('Test sheet cutting function', true, 'Starting direct call...');
      
      // Call the new optimized cutting function instead
      const result = calculateOptimalCuts(
        testStock,
        testParts,
        3.2 // kerfThickness
      );

      addResult('Test sheet cutting function', true, {
        hasResult: !!result,
        stockUsage: result?.stockUsage?.length || 0,
        totalPlacements: result?.stockUsage?.reduce((sum: number, usage: any) => sum + (usage.placements?.length || 0), 0) || 0
      });

    } catch (err) {
      console.error('❌ Error in original algorithm test:', err);
      addResult('Error occurred', false, null, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Original Algorithm (Bypass Consolidation)</h1>
      
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
        <p><strong>Purpose:</strong> This test bypasses the consolidated algorithms to test if the original implementations work.</p>
      </div>

      <button 
        onClick={runOriginalTest}
        disabled={loading}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Testing Original Algorithm...' : 'Run Original Algorithm Test'}
      </button>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-3 rounded border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="font-semibold">
              {result.success ? '✅' : '❌'} {result.step}
            </div>
            {result.data && (
              <div className="text-sm mt-1">
                <strong>Data:</strong> {typeof result.data === 'string' ? result.data : JSON.stringify(result.data)}
              </div>
            )}
            {result.error && (
              <div className="text-sm mt-1 break-words">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {result.timestamp}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>This test helps isolate whether the issue is in the unified algorithms or elsewhere.</p>
      </div>
    </div>
  );
}

export default TestOriginalAlgorithmPage;
