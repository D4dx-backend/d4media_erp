import React, { useState, useEffect } from 'react';
import { getQuotation } from '../services/quotationService';
import AuditTrail from './AuditTrail';
import LoadingSpinner from './common/LoadingSpinner';
import { XMarkIcon } from '@heroicons/react/24/outline';

const QuotationDetailModal = ({ quotationId, isOpen, onClose }) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen && quotationId) {
      fetchQuotation();
    }
  }, [isOpen, quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await getQuotation(quotationId);
      if (response.success) {
        setQuotation(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch quotation');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch quotation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quotation Details
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'audit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Audit Trail
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : quotation ? (
              <>
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Quotation Number</h4>
                          <p className="text-sm text-gray-600">{quotation.quotationNumber}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                            {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Created Date</h4>
                          <p className="text-sm text-gray-600">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Valid Until</h4>
                          <p className="text-sm text-gray-600">{new Date(quotation.validUntil).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Client Details */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Client Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Name</h5>
                          <p className="text-sm text-gray-600">{quotation.clientDetails?.name || quotation.client?.name}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Email</h5>
                          <p className="text-sm text-gray-600">{quotation.clientDetails?.email || quotation.client?.email}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Phone</h5>
                          <p className="text-sm text-gray-600">{quotation.clientDetails?.phone || quotation.client?.phone}</p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Company</h5>
                          <p className="text-sm text-gray-600">{quotation.clientDetails?.company || quotation.client?.company || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Items</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quotation.items?.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.rate.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="mt-4 border-t pt-4">
                        <div className="flex justify-end">
                          <div className="w-64">
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-gray-600">Subtotal:</span>
                              <span className="text-sm text-gray-900">₹{quotation.subtotal.toLocaleString()}</span>
                            </div>
                            {quotation.tax > 0 && (
                              <div className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">Tax ({quotation.tax}%):</span>
                                <span className="text-sm text-gray-900">₹{quotation.taxAmount.toLocaleString()}</span>
                              </div>
                            )}
                            {quotation.discount > 0 && (
                              <div className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">Discount:</span>
                                <span className="text-sm text-gray-900">-₹{quotation.discount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                              <span>Total:</span>
                              <span>₹{quotation.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {quotation.notes && (
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600">{quotation.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <AuditTrail 
                    documentType="quotation" 
                    documentId={quotation._id} 
                    documentNumber={quotation.quotationNumber} 
                  />
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetailModal;