import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layout components (keep these as regular imports for critical path)
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Lazy load page components for code splitting
const Login = React.lazy(() => import('./pages/auth/Login'))
const Register = React.lazy(() => import('./pages/auth/Register'))
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'))
const Tasks = React.lazy(() => import('./pages/tasks/Tasks'))
const TaskDetail = React.lazy(() => import('./pages/tasks/TaskDetail'))
const Users = React.lazy(() => import('./pages/users/Users'))
const Departments = React.lazy(() => import('./pages/departments/Departments'))
const StudioBooking = React.lazy(() => import('./pages/studio/StudioBooking'))
// Event booking components (separate from studio)
const EventBooking = React.lazy(() => import('./pages/studio/EventBooking'))
const EventBookingManagement = React.lazy(() => import('./pages/studio/EventBookingManagement'))
const RentalManagement = React.lazy(() => import('./pages/rentals/RentalManagement'))
const EquipmentManagement = React.lazy(() => import('./pages/admin/EquipmentManagement'))
const ErrorBoundary = React.lazy(() => import('./components/common/ErrorBoundary'))
const Reports = React.lazy(() => import('./pages/reports/Reports'))
const Settings = React.lazy(() => import('./pages/settings/Settings'))
const NotificationHistory = React.lazy(() => import('./pages/notifications/NotificationHistory'))
const InvoiceManagement = React.lazy(() => import('./pages/invoices/InvoiceManagement'))
const InvoiceDetail = React.lazy(() => import('./pages/invoices/InvoiceDetail'))
const CreateInvoice = React.lazy(() => import('./pages/invoices/CreateInvoice'))
const QuotationManagement = React.lazy(() => import('./pages/invoices/QuotationManagement'))
const CreateQuotation = React.lazy(() => import('./pages/invoices/CreateQuotation'))
const ActivityHistory = React.lazy(() => import('./pages/activities/ActivityHistory'))
const SystemActivities = React.lazy(() => import('./pages/activities/SystemActivities'))

// Loading component
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              user ? (
                <NotificationProvider>
                  <DashboardLayout />
                </NotificationProvider>
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="users/*" element={<Users />} />
            <Route path="departments/*" element={<Departments />} />
            <Route path="studio" element={<StudioBooking />} />
            {/* Event booking routes (separate from studio) */}
            <Route path="events" element={<EventBookingManagement />} />
            <Route path="events/booking" element={<EventBooking />} />
            <Route path="rentals" element={<RentalManagement />} />
            <Route path="equipment" element={
              <ErrorBoundary>
                <EquipmentManagement />
              </ErrorBoundary>
            } />
            <Route path="invoices" element={<InvoiceManagement />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="quotations" element={<QuotationManagement />} />
            <Route path="quotations/create" element={<CreateQuotation />} />
            <Route path="activities" element={<ActivityHistory />} />
            <Route path="system-activities" element={<SystemActivities />} />
            <Route path="reports/*" element={<Reports />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="notifications" element={<NotificationHistory />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      
      {/* Toast notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App