import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const EquipmentManagement = () => {
  // Redirect to equipment list by default
  return <Navigate to="/equipment/list" replace />;
};

export default EquipmentManagement;