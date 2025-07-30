import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getCalendarEvents, updateEvent, deleteEvent } from '../../services/eventService';
import BookingCalendar from '../../components/studio/BookingCalendar';
import BookingList from '../../components/studio/BookingList';
import DayView from '../../components/studio/DayView';
import BookingDetailsModal from '../../components/studio/BookingDetailsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const EventBookingManagement = () => {
    const [view, setView] = useState('calendar'); // 'calendar', 'list'
    const [bookings, setBookings] = useState([]);
    const [calendarBookings, setCalendarBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(1)), // First day of current month
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)), // Last day of current month
        type: 'event' // Filter for event bookings only
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
            navigate('/auth/login', { state: { from: '/events' } });
        }
    }, [token, authLoading, navigate]);

    // Function to force refresh data
    const refreshData = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    // Generate mock events for current list
    const generateMockEvents = useCallback(() => {
        const today = new Date();
        const mockData = [];

        // Generate some current external events
        const organizations = [
            'City Council', 'Chamber of Commerce', 'Local University',
            'Community Center', 'Cultural Association'
        ];

        const eventTypes = [
            'Town Hall Meeting', 'Business Networking', 'Academic Conference',
            'Community Workshop', 'Cultural Festival'
        ];

        // Generate 3 current events
        for (let i = 0; i < 3; i++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + i * 2); // Current events (next few days)

            mockData.push({
                _id: `current-${i}`,
                title: `${eventTypes[i]}`,
                start: new Date(eventDate.setHours(14 + i, 0, 0)),
                end: new Date(eventDate.setHours(17 + i, 0, 0)),
                status: 'confirmed',
                client: {
                    id: `org-${i}`,
                    name: organizations[i],
                    company: organizations[i]
                },
                contactPerson: {
                    name: `Event Manager ${i + 1}`,
                    phone: `555-789-${3000 + i}`
                },
                bookingDate: eventDate,
                timeSlot: {
                    startTime: `${14 + i}:00`,
                    endTime: `${17 + i}:00`
                },
                purpose: eventTypes[i],
                pricing: {
                    totalAmount: 2500 + (i * 750)
                },
                notes: `Current external event - ${eventTypes[i]}`
            });
        }

        return mockData;
    }, []);

    // Fetch events for list view
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);

                // Try to get external events from API
                const response = await getEvents({ type: 'external' });
                console.log('External events response:', response);

                // Handle different response formats
                if (response && response.success && response.data && response.data.length > 0) {
                    setBookings(response.data);
                } else if (Array.isArray(response) && response.length > 0) {
                    setBookings(response);
                } else {
                    // If no data from API, use mock data
                    console.log('No API data, using mock events');
                    setBookings(generateMockEvents());
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching external events:', err);
                // If API fails, use mock data
                setBookings(generateMockEvents());
                setError(null); // Don't show error, just use mock data
            } finally {
                setLoading(false);
            }
        };

        if (view === 'list') {
            fetchEvents();
        }
    }, [view, refreshKey, generateMockEvents]);



    // Generate mock calendar events
    const generateMockCalendarEvents = useCallback(() => {
        const today = new Date();
        const calendarData = [];

        // Generate some calendar events for the current month
        for (let i = 0; i < 4; i++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + (i * 5)); // Spread events across the month

            calendarData.push({
                id: `calendar-${i}`,
                title: `External Event ${i + 1}`,
                start: new Date(eventDate.setHours(10 + i, 0, 0)),
                end: new Date(eventDate.setHours(15 + i, 0, 0)),
                status: 'confirmed',
                type: 'external'
            });
        }

        return calendarData;
    }, []);

    // Fetch events for calendar view
    const fetchCalendarEvents = useCallback(async (startDate, endDate) => {
        try {
            setLoading(true);

            // Try to get external events for calendar
            const response = await getCalendarEvents(
                startDate.toISOString(),
                endDate.toISOString(),
                { type: 'external' }
            );
            console.log('Calendar external events response:', response);

            // Handle different response formats
            if (response && response.success && response.data && response.data.length > 0) {
                setCalendarBookings(response.data);
            } else if (Array.isArray(response) && response.length > 0) {
                setCalendarBookings(response);
            } else {
                // If no data from API, use mock data
                console.log('No calendar API data, using mock events');
                setCalendarBookings(generateMockCalendarEvents());
            }

            setError(null);
        } catch (err) {
            // Don't show error for navigation - just log it and use mock data
            console.error('Error fetching calendar external events:', err);
            setCalendarBookings(generateMockCalendarEvents());
            setError(null); // Don't show error to user for calendar navigation
        } finally {
            setLoading(false);
        }
    }, [generateMockCalendarEvents]);

    // Initial load for calendar view and when filters change
    useEffect(() => {
        if (view === 'calendar') {
            fetchCalendarEvents(filters.startDate, filters.endDate);
        }
    }, [view, refreshKey, filters.startDate, filters.endDate, fetchCalendarEvents]);

    const handleCreateBooking = () => {
        navigate('/events/booking');
    };

    const handleEditBooking = (booking) => {
        // Show booking details modal instead of going directly to edit
        setSelectedBookingForDetails(booking);
        setShowBookingDetails(true);
    };

    const handleEditFromDetails = (booking) => {
        // Close details modal and navigate to edit form
        setShowBookingDetails(false);
        setSelectedBookingForDetails(null);
        
        // Check if this is demo data
        if (booking._id.startsWith('current-') || booking._id.startsWith('calendar-') || booking._id.startsWith('upcoming-')) {
            toast.error('Cannot edit demo data. Please create a real event booking first.');
            return;
        }
        
        // Validate MongoDB ObjectId format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(booking._id);
        if (!isValidObjectId) {
            toast.error('Invalid booking ID. Cannot edit demo data.');
            return;
        }
        
        // Navigate to event booking form with booking ID for editing
        navigate(`/events/booking?edit=${booking._id}`);
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
            const response = await deleteEvent(deleteDialog.booking._id);
            if (response.success) {
                toast.success('Event deleted successfully!');
                // Immediately update the local state to reflect the deletion
                setBookings(prev => prev.filter(booking => booking._id !== deleteDialog.booking._id));
                setCalendarBookings(prev => prev.filter(booking => booking.id !== deleteDialog.booking._id));
                // Close the delete dialog
                setDeleteDialog({ isOpen: false, booking: null });
                // Also refresh data from server
                refreshData();
            } else {
                toast.error(response.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error(error.message || 'Failed to delete event');
        }
    };

    const handleStatusUpdate = async (booking, newStatus) => {
        try {
            const response = await updateEvent(booking._id, { status: newStatus });
            if (response.success) {
                toast.success(`Event status updated to ${newStatus}`);
                
                // Check if invoice was auto-created
                if (newStatus === 'confirmed' && response.data?.invoice) {
                    toast.success('Invoice automatically created for confirmed event!');
                }
                
                refreshData();
            } else {
                toast.error(response.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleCreateInvoice = async (booking) => {
        try {
            // Check if this is mock data (fake ID)
            if (booking._id.startsWith('current-') || booking._id.startsWith('calendar-')) {
                toast.error('Cannot create invoice for demo data. Please create a real event booking first.');
                return;
            }
            
            // Validate that it's a proper MongoDB ObjectId
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(booking._id);
            if (!isValidObjectId) {
                toast.error('Invalid booking ID. Cannot create invoice for demo data.');
                return;
            }
            
            const { createEventInvoice } = await import('../../services/invoiceService');
            const response = await createEventInvoice(booking._id);
            
            if (response.success) {
                toast.success('Invoice created successfully!');
                refreshData(); // Refresh the bookings list
            } else {
                toast.error(response.message || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error(error.message || 'Failed to create invoice');
        }
    };

    const handleDateRangeChange = useCallback((startDate, endDate) => {
        console.log('Event calendar date range change requested:', {
            newStart: startDate.toISOString().split('T')[0],
            newEnd: endDate.toISOString().split('T')[0]
        });

        // Update filters in a way that doesn't interfere with calendar navigation
        setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                startDate,
                endDate,
                type: 'event'
            }));
        }, 100);
    }, []); // Remove dependencies to make callback stable

    const handleDateSelect = (date, existingBookings = []) => {
        setSelectedDayDate(date);
        
        // If there are existing bookings, show the day view
        // If no existing bookings, go directly to create new event
        if (existingBookings.length > 0) {
            setShowDayView(true);
        } else {
            // Go directly to create new event for this date
            const formattedDate = date.toISOString().split('T')[0];
            navigate(`/events/booking?date=${formattedDate}`);
        }
    };

    const handleDayViewAddBooking = (selectedDate) => {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        navigate(`/events/booking?date=${formattedDate}`);
    };

    const handleDayViewEditBooking = (booking) => {
        setShowDayView(false);
        handleEditBooking(booking);
    };

    const handleDayViewDeleteBooking = (booking) => {
        setShowDayView(false);
        handleDeleteBooking(booking);
    };

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">External Event Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage external events and outside programs - separate from studio bookings.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-4 py-2 rounded-md ${view === 'calendar'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Calendar
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-2 rounded-md ${view === 'list'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        External Events
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
                        New External Event
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
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium text-gray-900">External Events Calendar</h2>
                                    {calendarBookings.some(b => b.id?.startsWith('calendar-')) && (
                                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                            📋 Demo Data - Create real bookings to generate invoices
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <BookingCalendar
                                    key="event-calendar"
                                    bookings={calendarBookings}
                                    onDateRangeChange={handleDateRangeChange}
                                    onDateSelect={handleDateSelect}
                                    onBookingSelect={handleEditBooking}
                                    bookingType="event"
                                />
                            </div>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium text-gray-900">External Events</h2>
                                    {bookings.some(b => b._id.startsWith('current-')) && (
                                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                            📋 Demo Data - Create real bookings to generate invoices
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <BookingList
                                    bookings={bookings}
                                    onEdit={handleEditBooking}
                                    onDelete={handleDeleteBooking}
                                    onStatusUpdate={handleStatusUpdate}
                                    onCreateInvoice={handleCreateInvoice}
                                    bookingType="event"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Day View Modal */}
            {showDayView && selectedDayDate && (
                <DayView
                    selectedDate={selectedDayDate}
                    bookings={calendarBookings}
                    onClose={() => setShowDayView(false)}
                    onAddBooking={handleDayViewAddBooking}
                    onEditBooking={handleEditBooking}
                    onDeleteBooking={handleDayViewDeleteBooking}
                    bookingType="event"
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
                    bookingType="event"
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, booking: null })}
                onConfirm={confirmDeleteBooking}
                title="Delete Event"
                message={`Are you sure you want to delete the event "${deleteDialog.booking?.eventTitle || deleteDialog.booking?.purpose || 'this event'}"? This action cannot be undone.`}
                confirmText="Delete Event"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default EventBookingManagement;