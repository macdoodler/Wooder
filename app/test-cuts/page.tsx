'use client';

import { useState } from 'react';
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

export default function TestCutsPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testParts = [
    {
      name: "Test Part 1",
      length: 300,
      width: 200,
      thickness: 18,
      quantity: 2,
      material: "Plywood",
      grainDirection: "horizontal" as const
    },
    {
      name: "Test Part 2", 
      length: 150,
      width: 100,
      thickness: 18,
      quantity: 1,
      material: "Plywood",
      grainDirection: "horizontal" as const
    }
  ];

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

  const runTest = async () => {
    console.log('🧪 Starting cutting calculation test...');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Test Parts:', testParts);
      console.log('Test Stock:', testStock);
      
      const calculationResult = calculateOptimalCuts(testStock, testParts, 3.2);
      
      console.log('✅ Success! Result:', calculationResult);
      setResult(calculationResult);
    } catch (err) {
      console.error('❌ Error during calculation:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Cutting Calculations</h1>
      
      <button 
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Cutting Test'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Success!</h3>
          <pre className="text-sm mt-2 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
}
