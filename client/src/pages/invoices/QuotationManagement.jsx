import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getQuotations, 
  updateQuotationStatus, 
  generateQuotationPDF, 
  sendQuotationToCustomer,
  convertToInvoice,
  deleteQuotation
} from '../../services/quotationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QuotationDetailModal from '../../components/QuotationDetailModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const QuotationManagement = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState(null);

  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/auth/login', { state: { from: '/quotations' } });
    }
  }, [token, authLoading, navigate]);

  // Fetch quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await getQuotations(filters);
      
      console.log('Quotation fetch response:', response);
      
      if (response && response.success !== false) {
        const quotationData = response.data || response || [];
        setQuotations(Array.isArray(quotationData) ? quotationData : []);
        setPagination(response.pagination || {});
        setError(null);
      } else {
        const errorMessage = response?.message || 'Failed to fetch quotations';
        console.error('Quotation fetch error:', errorMessage);
        setError(errorMessage);
        setQuotations([]);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      if (err.status === 404 || err.message?.includes('404')) {
        setQuotations([]);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch quotations');
        setQuotations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuotations();
    }
  }, [filters, token]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
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
  const handleStatusUpdate = async (quotationId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [quotationId]: 'status' }));
      
      const response = await updateQuotationStatus(quotationId, newStatus);
      
      if (response.success) {
        toast.success(`Quotation status updated to ${newStatus}`);
        fetchQuotations();
      } else {
        toast.error(response.message || 'Failed to update quotation status');
      }
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast.error(error.message || 'Failed to update quotation status');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  // Handle convert to invoice
  const handleConvertToInvoice = async (quotationId, quotationNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [quotationId]: 'convert' }));
      
      const response = await convertToInvoice(quotationId);
      
      if (response.success) {
        toast.success('Quotation converted to invoice successfully!');
        fetchQuotations();
        // Navigate to the new invoice
        if (response.data?.invoiceId) {
          navigate(`/invoices/${response.data.invoiceId}`);
        }
      } else {
        toast.error(response.message || 'Failed to convert quotation to invoice');
      }
    } catch (error) {
      console.error('Error converting quotation:', error);
      toast.error(error.message || 'Failed to convert quotation to invoice');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async (quotationId, quotationNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [quotationId]: 'pdf' }));
      
      const response = await generateQuotationPDF(quotationId);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Quotation PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  // Handle send to customer
  const handleSendToCustomer = async (quotationId, quotationNumber) => {
    try {
      setActionLoading(prev => ({ ...prev, [quotationId]: 'send' }));
      
      const response = await sendQuotationToCustomer(quotationId);
      
      if (response.success) {
        toast.success('Quotation sent to customer successfully');
      } else {
        toast.error(response.message || 'Failed to send quotation to customer');
      }
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error(error.message || 'Failed to send quotation to customer');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  // Handle delete - show confirmation modal
  const handleDelete = (quotation) => {
    setDeletingQuotation(quotation);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingQuotation) return;

    try {
      setActionLoading(prev => ({ ...prev, [deletingQuotation._id]: 'delete' }));
      
      const response = await deleteQuotation(deletingQuotation._id);
      
      if (response.success) {
        toast.success('Quotation deleted successfully');
        fetchQuotations();
        setShowDeleteConfirm(false);
        setDeletingQuotation(null);
      } else {
        toast.error(response.message || 'Failed to delete quotation');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error(error.message || 'Failed to delete quotation');
    } finally {
      setActionLoading(prev => ({ ...prev, [deletingQuotation._id]: null }));
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading && quotations.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all quotations for your clients.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => navigate('/quotations/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Quotation
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
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="converted">Converted to Invoice</option>
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
              onClick={fetchQuotations}
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

      {/* Quotations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => (
                <tr key={quotation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.quotationNumber || `QUO-${quotation._id?.slice(-6)}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(quotation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.clientDetails?.name || quotation.client?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quotation.clientDetails?.email || quotation.client?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{quotation.total?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(quotation.status)}`}>
                      {quotation.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* View Details Button */}
                      <button
                        onClick={() => {
                          setSelectedQuotationId(quotation._id);
                          setShowDetailModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        👁️
                      </button>

                      {/* Status Update Dropdown */}
                      {quotation.status !== 'converted' && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(quotation._id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          disabled={actionLoading[quotation._id] === 'status'}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="">Update Status</option>
                          {quotation.status === 'draft' && <option value="sent">Mark as Sent</option>}
                          {(quotation.status === 'sent' || quotation.status === 'draft') && (
                            <>
                              <option value="accepted">Mark as Accepted</option>
                              <option value="rejected">Mark as Rejected</option>
                            </>
                          )}
                          {quotation.status !== 'expired' && <option value="expired">Mark as Expired</option>}
                        </select>
                      )}

                      {/* Convert to Invoice */}
                      {quotation.status === 'accepted' && (
                        <button
                          onClick={() => handleConvertToInvoice(quotation._id, quotation.quotationNumber)}
                          disabled={actionLoading[quotation._id] === 'convert'}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          title="Convert to Invoice"
                        >
                          {actionLoading[quotation._id] === 'convert' ? (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '🔄'
                          )}
                        </button>
                      )}

                      {/* PDF Button */}
                      <button
                        onClick={() => handleGeneratePDF(quotation._id, quotation.quotationNumber)}
                        disabled={actionLoading[quotation._id] === 'pdf'}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        title="Download PDF"
                      >
                        {actionLoading[quotation._id] === 'pdf' ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '📄'
                        )}
                      </button>

                      {/* Send to Customer Button */}
                      <button
                        onClick={() => handleSendToCustomer(quotation._id, quotation.quotationNumber)}
                        disabled={actionLoading[quotation._id] === 'send' || !quotation.clientDetails?.phone}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title={quotation.clientDetails?.phone ? "Send to Customer" : "No phone number available"}
                      >
                        {actionLoading[quotation._id] === 'send' ? (
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '📱'
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(quotation)}
                        disabled={actionLoading[quotation._id] === 'delete'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete Quotation"
                      >
                        {actionLoading[quotation._id] === 'delete' ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quotations.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No quotations found</div>
            <p className="text-gray-400 mt-2">
              Create your first quotation to get started.
            </p>
            <button
              onClick={() => navigate('/quotations/create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Quotation
            </button>
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

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        quotationId={selectedQuotationId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuotationId(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingQuotation(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${deletingQuotation?.quotationNumber || ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading[deletingQuotation?._id] === 'delete'}
      />
    </div>
  );
};

export default QuotationManagement;