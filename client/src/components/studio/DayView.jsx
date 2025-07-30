import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Plus, Clock, User, Edit, Trash2 } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';

const DayView = ({ 
  selectedDate, 
  bookings = [], 
  onClose, 
  onAddBooking, 
  onEditBooking, 
  onDeleteBooking,
  bookingType = 'studio' // 'studio' or 'event'
}) => {
  console.log('DayView rendered with:', { selectedDate, bookings, bookingType });
  
  // Safety check for selectedDate
  if (!selectedDate) {
    console.error('DayView: selectedDate is null or undefined');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">
          <p>Error: No date selected</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }
  
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    booking: null
  });

  // Filter bookings for the selected date
  const dayBookings = bookings.filter(booking => {
    try {
      const bookingDate = new Date(booking.bookingDate || booking.start || booking.date);
      const selectedDateOnly = new Date(selectedDate);
      
      const matches = bookingDate.toDateString() === selectedDateOnly.toDateString();
      if (matches) {
        console.log('DayView: Found matching booking:', booking);
      }
      return matches;
    } catch (error) {
      console.error('Error filtering booking by date:', error, booking);
      return false;
    }
  });
  
  console.log('DayView: Filtered day bookings:', dayBookings);

  // Sort bookings by start time
  const sortedBookings = dayBookings.sort((a, b) => {
    try {
      const timeA = a.timeSlot?.startTime || (a.start ? new Date(a.start).toTimeString() : '00:00');
      const timeB = b.timeSlot?.startTime || (b.start ? new Date(b.start).toTimeString() : '00:00');
      return timeA.localeCompare(timeB);
    } catch (error) {
      console.error('Error sorting bookings:', error);
      return 0;
    }
  });

  const handleDeleteClick = (booking) => {
    setDeleteDialog({
      isOpen: true,
      booking: booking
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.booking && onDeleteBooking) {
      onDeleteBooking(deleteDialog.booking);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return format(time, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate ? format(new Date(selectedDate), 'EEEE, MMMM d, yyyy') : 'Selected Date'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sortedBookings.length} {bookingType === 'studio' ? 'studio booking' : 'event'}{sortedBookings.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddBooking && onAddBooking(selectedDate)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add {bookingType === 'studio' ? 'Studio Booking' : 'Event'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings scheduled</h3>
              <p className="text-gray-600 mb-4">
                There are no {bookingType === 'studio' ? 'studio bookings' : 'events'} scheduled for this day.
              </p>
              <button
                onClick={() => onAddBooking && onAddBooking(selectedDate)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {bookingType === 'studio' ? 'Studio Booking' : 'Event'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBookings.map((booking) => (
                <div
                  key={booking._id || booking.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Time and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Clock className="w-4 h-4" />
                          {booking.timeSlot ? (
                            <>
                              {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                            </>
                          ) : booking.start && booking.end ? (
                            <>
                              {format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}
                            </>
                          ) : (
                            'Time not specified'
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                          {booking.status || 'inquiry'}
                        </span>
                      </div>

                      {/* Title/Purpose */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {booking.eventTitle || booking.purpose || booking.title || `${bookingType === 'studio' ? 'Studio Booking' : 'Event'}`}
                      </h3>

                      {/* Client/Contact Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {booking.contactPerson?.name || booking.client?.name || 'No contact'}
                          </span>
                        </div>
                        {booking.contactPerson?.phone && (
                          <div className="flex items-center gap-1">
                            <span>📞 {booking.contactPerson.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Details */}
                      {(booking.eventType || booking.teamSize || booking.duration) && (
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          {booking.eventType && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {booking.eventType}
                            </span>
                          )}
                          {booking.teamSize && (
                            <span>👥 {booking.teamSize} people</span>
                          )}
                          {booking.duration && (
                            <span>⏱️ {booking.duration}h</span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {(booking.eventDescription || booking.requirements || booking.description) && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {booking.eventDescription || booking.requirements || booking.description}
                        </p>
                      )}

                      {/* Pricing */}
                      {booking.pricing?.totalAmount && (
                        <div className="text-sm font-medium text-green-600">
                          ₹{booking.pricing.totalAmount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onEditBooking && onEditBooking(booking)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(booking)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, booking: null })}
        onConfirm={confirmDelete}
        title={`Delete ${bookingType === 'studio' ? 'Studio Booking' : 'Event'}`}
        message={`Are you sure you want to delete this ${bookingType === 'studio' ? 'studio booking' : 'event'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default DayView;