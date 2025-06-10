'use client';

import { useState } from 'react';

export default function TestMinimalPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runBasicTest = async () => {
    console.log('🧪 Starting basic algorithm test...');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test 1: Import the unified packing engine
      console.log('Step 1: Importing unified packing engine...');
      const { unifiedPackingEngine } = await import('../lib/unified-packing-engine');
      console.log('✅ Unified packing engine imported successfully');

      // Test 2: Import algorithm integration
      console.log('Step 2: Importing algorithm integration...');
      const { consolidatedPackParts, getMigrationStats } = await import('../lib/algorithm-integration');
      console.log('✅ Algorithm integration imported successfully');

      // Test 3: Get migration stats
      console.log('Step 3: Testing migration stats...');
      const stats = getMigrationStats();
      console.log('✅ Migration stats:', stats);

      // Test 4: Test types import
      console.log('Step 4: Testing types import...');
      const typesModule = await import('../lib/types');
      console.log('✅ Types imported successfully');

      setResult({
        step1: 'Unified packing engine imported',
        step2: 'Algorithm integration imported', 
        step3: stats,
        step4: 'Types imported'
      });

    } catch (err) {
      console.error('❌ Error during basic test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Minimal Import</h1>
      
      <button 
        onClick={runBasicTest}
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Basic Test'}
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
