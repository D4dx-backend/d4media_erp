import React, { useState } from 'react'
import { Smartphone, Send, CheckCircle, XCircle } from 'lucide-react'
import { userService } from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'

const WhatsAppTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      const response = await userService.testWhatsApp(phoneNumber)
      setResult(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '')
    
    // Format as Indian number
    if (digitsOnly.length <= 10) {
      return digitsOnly
    } else if (digitsOnly.length <= 12 && digitsOnly.startsWith('91')) {
      return digitsOnly
    }
    
    return digitsOnly.slice(0, 12)
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    if (error) setError(null)
    if (result) setResult(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Smartphone className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp Service Test</h3>
          <p className="text-sm text-gray-500">Test WhatsApp integration with a phone number</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              +91
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="9876543210"
              required
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter Indian mobile number (10 digits)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
              )}
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>
            
            {/* Configuration Status */}
            {result.configuration && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <h5 className="text-xs font-medium text-blue-900 mb-1">Configuration Status</h5>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Service Configured: {result.configuration.serviceConfigured ? '✅ Yes' : '❌ No'}</div>
                  <div>Account ID: {result.configuration.accountId}</div>
                  <div>API URL: {result.configuration.apiUrl}</div>
                </div>
              </div>
            )}

            {/* API Response */}
            {result.data && (
              <div className="text-xs text-gray-600 mt-2">
                <h5 className="font-medium text-gray-700 mb-1">API Response:</h5>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Account Status */}
            {result.data?.accountStatus && (
              <div className="text-xs text-gray-600 mt-2">
                <h5 className="font-medium text-gray-700 mb-1">Account Status:</h5>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.data.accountStatus, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Details */}
            {result.error && (
              <div className="mt-2">
                <p className="text-red-700 text-sm font-medium">Error Details:</p>
                <p className="text-red-600 text-xs mt-1">{result.error}</p>
              </div>
            )}

            {result.details && (
              <div className="mt-2">
                <p className="text-red-700 text-sm font-medium">Additional Details:</p>
                <p className="text-red-600 text-xs mt-1">{result.details}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Message
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">About WhatsApp Integration</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Test messages are sent to verify service connectivity</li>
          <li>• Password reset notifications are automatically sent when resetting user passwords</li>
          <li>• Only Indian phone numbers (+91) are supported</li>
          <li>• Messages include D4 Media branding and contact information</li>
        </ul>
      </div>
    </div>
  )
}

export default WhatsAppTest