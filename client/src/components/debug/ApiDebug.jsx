import React, { useState } from 'react'
import { API_CONFIG } from '../../config/api.js'
import axios from 'axios'

const ApiDebug = () => {
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testApiConnection = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      console.log('Testing API connection to:', API_CONFIG.BASE_URL)
      
      // Test basic connectivity
      const response = await axios.get(`${API_CONFIG.BASE_URL}/health`, {
        timeout: 5000
      })
      
      setTestResult({
        success: true,
        message: 'API connection successful',
        data: response.data,
        url: API_CONFIG.BASE_URL
      })
    } catch (error) {
      console.error('API test failed:', error)
      setTestResult({
        success: false,
        message: error.message,
        url: API_CONFIG.BASE_URL,
        status: error.response?.status,
        statusText: error.response?.statusText
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Debug Information</h3>
      
      <div className="space-y-2 mb-4">
        <p><strong>API URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        <p><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'Not set'}</p>
      </div>
      
      <button
        onClick={testApiConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {testResult && (
        <div className={`mt-4 p-3 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p><strong>Result:</strong> {testResult.message}</p>
          <p><strong>URL:</strong> {testResult.url}</p>
          {testResult.status && <p><strong>Status:</strong> {testResult.status} {testResult.statusText}</p>}
          {testResult.data && (
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default ApiDebug