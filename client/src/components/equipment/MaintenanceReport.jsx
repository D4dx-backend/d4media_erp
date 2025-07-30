import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import equipmentService from '../../services/equipmentService';

const MaintenanceReport = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'routine',
    description: '',
    cost: '',
    nextMaintenanceDate: '',
    status: 'completed',
    notes: ''
  });
  const [equipment, setEquipment] = useState([]);

  // Check if user can add maintenance records (department heads and admins)
  const canAddMaintenance = ['super_admin', 'department_admin'].includes(user?.role);

  useEffect(() => {
    fetchMaintenanceReport();
    if (canAddMaintenance) {
      fetchEquipment();
    }
  }, [filters]);

  const fetchMaintenanceReport = async () => {
    try {
      setLoading(true);
      const response = await equipmentService.getMaintenanceReport(filters);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching maintenance report:', error);
      setError('Failed to fetch maintenance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getAllEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaintenanceFormChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        ...maintenanceForm,
        cost: parseFloat(maintenanceForm.cost) || 0
      };
      
      await equipmentService.addMaintenanceRecord(selectedEquipment, formData);
      
      // Reset form
      setMaintenanceForm({
        type: 'routine',
        description: '',
        cost: '',
        nextMaintenanceDate: '',
        status: 'completed',
        notes: ''
      });
      setSelectedEquipment('');
      setShowAddMaintenance(false);
      
      // Refresh report
      fetchMaintenanceReport();
      
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      setError(error.response?.data?.message || 'Failed to add maintenance record');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceTypeIcon = (type) => {
    switch (type) {
      case 'routine': return '🔧';
      case 'repair': return '🛠️';
      case 'inspection': return '🔍';
      case 'calibration': return '⚖️';
      case 'cleaning': return '🧽';
      default: return '🔧';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Report</h2>
          <p className="text-gray-600">Track equipment maintenance and schedule</p>
        </div>
        
        {canAddMaintenance && (
          <button
            onClick={() => setShowAddMaintenance(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Add Maintenance
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="routine">Routine</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="calibration">Calibration</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{reportData.statistics.totalEquipment}</div>
              <div className="text-sm text-gray-600">Total Equipment</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{reportData.statistics.upToDate}</div>
              <div className="text-sm text-gray-600">Up to Date</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">{reportData.statistics.dueSoon}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">{reportData.statistics.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{reportData.statistics.inMaintenance}</div>
              <div className="text-sm text-gray-600">In Maintenance</div>
            </div>
          </div>

          {/* Equipment Needing Maintenance */}
          {reportData.needingMaintenance.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Needing Maintenance</h3>
              
              <div className="space-y-3">
                {reportData.needingMaintenance.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.equipmentCode && `Code: ${item.equipmentCode} • `}
                        Category: {item.category}
                        {item.department && ` • Department: ${item.department.name}`}
                      </p>
                      {item.nextMaintenanceDate && (
                        <p className="text-sm text-gray-600">
                          Next Maintenance: {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.maintenanceStatus)}`}>
                      {item.maintenanceStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Maintenance Activities */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Maintenance Activities</h3>
            
            {reportData.recentMaintenance.length > 0 ? (
              <div className="space-y-4">
                {reportData.recentMaintenance.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4 py-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getMaintenanceTypeIcon(activity.maintenance.type)}</span>
                          <h4 className="font-medium text-gray-900">{activity.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.maintenance.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : activity.maintenance.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.maintenance.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Type:</strong> {activity.maintenance.type.charAt(0).toUpperCase() + activity.maintenance.type.slice(1)}
                        </p>
                        
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Description:</strong> {activity.maintenance.description}
                        </p>
                        
                        {activity.maintenance.cost > 0 && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Cost:</strong> ₹{activity.maintenance.cost.toFixed(2)}
                          </p>
                        )}
                        
                        {activity.maintenance.nextMaintenanceDate && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Next Maintenance:</strong> {new Date(activity.maintenance.nextMaintenanceDate).toLocaleDateString()}
                          </p>
                        )}
                        
                        {activity.maintenance.notes && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Notes:</strong> {activity.maintenance.notes}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Performed by: {activity.performedBy?.name} • {new Date(activity.maintenance.performedDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent maintenance activities</p>
            )}
          </div>
        </>
      )}

      {/* Add Maintenance Modal */}
      {showAddMaintenance && canAddMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Maintenance Record</h3>
                <button
                  onClick={() => setShowAddMaintenance(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddMaintenance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment *
                  </label>
                  <select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Equipment</option>
                    {equipment.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.equipmentCode || 'No Code'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Type *
                  </label>
                  <select
                    name="type"
                    value={maintenanceForm.type}
                    onChange={handleMaintenanceFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="routine">Routine</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="calibration">Calibration</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={maintenanceForm.description}
                    onChange={handleMaintenanceFormChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={maintenanceForm.cost}
                    onChange={handleMaintenanceFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Maintenance Date
                  </label>
                  <input
                    type="date"
                    name="nextMaintenanceDate"
                    value={maintenanceForm.nextMaintenanceDate}
                    onChange={handleMaintenanceFormChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={maintenanceForm.status}
                    onChange={handleMaintenanceFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={maintenanceForm.notes}
                    onChange={handleMaintenanceFormChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMaintenance(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceReport;