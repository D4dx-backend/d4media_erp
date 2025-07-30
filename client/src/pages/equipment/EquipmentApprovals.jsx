import React, { useState, useEffect } from 'react';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';

const EquipmentApprovals = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    approved: true,
    notes: ''
  });
  const [returnForm, setReturnForm] = useState({
    equipmentReturns: [],
    notes: ''
  });
  const [whatsappForm, setWhatsappForm] = useState({
    phoneNumber: '',
    status: '',
    category: ''
  });
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Check if user has permission to approve
  const canApprove = ['super_admin', 'reception'].includes(user?.role);

  useEffect(() => {
    if (canApprove) {
      fetchData();
    }
  }, [canApprove]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, historyResponse] = await Promise.all([
        equipmentService.getPendingApprovals(),
        equipmentService.getCheckoutHistory({ status: 'checked_out,overdue' })
      ]);
      
      setPendingApprovals(pendingResponse.data);
      setCheckedOutItems(historyResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = (item, approved) => {
    setSelectedItem(item);
    setApprovalForm({ approved, notes: '' });
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    try {
      await equipmentService.approveCheckout(selectedItem._id, approvalForm);
      setSuccess(`Checkout request ${approvalForm.approved ? 'approved' : 'rejected'} successfully`);
      setShowApprovalModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to process approval');
      console.error('Error processing approval:', err);
    }
  };

  const handleReturn = (item) => {
    setSelectedItem(item);
    const equipmentReturns = item.equipment.map(e => ({
      equipmentId: e.equipmentId._id,
      condition: 'good',
      notes: ''
    }));
    setReturnForm({ equipmentReturns, notes: '' });
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    try {
      await equipmentService.returnEquipment(selectedItem._id, returnForm);
      setSuccess('Equipment returned successfully');
      setShowReturnModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to return equipment');
      console.error('Error returning equipment:', err);
    }
  };

  const sendWhatsAppList = async () => {
    try {
      await equipmentService.sendEquipmentWhatsApp(whatsappForm);
      setSuccess('Equipment list sent via WhatsApp successfully');
      setShowWhatsAppModal(false);
      setWhatsappForm({ phoneNumber: '', status: '', category: '' });
    } catch (err) {
      setError('Failed to send WhatsApp message');
      console.error('Error sending WhatsApp:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      checked_out: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (expectedReturnDate, status) => {
    return status === 'checked_out' && new Date() > new Date(expectedReturnDate);
  };

  if (!canApprove) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access denied. Only reception staff and administrators can access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment Approvals</h1>
        <p className="text-gray-600">Approve checkout requests and manage returns</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowWhatsAppModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Send List via WhatsApp
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('checked_out')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'checked_out'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Checked Out ({checkedOutItems.length})
          </button>
        </nav>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApprovals.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.equipment.length} Equipment Items
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs">
                          {item.equipment.slice(0, 2).map(e => `${e.equipmentId.name} (${e.quantity})`).join(', ')}
                          {item.equipment.length > 2 && ` +${item.equipment.length - 2} more`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.department?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.purpose}</div>
                      {item.location && (
                        <div className="text-sm text-gray-500">Location: {item.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.expectedReturnDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(item, true)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(item, false)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingApprovals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No pending approvals
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checked Out Tab */}
      {activeTab === 'checked_out' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checkout Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checkedOutItems.map((item) => (
                  <tr key={item._id} className={`hover:bg-gray-50 ${isOverdue(item.expectedReturnDate, item.status) ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.equipment.length} Equipment Items
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs">
                          {item.equipment.slice(0, 2).map(e => `${e.equipmentId.name} (${e.quantity})`).join(', ')}
                          {item.equipment.length > 2 && ` +${item.equipment.length - 2} more`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.checkoutDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.expectedReturnDate)}
                      {isOverdue(item.expectedReturnDate, item.status) && (
                        <div className="text-red-600 text-xs">OVERDUE</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReturn(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {checkedOutItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No checked out equipment
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalForm.approved ? 'Approve' : 'Reject'} Checkout Request
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Equipment ({selectedItem?.equipment.length} items):
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 mb-2">
                  {selectedItem?.equipment.map((e, index) => (
                    <div key={e.equipmentId._id} className="text-sm text-gray-700 py-1">
                      {index + 1}. {e.equipmentId.name} (Qty: {e.quantity})
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Requested by: <span className="font-medium">{selectedItem?.user.name}</span>
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={approvalForm.approved ? 'Approval notes (optional)' : 'Reason for rejection'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApproval}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    approvalForm.approved 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalForm.approved ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Return Equipment
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  User: <span className="font-medium">{selectedItem?.user.name}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Return Conditions
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {selectedItem?.equipment.map((equipmentItem, index) => (
                      <div key={equipmentItem.equipmentId._id} className="border border-gray-200 rounded p-3">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {equipmentItem.equipmentId.name} (Qty: {equipmentItem.quantity})
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Condition
                            </label>
                            <select
                              value={returnForm.equipmentReturns[index]?.condition || 'good'}
                              onChange={(e) => {
                                const newReturns = [...returnForm.equipmentReturns];
                                newReturns[index] = {
                                  ...newReturns[index],
                                  equipmentId: equipmentItem.equipmentId._id,
                                  condition: e.target.value
                                };
                                setReturnForm(prev => ({ ...prev, equipmentReturns: newReturns }));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="excellent">Excellent</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                              <option value="damaged">Damaged</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={returnForm.equipmentReturns[index]?.notes || ''}
                              onChange={(e) => {
                                const newReturns = [...returnForm.equipmentReturns];
                                newReturns[index] = {
                                  ...newReturns[index],
                                  equipmentId: equipmentItem.equipmentId._id,
                                  notes: e.target.value
                                };
                                setReturnForm(prev => ({ ...prev, equipmentReturns: newReturns }));
                              }}
                              placeholder="Equipment notes"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    General Return Notes
                  </label>
                  <textarea
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="General notes about the return"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Return Equipment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Equipment List via WhatsApp
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={whatsappForm.phoneNumber}
                    onChange={(e) => setWhatsappForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="e.g., +919876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Category
                  </label>
                  <select
                    value={whatsappForm.category}
                    onChange={(e) => setWhatsappForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="lighting">Lighting</option>
                    <option value="presentation">Presentation</option>
                    <option value="streaming">Streaming</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={sendWhatsAppList}
                  disabled={!whatsappForm.phoneNumber}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentApprovals;