import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Edit, Trash2, Clock, User, MapPin, Phone, Mail, Building } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';

const BookingDetailsModal = ({ 
  booking, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusUpdate,
  bookingType = 'studio' 
}) => {
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    booking: null
  });

  if (!booking) return null;

  const handleDeleteClick = () => {
    setDeleteDialog({
      isOpen: true,
      booking: booking
    });
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(booking);
    }
    setDeleteDialog({ isOpen: false, booking: null });
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

  // Check if this is demo data
  const isDemoData = booking._id?.startsWith('current-') || booking._id?.startsWith('calendar-') || booking._id?.startsWith('upcoming-') || booking.id?.startsWith('current-') || booking.id?.startsWith('calendar-') || booking.id?.startsWith('upcoming-');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {bookingType === 'studio' ? 'Studio Booking Details' : 'Event Details'}
                {isDemoData && (
                  <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    DEMO DATA
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Inquiry'}
                </span>
                {booking.pricing?.totalAmount && (
                  <span className="text-lg font-semibold text-green-600">
                    ₹{booking.pricing.totalAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Date & Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Date & Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date:</span>
                  <div className="font-medium">
                    {format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <div className="font-medium">
                    {booking.timeSlot ? (
                      <>
                        {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                      </>
                    ) : (
                      'Time not specified'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{booking.contactPerson?.name || 'No contact name'}</span>
                </div>
                {booking.contactPerson?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{booking.contactPerson.phone}</span>
                  </div>
                )}
                {booking.contactPerson?.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{booking.contactPerson.email}</span>
                  </div>
                )}
                {booking.contactPerson?.company && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{booking.contactPerson.company}</span>
                  </div>
                )}
                {booking.client?.name && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <span className="text-xs text-blue-600 font-medium">Registered Client:</span>
                    <div className="text-sm font-medium text-blue-900">{booking.client.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {bookingType === 'studio' ? 'Studio Booking' : 'Event'} Details
              </h3>
              <div className="space-y-2 text-sm">
                {booking.purpose && (
                  <div>
                    <span className="text-gray-600">Purpose:</span>
                    <div className="font-medium">{booking.purpose}</div>
                  </div>
                )}
                {booking.eventTitle && (
                  <div>
                    <span className="text-gray-600">Event Title:</span>
                    <div className="font-medium">{booking.eventTitle}</div>
                  </div>
                )}
                {booking.eventType && (
                  <div>
                    <span className="text-gray-600">Event Type:</span>
                    <div className="font-medium">{booking.eventType}</div>
                  </div>
                )}
                {booking.teamSize && (
                  <div>
                    <span className="text-gray-600">Team Size:</span>
                    <div className="font-medium">{booking.teamSize} people</div>
                  </div>
                )}
                {booking.duration && (
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-medium">{booking.duration} hours</div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements & Notes */}
            {(booking.requirements || booking.specialRequirements || booking.additionalNotes) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Requirements & Notes</h3>
                <div className="space-y-2 text-sm">
                  {booking.requirements && (
                    <div>
                      <span className="text-gray-600">Requirements:</span>
                      <div className="mt-1 text-gray-900">{booking.requirements}</div>
                    </div>
                  )}
                  {booking.specialRequirements && (
                    <div>
                      <span className="text-gray-600">Special Requirements:</span>
                      <div className="mt-1 text-gray-900">{booking.specialRequirements}</div>
                    </div>
                  )}
                  {booking.additionalNotes && (
                    <div>
                      <span className="text-gray-600">Additional Notes:</span>
                      <div className="mt-1 text-gray-900">{booking.additionalNotes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Equipment */}
            {booking.equipment && booking.equipment.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Equipment</h3>
                <div className="space-y-2">
                  {booking.equipment.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{item.name}</span>
                      <span className="text-gray-600">
                        {item.quantity}x ₹{item.rate?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {onStatusUpdate && booking.status !== 'completed' && booking.status !== 'cancelled' && !isDemoData && (
                <select
                  value={booking.status}
                  onChange={(e) => onStatusUpdate(booking, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="inquiry">Inquiry</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {isDemoData ? (
                <>
                  <span className="text-sm text-gray-500">Demo data - limited actions</span>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(booking)}
                    className="flex items-center px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
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
    </>
  );
};

export default BookingDetailsModal;