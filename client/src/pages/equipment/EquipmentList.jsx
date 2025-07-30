import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import equipmentService from '../../services/equipmentService';
import EquipmentListComponent from '../../components/equipment/EquipmentList';
import EquipmentForm from '../../components/equipment/EquipmentForm';

const EquipmentList = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Check if user can create equipment (admin only)
  const canCreateEquipment = ['super_admin', 'department_admin'].includes(user?.role);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentService.getAllEquipment();
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setError('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (equipmentData) => {
    try {
      await equipmentService.createEquipment(equipmentData);
      await fetchEquipment();
      setShowForm(false);
      setError('');
    } catch (error) {
      console.error('Error creating equipment:', error);
      setError(error.response?.data?.message || 'Failed to create equipment');
    }
  };

  const handleUpdateEquipment = async (id, equipmentData) => {
    try {
      await equipmentService.updateEquipment(id, equipmentData);
      await fetchEquipment();
      setSelectedEquipment(null);
      setShowForm(false);
      setError('');
    } catch (error) {
      console.error('Error updating equipment:', error);
      setError(error.response?.data?.message || 'Failed to update equipment');
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      await equipmentService.deleteEquipment(id);
      await fetchEquipment();
      setError('');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setError(error.response?.data?.message || 'Failed to delete equipment');
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
          <h1 className="text-2xl font-bold text-gray-900">Equipment List</h1>
          <p className="text-gray-600">Manage your equipment inventory</p>
        </div>
        
        {canCreateEquipment && (
          <button
            onClick={() => {
              setSelectedEquipment(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Add Equipment
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Equipment List */}
      <EquipmentListComponent
        equipment={equipment}
        onEdit={(equipment) => {
          setSelectedEquipment(equipment);
          setShowForm(true);
        }}
        onDelete={handleDeleteEquipment}
        canEdit={canCreateEquipment}
        canDelete={canCreateEquipment}
      />

      {/* Equipment Form Modal */}
      {showForm && (
        <EquipmentForm
          equipment={selectedEquipment}
          onSubmit={selectedEquipment ? 
            (data) => handleUpdateEquipment(selectedEquipment._id, data) : 
            handleCreateEquipment
          }
          onCancel={() => {
            setShowForm(false);
            setSelectedEquipment(null);
          }}
        />
      )}
    </div>
  );
};

export default EquipmentList;