import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, createInvoice, updateInvoiceStatus, generateInvoicePDF, sendInvoiceToCustomer } from '../../services/invoiceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  // Debug user info
  useEffect(() => {
    console.log('Invoice Management - User info:', { user, token: !!token, authLoading });
  }, [user, token, authLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/auth/login', { state: { from: '/invoices' } });
    }
  }, [token, authLoading, navigate]);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices(filters);
      
      console.log('Invoice fetch response:', response); // Debug log
      
      if (response && response.success !== false) {
        // Handle both success response format and direct data array
        const invoiceData = response.data || response || [];
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
        setPagination(response.pagination || {});
        setError(null);
      } else {
        // Only set error if there's actually an error, not just empty data
        const errorMessage = response?.message || 'Failed to fetch invoices';
        console.error('Invoice fetch error:', errorMessage);
        setError(errorMessage);
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      // Check if it's a network error or actual server error
      if (err.status === 404 || err.message?.includes('404')) {
        // 404 might just mean no invoices exist yet
        setInvoices([]);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch invoices');
        setInvoices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInvoices();
    }
  }, [filters, token]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle status update
  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [invoiceId]: 'status' }));
      
      const paidDate = newStatus === 'paid' ? new Date().toISOString() : null;
      const response = await updateInvoiceStatus(invoiceId, newStatus, paidDate);
      
      if (response.success) {
        toast.success(`Invoice status updated to ${newStatus}`);
        fetchInvoices(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error(error.message || 'Failed to update invoice status');
    } finally {
      setActionLoading(prev => ({ ...prev, [invoiceId]: null }));
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async (invoiceId, invoiceNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [invoiceId]: 'pdf' }));
      
      const response = await generateInvoicePDF(invoiceId);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(prev => ({ ...prev, [invoiceId]: null }));
    }
  };

  // Handle send to customer
  const handleSendToCustomer = async (invoiceId, invoiceNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [invoiceId]: 'send' }));
      
      const response = await sendInvoiceToCustomer(invoiceId);
      
      if (response.success) {
        toast.success('Invoice sent to customer via WhatsApp successfully');
      } else {
        toast.error(response.message || 'Failed to send invoice to customer');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice to customer');
    } finally {
      setActionLoading(prev => ({ ...prev, [invoiceId]: null }));
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [invoiceId]: 'print' }));
      
      // Generate PDF and open in new window for printing
      const response = await generateInvoicePDF(invoiceId);
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Invoice opened for printing');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error(error.message || 'Failed to print invoice');
    } finally {
      setActionLoading(prev => ({ ...prev, [invoiceId]: null }));
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

  // Get type badge color
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'studio_booking':
        return 'bg-purple-100 text-purple-800';
      case 'task_based':
        return 'bg-indigo-100 text-indigo-800';
      case 'periodic':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all invoices including event bookings and studio rentals.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => navigate('/invoices/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Invoice
          </button>
          <button
            onClick={() => navigate('/quotations')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Quotations
          </button>
          <button
            onClick={async () => {
              try {
                console.log('Testing invoice creation...');
                const testData = {
                  type: 'manual',
                  clientDetails: {
                    name: 'Test Client',
                    email: 'test@example.com',
                    phone: '9876543210'
                  },
                  items: [{
                    description: 'Test Item',
                    quantity: 1,
                    rate: 1000,
                    amount: 1000
                  }],
                  subtotal: 1000,
                  tax: 18,
                  taxAmount: 180,
                  total: 1180
                };
                
                const response = await createInvoice(testData);
                console.log('Test invoice response:', response);
                toast.success('Test invoice created successfully!');
                fetchInvoices();
              } catch (error) {
                console.error('Test invoice error:', error);
                toast.error('Test invoice failed: ' + error.message);
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Test Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="studio_booking">Studio Booking</option>
              <option value="task_based">Task Based</option>
              <option value="periodic">Periodic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchInvoices}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.client?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.client?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(invoice.type)}`}>
                      {invoice.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{invoice.total?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Status Update Dropdown */}
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStatusUpdate(invoice._id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        disabled={actionLoading[invoice._id] === 'status'}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">Update Status</option>
                        {invoice.status === 'draft' && <option value="sent">Mark as Sent</option>}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <option value="paid">Mark as Paid</option>
                        )}
                        <option value="cancelled">Cancel</option>
                      </select>
                    )}

                    {/* PDF Download Button */}
                    <button
                      onClick={() => handleGeneratePDF(invoice._id, invoice.invoiceNumber)}
                      disabled={actionLoading[invoice._id] === 'pdf'}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      title="Download PDF"
                    >
                      {actionLoading[invoice._id] === 'pdf' ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        '📄'
                      )}
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={() => handlePrintInvoice(invoice._id, invoice.invoiceNumber)}
                      disabled={actionLoading[invoice._id] === 'print'}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                      title="Print Invoice"
                    >
                      {actionLoading[invoice._id] === 'print' ? (
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        '🖨️'
                      )}
                    </button>

                    {/* Send to WhatsApp Button */}
                    <button
                      onClick={() => handleSendToCustomer(invoice._id, invoice.invoiceNumber)}
                      disabled={actionLoading[invoice._id] === 'send' || !invoice.client?.phone}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      title={invoice.client?.phone ? "Send via WhatsApp" : "No phone number available"}
                    >
                      {actionLoading[invoice._id] === 'send' ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        '📱'
                      )}
                    </button>

                    {/* View Details Button */}
                    <button
                      onClick={() => navigate(`/invoices/${invoice._id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No invoices found</div>
            <p className="text-gray-400 mt-2">
              Invoices will appear here once they are created from event bookings or manually.
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;