import React, { useState, useRef } from 'react';
import CorsTestUtility from '../../utils/corsTest';

const CorsTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [serverUrl, setServerUrl] = useState(
    process.env.REACT_APP_API_URL || 'http://localhost:5000'
  );
  const logRef = useRef(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    // Clear previous logs
    if (logRef.current) {
      logRef.current.innerHTML = '';
    }

    try {
      const tester = new CorsTestUtility(serverUrl);
      const testResults = await tester.runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('CORS tests failed:', error);
      setResults({
        success: false,
        error: error.message,
        report: { summary: { total: 0, success: 0, errors: 1, warnings: 0 } }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!results?.report) return;

    const reportData = JSON.stringify(results.report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cors-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          CORS Configuration Test Panel
        </h2>
        <p className="text-gray-600">
          Test CORS configuration from the browser to ensure proper cross-origin communication.
        </p>
      </div>

      {/* Server URL Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Server URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="http://localhost:5000"
            disabled={isRunning}
          />
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`px-6 py-2 rounded-md font-medium ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run CORS Tests'}
          </button>
        </div>
      </div>

      {/* Test Results Summary */}
      {results && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Download Report
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {results.report?.summary?.total || 0}
              </div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {results.report?.summary?.success || 0}
              </div>
              <div className="text-sm text-green-800">Passed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {results.report?.summary?.errors || 0}
              </div>
              <div className="text-sm text-red-800">Errors</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {results.report?.summary?.warnings || 0}
              </div>
              <div className="text-sm text-yellow-800">Warnings</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`font-medium ${
              results.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {results.success ? '✅ All CORS tests passed!' : '❌ Some CORS tests failed'}
            </div>
            {results.error && (
              <div className="text-red-700 mt-2">
                Error: {results.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Test Log */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Log</h3>
        <div
          id="cors-test-log"
          ref={logRef}
          className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm"
        >
          {!isRunning && !results && (
            <div className="text-gray-500">
              Click "Run CORS Tests" to start testing...
            </div>
          )}
        </div>
      </div>

      {/* Test Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">What This Tests:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Basic API endpoint accessibility</li>
          <li>• Preflight request handling (OPTIONS)</li>
          <li>• CORS headers validation</li>
          <li>• Credentials support</li>
          <li>• WebSocket connection (if applicable)</li>
        </ul>
      </div>

      <style jsx>{`
        .cors-log-entry {
          margin-bottom: 4px;
          padding: 2px 0;
        }
        .cors-log-success {
          color: #10b981;
        }
        .cors-log-error {
          color: #ef4444;
        }
        .cors-log-warning {
          color: #f59e0b;
        }
        .cors-log-info {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default CorsTestPanel;