import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getUsers } from '../../services/userService';

const BookingList = ({ bookings = [], onEdit, onCreateInvoice, onDelete, onStatusUpdate, bookingType = 'studio' }) => {
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    searchTerm: ''
  });
  const [clients, setClients] = useState([]);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getUsers({ role: 'client' });
        if (response.data) {
          setClients(response.data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const statusColors = {
    inquiry: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filters.status && booking.status !== filters.status) {
      return false;
    }
    
    // Filter by client
    if (filters.client && booking.client?._id !== filters.client) {
      return false;
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      return (
        (booking.contactPerson?.name && booking.contactPerson.name.toLowerCase().includes(searchTerm)) ||
        (booking.purpose && booking.purpose.toLowerCase().includes(searchTerm)) ||
        (booking.client?.name && booking.client.name.toLowerCase().includes(searchTerm)) ||
        (booking.client?.company && booking.client.company.toLowerCase().includes(searchTerm))
      );
    }
    
    return true;
  });

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="inquiry">Inquiry</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <select
            id="client"
            name="client"
            value={filters.client}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name} {client.company && `(${client.company})`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Search by name, purpose..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bookings found matching your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => {
                // Check if this is demo data
                const isDemoData = booking._id.startsWith('current-') || booking._id.startsWith('calendar-') || booking._id.startsWith('upcoming-') || booking.id?.startsWith('current-') || booking.id?.startsWith('calendar-') || booking.id?.startsWith('upcoming-');
                const isValidId = /^[0-9a-fA-F]{24}$/.test(booking._id);
                
                return (
                  <tr key={booking._id} className={`hover:bg-gray-50 ${isDemoData ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                        {isDemoData && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.contactPerson.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.contactPerson.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {booking.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{booking.pricing?.totalAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          {isDemoData ? (
                            <span className="text-xs text-gray-400" title="Cannot edit demo data">
                              Edit (Demo)
                            </span>
                          ) : (
                            <button
                              onClick={() => onEdit(booking)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            isDemoData ? (
                              <span className="text-xs text-gray-400" title="Cannot delete demo data">
                                Delete (Demo)
                              </span>
                            ) : (
                              <button
                                onClick={() => onDelete(booking)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button>
                            )
                          )}
                          {bookingType === 'event' && booking.status === 'confirmed' && !booking.invoice && onCreateInvoice && 
                           // Only show invoice button for real bookings (valid MongoDB ObjectIds)
                           isValidId && !isDemoData && (
                            <button
                              onClick={() => onCreateInvoice(booking)}
                              className="text-green-600 hover:text-green-900 text-xs"
                              title="Create Invoice"
                            >
                              Invoice
                            </button>
                          )}
                          {booking.invoice && (
                            <span className="text-xs text-gray-500" title="Invoice already created">
                              📄 Invoiced
                            </span>
                          )}
                          {isDemoData && (
                            <span className="text-xs text-amber-600" title="Demo data - create real booking to enable all features">
                              📋 Demo
                            </span>
                          )}
                        </div>
                        {onStatusUpdate && booking.status !== 'completed' && booking.status !== 'cancelled' && !isDemoData && (
                          <select
                            value={booking.status}
                            onChange={(e) => onStatusUpdate(booking, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 py-0.5"
                          >
                            <option value="inquiry">Inquiry</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                        {isDemoData && (
                          <span className="text-xs text-amber-600">
                            Demo Data
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingList;