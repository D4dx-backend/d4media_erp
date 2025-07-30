import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, getCalendarBookings } from '../../services/studioService';
import BookingCalendar from '../../components/studio/BookingCalendar';
import BookingList from '../../components/studio/BookingList';
import BookingDetailsModal from '../../components/studio/BookingDetailsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const EventBookingManagement = () => {
    const [view, setView] = useState('calendar'); // 'calendar', 'list', 'separate'
    const [bookings, setBookings] = useState([]);
    const [calendarBookings, setCalendarBookings] = useState([]);
    const [separateBookings, setSeparateBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(1)), // First day of current month
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)), // Last day of current month
        type: 'event' // Filter for event bookings only
    });

    const navigate = useNavigate();
    const { user, token, loading: authLoading } = useAuth();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !token) {
            console.log('No authentication token found, redirecting to login');
            navigate('/auth/login', { state: { from: '/studio/events' } });
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
                // Add type=event filter to get only event bookings
                const response = await getBookings({ type: 'event' });
                console.log('Event bookings response:', response);

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
                setError('Failed to load event bookings. Please try again.');
                console.error('Error fetching event bookings:', err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        if (view === 'list') {
            fetchBookings();
        }
    }, [view, refreshKey]);

    // Generate separate list of bookings (upcoming events)
    const generateSeparateBookings = useCallback(() => {
        const today = new Date();
        const separateData = [];

        // Generate some upcoming event bookings
        const clients = [
            'Corporate Client A', 'Media Company B', 'Educational Institution C',
            'Non-profit Organization D', 'Government Agency E'
        ];

        const eventTypes = [
            'Annual Conference', 'Product Launch', 'Training Workshop',
            'Award Ceremony', 'Press Conference'
        ];

        // Generate 5 separate bookings
        for (let i = 0; i < 5; i++) {
            const bookingDate = new Date(today);
            bookingDate.setDate(today.getDate() + 7 + i * 3); // Upcoming events (7+ days in future)

            separateData.push({
                id: `upcoming-${i}`,
                title: `${eventTypes[i]}`,
                start: new Date(bookingDate.setHours(9 + i, 0, 0)),
                end: new Date(bookingDate.setHours(17 + i, 0, 0)),
                status: 'confirmed',
                client: {
                    id: `client-${i}`,
                    name: clients[i],
                    company: clients[i]
                },
                contactPerson: {
                    name: `Contact Person ${i+1}`,
                    phone: `555-123-${1000 + i}`,
                    email: `contact${i+1}@example.com`
                },
                bookingDate: bookingDate,
                timeSlot: {
                    startTime: `${9 + i}:00`,
                    endTime: `${17 + i}:00`
                },
                purpose: eventTypes[i],
                pricing: {
                    totalAmount: 3000 + (i * 500)
                },
                notes: 'Upcoming major event'
            });
        }

        return separateData;
    }, []);
    
    // Initialize separate bookings
    useEffect(() => {
        setSeparateBookings(generateSeparateBookings());
    }, [generateSeparateBookings]);

    // Fetch bookings for calendar view
    const fetchCalendarBookings = useCallback(async (startDate, endDate) => {
        try {
            setLoading(true);
            // Add type=event filter to get only event bookings
            const response = await getCalendarBookings(
                startDate.toISOString(),
                endDate.toISOString(),
                { type: 'event' }
            );
            console.log('Calendar event bookings response:', response);

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
            setError('Failed to load calendar data. Please try again.');
            console.error('Error fetching calendar event bookings:', err);
            setCalendarBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load for calendar view
    useEffect(() => {
        if (view === 'calendar') {
            fetchCalendarBookings(filters.startDate, filters.endDate);
        }
    }, [view, refreshKey, fetchCalendarBookings, filters.startDate, filters.endDate]);

    const handleCreateBooking = () => {
        navigate('/studio/event-booking');
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
        if (booking.id && (booking.id.startsWith('current-') || booking.id.startsWith('calendar-') || booking.id.startsWith('upcoming-'))) {
            toast.error('Cannot edit demo data. Please create a real event booking first.');
            return;
        }
        
        // Check if we have a valid booking ID
        if (booking._id) {
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(booking._id);
            if (!isValidObjectId) {
                toast.error('Invalid booking ID. Cannot edit demo data.');
                return;
            }
            // Navigate with the booking ID for editing
            navigate(`/studio/event-booking?edit=${booking._id}`);
        } else {
            // For now, just navigate to the event booking form for new bookings
            navigate('/studio/event-booking');
        }
    };

    const handleDeleteFromDetails = (booking) => {
        // Close details modal
        setShowBookingDetails(false);
        setSelectedBookingForDetails(null);
        // Note: This component doesn't have delete functionality, so we just close
    };

    const handleDateRangeChange = useCallback((startDate, endDate) => {
        // Only update if the dates are actually different
        if (filters.startDate.getTime() !== startDate.getTime() ||
            filters.endDate.getTime() !== endDate.getTime()) {
            setFilters(prev => ({
                ...prev,
                startDate,
                endDate
            }));
            // Fetch new data for the date range
            if (view === 'calendar') {
                fetchCalendarBookings(startDate, endDate);
            }
        }
    }, [filters.startDate, filters.endDate, view, fetchCalendarBookings]);

    const handleDateSelect = (date, existingBookings = []) => {
        setSelectedDate(date);
        
        // If there are existing bookings, we could show a day view here
        // For now, since this component doesn't have a day view, just navigate to create new
        // In the future, you might want to add a day view modal here too
        const formattedDate = date.toISOString().split('T')[0];
        navigate(`/studio/event-booking?date=${formattedDate}`);
    };

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Event Booking Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage event bookings, availability, and scheduling.
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
                        Current Events
                    </button>
                    <button
                        onClick={() => setView('separate')}
                        className={`px-4 py-2 rounded-md ${view === 'separate'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                    >
                        Upcoming Events
                    </button>
                    <button
                        onClick={refreshData}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={handleCreateBooking}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        New Event Booking
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
                                <h2 className="text-lg font-medium text-gray-900">Event Calendar</h2>
                            </div>
                            <div className="p-4">
                                <BookingCalendar
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
                                <h2 className="text-lg font-medium text-gray-900">Current Event Bookings</h2>
                            </div>
                            <div className="p-4">
                                <BookingList
                                    bookings={bookings}
                                    onEdit={handleEditBooking}
                                    bookingType="event"
                                />
                            </div>
                        </div>
                    )}

                    {view === 'separate' && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                                <h2 className="text-lg font-medium text-green-900 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Upcoming Event Bookings
                                </h2>
                            </div>
                            <div className="p-4">
                                <BookingList
                                    bookings={separateBookings}
                                    onEdit={handleEditBooking}
                                    bookingType="event"
                                />
                            </div>
                        </div>
                    )}
                </>
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
                    bookingType="event"
                />
            )}
        </div>
    );
};

export default EventBookingManagement;