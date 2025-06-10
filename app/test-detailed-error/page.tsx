'use client';

import { useState } from 'react';

export default function TestDetailedErrorPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const runDetailedTest = async () => {
    setLogs([]);
    setResult(null);
    setLoading(true);
    
    try {
      addLog('🔍 Starting detailed error analysis...');
      
      // Import required modules
      const { calculateOptimalCuts } = await import('../lib/calculateOptimalCuts');
      const { MaterialType } = await import('../lib/types');
      addLog('✅ Imports successful');
      
      // Create test data
      const parts = [{
        name: "Test Part",
        length: 200,
        width: 100,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        grainDirection: "horizontal" as const
      }];
      
      const stocks = [{
        id: "test-stock",
        length: 1200,
        width: 800,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        grainDirection: "horizontal" as const
      }];
      
      addLog('✅ Test data created');
      addLog(`📊 Part: ${parts[0].length}×${parts[0].width}×${parts[0].thickness}mm`);
      addLog(`📊 Stock: ${stocks[0].length}×${stocks[0].width}×${stocks[0].thickness}mm`);
      
      // Override console methods to capture all output
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const capturedLogs: string[] = [];
      const capturedErrors: string[] = [];
      const capturedWarns: string[] = [];
      
      console.log = (...args) => {
        capturedLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalLog(...args);
      };
      
      console.error = (...args) => {
        capturedErrors.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalError(...args);
      };
      
      console.warn = (...args) => {
        capturedWarns.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalWarn(...args);
      };
      
      try {
        addLog('🚀 Calling calculateOptimalCuts...');
        const calcResult = calculateOptimalCuts(stocks, parts, 3.2);
        
        addLog('✅ calculateOptimalCuts completed without throwing');
        setResult(calcResult);
        
        // Analyze the result
        if (calcResult) {
          addLog(`📈 Result success: ${calcResult.success}`);
          addLog(`📈 Stock usage count: ${calcResult.stockUsage?.length || 0}`);
          addLog(`📈 Total waste: ${calcResult.totalWaste}`);
          addLog(`📈 Message: ${calcResult.message}`);
          
          if (calcResult.stockUsage && calcResult.stockUsage.length > 0) {
            calcResult.stockUsage.forEach((usage, i) => {
              addLog(`📋 Sheet ${i + 1}: ${usage.placements?.length || 0} placements, ${usage.usedArea}mm² used`);
            });
          }
        } else {
          addLog('❌ Result is null/undefined');
        }
        
      } catch (innerError: any) {
        addLog(`❌ calculateOptimalCuts threw error: ${innerError.message}`);
        addLog(`📍 Stack trace: ${innerError.stack}`);
      } finally {
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        
        // Log captured output
        if (capturedLogs.length > 0) {
          addLog(`📝 Captured ${capturedLogs.length} console.log messages`);
          capturedLogs.forEach((log, i) => addLog(`  LOG ${i + 1}: ${log}`));
        }
        
        if (capturedErrors.length > 0) {
          addLog(`🚨 Captured ${capturedErrors.length} console.error messages`);
          capturedErrors.forEach((error, i) => addLog(`  ERROR ${i + 1}: ${error}`));
        }
        
        if (capturedWarns.length > 0) {
          addLog(`⚠️ Captured ${capturedWarns.length} console.warn messages`);
          capturedWarns.forEach((warn, i) => addLog(`  WARN ${i + 1}: ${warn}`));
        }
      }
      
    } catch (outerError: any) {
      addLog(`💥 Outer error: ${outerError.message}`);
      addLog(`📍 Outer stack: ${outerError.stack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detailed Error Analysis</h1>
      
      <button
        onClick={runDetailedTest}
        disabled={loading}
        className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Analyzing...' : 'Run Detailed Analysis'}
      </button>
      
      {result && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">Result Object:</h2>
          <pre className="text-sm overflow-x-auto bg-white p-2 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Execution Log:</h2>
        <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={
                log.includes('❌') || log.includes('💥') || log.includes('ERROR') ? 'text-red-600' : 
                log.includes('✅') ? 'text-green-600' : 
                log.includes('⚠️') || log.includes('WARN') ? 'text-yellow-600' :
                log.includes('🚨') ? 'text-red-500' :
                'text-gray-700'
              }
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
