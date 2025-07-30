import React, { useState } from 'react';

const EquipmentList = ({ equipment, onEdit, onDelete, canEdit, canDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.equipmentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.checkoutStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(equipment.map(item => item.category))];
  const statuses = [...new Set(equipment.map(item => item.checkoutStatus))];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceStatusColor = (status) => {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Equipment Image */}
            {item.imageUrl && (
              <div className="h-48 bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  {item.equipmentCode && (
                    <p className="text-sm text-gray-600">Code: {item.equipmentCode}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.checkoutStatus)}`}>
                    {item.checkoutStatus.replace('_', ' ')}
                  </span>
                  {item.maintenanceStatus && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusColor(item.maintenanceStatus)}`}>
                      {item.maintenanceStatus.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                
                {item.brand && (
                  <div className="flex justify-between">
                    <span>Brand:</span>
                    <span className="font-medium">{item.brand}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-medium">
                    {item.actualAvailableQuantity || (item.availableQuantity - (item.currentQuantityOut || 0))} / {item.availableQuantity}
                  </span>
                </div>

                {item.assignedTo && (
                  <div className="flex justify-between">
                    <span>Assigned to:</span>
                    <span className="font-medium">{item.assignedTo.name}</span>
                  </div>
                )}

                {item.nextMaintenanceDate && (
                  <div className="flex justify-between">
                    <span>Next Maintenance:</span>
                    <span className="font-medium">
                      {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Actions */}
              {(canEdit || canDelete) && (
                <div className="flex gap-2 mt-4">
                  {canEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(item._id)}
                      className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
          <p className="text-gray-600">
            {equipment.length === 0 
              ? "No equipment has been added yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;