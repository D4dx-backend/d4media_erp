import React from 'react';

// Helper component to test calendar date selection behavior
const CalendarTestHelper = () => {
  const handleDateSelect = (date, existingBookings = []) => {
    console.log('Date selected:', date);
    console.log('Existing bookings:', existingBookings);
    
    if (existingBookings.length > 0) {
      console.log('✅ Has existing bookings - should show day view');
      alert(`Date ${date.toDateString()} has ${existingBookings.length} existing booking(s). Day view should open.`);
    } else {
      console.log('✅ No existing bookings - should go directly to create new');
      alert(`Date ${date.toDateString()} has no bookings. Should go directly to create new booking.`);
    }
  };

  // Mock bookings for testing
  const mockBookings = [
    {
      _id: 'test1',
      bookingDate: new Date(),
      timeSlot: { startTime: '10:00', endTime: '12:00' },
      contactPerson: { name: 'Test Client' }
    }
  ];

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Calendar Behavior Test</h3>
      <div className="space-y-2">
        <button
          onClick={() => handleDateSelect(new Date(), mockBookings)}
          className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test: Date with existing bookings
        </button>
        <button
          onClick={() => handleDateSelect(new Date(), [])}
          className="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test: Date with no bookings
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Expected behavior:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Date with existing bookings → Show day view popup</li>
          <li>Date with no bookings → Go directly to create new booking form</li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarTestHelper;