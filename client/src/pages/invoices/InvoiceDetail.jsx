import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, updateInvoiceStatus, generateInvoicePDF, sendInvoiceToCustomer } from '../../services/invoiceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AuditTrail from '../../components/AuditTrail';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  // Fetch invoice details
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await getInvoice(id);
        
        if (response.success) {
          setInvoice(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch invoice');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err.message || 'Failed to fetch invoice');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, status: true }));
      
      const paidDate = newStatus === 'paid' ? new Date().toISOString() : null;
      const response = await updateInvoiceStatus(id, newStatus, paidDate);
      
      if (response.success) {
        toast.success(`Invoice status updated to ${newStatus}`);
        setInvoice(prev => ({ ...prev, status: newStatus, paidDate }));
      } else {
        toast.error(response.message || 'Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error(error.message || 'Failed to update invoice status');
    } finally {
      setActionLoading(prev => ({ ...prev, status: false }));
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    try {
      setActionLoading(prev => ({ ...prev, pdf: true }));
      
      const response = await generateInvoicePDF(id);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  // Handle send to customer
  const handleSendToCustomer = async () => {
    try {
      setActionLoading(prev => ({ ...prev, send: true }));
      
      const response = await sendInvoiceToCustomer(id);
      
      if (response.success) {
        toast.success('Invoice sent to customer successfully');
        // Update status to sent if it was draft
        if (invoice.status === 'draft') {
          setInvoice(prev => ({ ...prev, status: 'sent' }));
        }
      } else {
        toast.error(response.message || 'Failed to send invoice to customer');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice to customer');
    } finally {
      setActionLoading(prev => ({ ...prev, send: false }));
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Invoice not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">
            Created on {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Invoices
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={actionLoading.pdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading.pdf ? 'Generating...' : 'Download PDF'}
          </button>
          {invoice.client?.phone && (
            <button
              onClick={handleSendToCustomer}
              disabled={actionLoading.send}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading.send ? 'Sending...' : 'Send to Customer'}
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Invoice Details</h2>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Bill To:</h3>
              <div className="text-sm text-gray-600">
                <div className="font-medium">{invoice.client?.name}</div>
                {invoice.client?.company && <div>{invoice.client.company}</div>}
                <div>{invoice.client?.email}</div>
                {invoice.client?.phone && <div>{invoice.client.phone}</div>}
              </div>
            </div>

            {/* Invoice Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Invoice Information:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><span className="font-medium">Type:</span> {invoice.type.replace('_', ' ')}</div>
                <div><span className="font-medium">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</div>
                {invoice.paidDate && (
                  <div><span className="font-medium">Paid Date:</span> {new Date(invoice.paidDate).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Items:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₹{item.rate.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{invoice.discount.toLocaleString()}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{invoice.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{invoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Update Status:</h3>
              <div className="flex flex-wrap gap-2">
                {invoice.status === 'draft' && (
                  <button
                    onClick={() => handleStatusUpdate('sent')}
                    disabled={actionLoading.status}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark as Sent
                  </button>
                )}
                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                  <button
                    onClick={() => handleStatusUpdate('paid')}
                    disabled={actionLoading.status}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={actionLoading.status}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Invoice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Trail */}
        <div className="mt-8">
          <AuditTrail 
            documentType="invoice" 
            documentId={invoice._id} 
            documentNumber={invoice.invoiceNumber} 
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;