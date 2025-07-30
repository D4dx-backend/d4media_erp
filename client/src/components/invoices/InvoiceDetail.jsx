import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoice, updateInvoiceStatus, downloadInvoicePDF } from '../../services/invoiceService';
import LoadingSpinner from '../common/LoadingSpinner';
import InvoiceStatusBadge from './InvoiceStatusBadge';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [paidDate, setPaidDate] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await getInvoice(id);
        setInvoice(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleStatusChange = async () => {
    try {
      setUpdating(true);
      
      const statusData = {
        status: newStatus
      };
      
      // Add paid date if status is 'paid'
      if (newStatus === 'paid') {
        statusData.paidDate = paidDate || new Date().toISOString();
      }
      
      const response = await updateInvoiceStatus(id, statusData);
      setInvoice(response.data);
      setShowStatusModal(false);
      setNewStatus('');
      setPaidDate('');
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError('Failed to update invoice status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePDF(id);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get valid status transitions
  const getValidStatusTransitions = () => {
    if (!invoice) return [];
    
    const validTransitions = {
      'draft': ['sent', 'cancelled'],
      'sent': ['paid', 'overdue', 'cancelled'],
      'overdue': ['paid', 'cancelled'],
      'paid': [],
      'cancelled': []
    };
    
    return validTransitions[invoice.status] || [];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Invoice not found</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Invoice #{invoice.invoiceNumber}</h2>
          <p className="text-sm text-gray-500">
            Created on {formatDate(invoice.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          {getValidStatusTransitions().length > 0 && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Bill To</h3>
          <p className="mt-1 text-sm text-gray-900">{invoice.client?.name}</p>
          {invoice.client?.company && (
            <p className="text-sm text-gray-900">{invoice.client.company}</p>
          )}
          <p className="text-sm text-gray-900">{invoice.client?.email}</p>
        </div>
        <div className="md:text-right">
          <div className="flex justify-between md:justify-end md:space-x-4">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="flex justify-between md:justify-end md:space-x-4 mt-2">
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <p className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>
          {invoice.paidDate && (
            <div className="flex justify-between md:justify-end md:space-x-4 mt-2">
              <h3 className="text-sm font-medium text-gray-500">Paid Date</h3>
              <p className="text-sm text-gray-900">{formatDate(invoice.paidDate)}</p>
            </div>
          )}
          <div className="flex justify-between md:justify-end md:space-x-4 mt-2">
            <h3 className="text-sm font-medium text-gray-500">Invoice Type</h3>
            <p className="text-sm text-gray-900">
              {invoice.type === 'task_based'
                ? 'Task Based'
                : invoice.type === 'studio_booking'
                ? 'Studio Booking'
                : 'Periodic'}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Invoice Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type === 'task'
                      ? 'Task'
                      : item.type === 'booking'
                      ? 'Studio Booking'
                      : 'Additional'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Totals */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Subtotal:</span>
              <span className="text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Discount:</span>
              <span className="text-sm text-gray-900">{formatCurrency(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Tax:</span>
              <span className="text-sm text-gray-900">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">Total:</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <Link
          to="/invoices"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Invoices
        </Link>
        {invoice.status === 'draft' && (
          <Link
            to={`/invoices/${invoice._id}/edit`}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit Invoice
          </Link>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Invoice Status</h3>
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Status</option>
                {getValidStatusTransitions().map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {newStatus === 'paid' && (
              <div className="mb-4">
                <label htmlFor="paidDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  id="paidDate"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusChange}
                disabled={!newStatus || updating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;