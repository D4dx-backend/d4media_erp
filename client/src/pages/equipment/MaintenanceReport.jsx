import React from 'react';
import MaintenanceReportComponent from '../../components/equipment/MaintenanceReport';

const MaintenanceReport = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Report</h1>
        <p className="text-gray-600">Track equipment maintenance and service history</p>
      </div>

      {/* Maintenance Report Component */}
      <MaintenanceReportComponent />
    </div>
  );
};

export default MaintenanceReport;