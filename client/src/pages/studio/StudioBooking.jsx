import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, getCalendarBookings, updateBooking, deleteBooking } from '../../services/studioService';
import BookingCalendar from '../../components/studio/BookingCalendar';
import BookingList from '../../components/studio/BookingList';
import BookingForm from '../../components/studio/BookingForm';
import DayView from '../../components/studio/DayView';
import BookingDetailsModal from '../../components/studio/BookingDetailsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const StudioBooking = () => {
  const [view, setView] = useState('calendar'); // 'calendar', 'list', 'form'
  const [bookings, setBookings] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)), // First day of current month
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)) // Last day of current month
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    booking: null
  });
  const [showDayView, setShowDayView] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      console.log('No authentication token found, redirecting to login');
      navigate('/auth/login', { state: { from: '/studio' } });
    }
  }, [token, authLoading, navigate]);
  
  // Function to force refresh data
  const refreshData = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Fetch bookings for list view
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await getBookings();
        console.log('Bookings response:', response);
        
        // Handle different response formats
        if (response && response.data) {
          setBookings(response.data);
        } else if (Array.isArray(response)) {
          setBookings(response);
        } else {
          setBookings([]);
          console.warn('Unexpected bookings response format:', response);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load bookings. Please try again.');
        console.error('Error fetching bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (view === 'list') {
      fetchBookings();
    }
  }, [view, refreshKey]);

  // Fetch bookings for calendar view
  const fetchCalendarBookings = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await getCalendarBookings(
        startDate.toISOString(),
        endDate.toISOString()
      );
      console.log('Calendar bookings response:', response);
      
      // Handle different response formats
      if (response && response.data) {
        setCalendarBookings(response.data);
      } else if (Array.isArray(response)) {
        setCalendarBookings(response);
      } else {
        setCalendarBookings([]);
        console.warn('No calendar data returned');
      }
      
      setError(null);
    } catch (err) {
      // Don't show error for navigation - just log it and continue with empty data
      console.error('Error fetching calendar bookings:', err);
      setCalendarBookings([]);
      setError(null); // Don't show error to user for calendar navigation
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load for calendar view and when filters change
  useEffect(() => {
    if (view === 'calendar') {
      fetchCalendarBookings(filters.startDate, filters.endDate);
    }
  }, [view, refreshKey, filters.startDate, filters.endDate, fetchCalendarBookings]);
  
  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setView('form');
  };

  const handleEditBooking = (booking) => {
    // Show booking details modal instead of going directly to edit
    setSelectedBookingForDetails(booking);
    setShowBookingDetails(true);
  };

  const handleEditFromDetails = (booking) => {
    // Close details modal and open edit form
    setShowBookingDetails(false);
    setSelectedBookingForDetails(null);
    setSelectedBooking(booking);
    setView('form');
  };

  const handleDeleteFromDetails = (booking) => {
    // Close details modal and trigger delete
    setShowBookingDetails(false);
    setSelectedBookingForDetails(null);
    handleDeleteBooking(booking);
  };

  const handleDeleteBooking = (booking) => {
    setDeleteDialog({
      isOpen: true,
      booking: booking
    });
  };

  const confirmDeleteBooking = async () => {
    if (!deleteDialog.booking) return;
    
    try {
      const response = await deleteBooking(deleteDialog.booking._id);
      if (response.success) {
        toast.success('Studio booking deleted successfully!');
        // Immediately update the local state to reflect the deletion
        setBookings(prev => prev.filter(booking => booking._id !== deleteDialog.booking._id));
        setCalendarBookings(prev => prev.filter(booking => booking.id !== deleteDialog.booking._id));
        // Close the delete dialog
        setDeleteDialog({ isOpen: false, booking: null });
        // Also refresh data from server
        refreshData();
      } else {
        toast.error(response.error || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    }
  };

  const handleStatusUpdate = async (booking, newStatus) => {
    try {
      const response = await updateBooking(booking._id, { status: newStatus });
      if (response.success) {
        toast.success(`Booking status updated to ${newStatus}`);
        refreshData();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleBookingCreated = () => {
    // Refresh data and return to calendar view
    refreshData();
    setView('calendar');
  };

  const handleDayViewAddBooking = (selectedDate) => {
    setSelectedDate(selectedDate);
    setSelectedBooking(null);
    setShowDayView(false);
    setView('form');
  };

  const handleDayViewEditBooking = (booking) => {
    setSelectedBooking(booking);
    setShowDayView(false);
    setView('form');
  };

  const handleDayViewDeleteBooking = (booking) => {
    setShowDayView(false);
    handleDeleteBooking(booking);
  };

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    console.log('Date range change requested:', {
      newStart: startDate.toISOString().split('T')[0],
      newEnd: endDate.toISOString().split('T')[0]
    });
    
    // Update filters in a way that doesn't interfere with calendar navigation
    setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    }, 100);
  }, []); // Remove dependencies to make callback stable

  const handleDateSelect = (date, existingBookings = []) => {
    console.log('handleDateSelect called with:', { date, existingBookings });
    setSelectedDate(date);
    setSelectedDayDate(date);
    
    // If there are existing bookings, show the day view
    // If no existing bookings, go directly to create new booking
    if (existingBookings.length > 0) {
      console.log('Showing day view for date with existing bookings');
      console.log('Setting showDayView to true, selectedDayDate to:', date);
      setShowDayView(true);
      // Make sure we're not in form view when showing day view
      setView('calendar');
    } else {
      console.log('Going to form view for date with no bookings');
      // Go directly to create new booking for this date
      setSelectedBooking(null);
      setView('form');
      setShowDayView(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Booking</h1>
          <p className="text-gray-600 mt-1">
            Manage studio bookings, availability, and scheduling.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-md ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Studio Bookings
          </button>
          <button
            onClick={refreshData}
            className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleCreateBooking}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            New Booking
          </button>
        </div>
      </div>



      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {view === 'calendar' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Booking Calendar</h2>
              </div>
              <div className="p-4">
                <BookingCalendar
                  key="studio-calendar"
                  bookings={calendarBookings}
                  onDateRangeChange={handleDateRangeChange}
                  onDateSelect={handleDateSelect}
                  onBookingSelect={handleEditBooking}
                />
              </div>
            </div>
          )}

          {view === 'list' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Studio Bookings</h2>
              </div>
              <div className="p-4">
                <BookingList
                  bookings={bookings}
                  onEdit={handleEditBooking}
                  onDelete={handleDeleteBooking}
                  onStatusUpdate={handleStatusUpdate}
                  bookingType="studio"
                />
              </div>
            </div>
          )}

          {view === 'form' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedBooking ? 'Edit Booking' : 'New Booking'}
                </h2>
              </div>
              <div className="p-4">
                <BookingForm
                  booking={selectedBooking}
                  selectedDate={selectedDate && !isNaN(new Date(selectedDate)) ? selectedDate : new Date()}
                  onCancel={() => setView('calendar')}
                  onSuccess={handleBookingCreated}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Day View Modal */}
      {showDayView && (
        <DayView
          selectedDate={selectedDayDate || selectedDate}
          bookings={calendarBookings}
          onClose={() => setShowDayView(false)}
          onAddBooking={handleDayViewAddBooking}
          onEditBooking={handleEditBooking}
          onDeleteBooking={handleDayViewDeleteBooking}
          bookingType="studio"
        />
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBookingForDetails && (
        <BookingDetailsModal
          booking={selectedBookingForDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBookingForDetails(null);
          }}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
          onStatusUpdate={handleStatusUpdate}
          bookingType="studio"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, booking: null })}
        onConfirm={confirmDeleteBooking}
        title="Delete Studio Booking"
        message={`Are you sure you want to delete the booking for "${deleteDialog.booking?.contactPerson?.name || 'this client'}" on ${deleteDialog.booking?.bookingDate ? new Date(deleteDialog.booking.bookingDate).toLocaleDateString() : 'the selected date'}? This action cannot be undone.`}
        confirmText="Delete Booking"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default StudioBooking;