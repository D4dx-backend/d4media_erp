import React, { useState, useEffect } from 'react';
import DashboardStats from '../../components/reports/DashboardStats';
import DailyReport from '../../components/reports/DailyReport';
import WeeklyReport from '../../components/reports/WeeklyReport';
import MonthlyReport from '../../components/reports/MonthlyReport';
import UserReport from '../../components/reports/UserReport';
import ClientReport from '../../components/reports/ClientReport';
import { getDepartments } from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await getDepartments();
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats departmentId={selectedDepartment} />;
      case 'daily':
        return <DailyReport departments={departments} />;
      case 'weekly':
        return <WeeklyReport departments={departments} />;
      case 'monthly':
        return <MonthlyReport departments={departments} />;
      case 'user':
        return <UserReport departments={departments} />;
      case 'client':
        return <ClientReport departments={departments} />;
      default:
        return <DashboardStats departmentId={selectedDepartment} />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">
          View analytics and generate reports for your projects.
        </p>
      </div>

      {/* Department Filter */}
      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mr-4 mb-2 sm:mb-0">
              Filter by Department:
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Report Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`${
                activeTab === 'daily'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`${
                activeTab === 'weekly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`${
                activeTab === 'user'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              User Report
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`${
                activeTab === 'client'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Client Report
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default Reports;