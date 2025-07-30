import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addYears, subYears, setMonth, setYear } from 'date-fns';

const BookingCalendar = ({ bookings = [], onDateRangeChange, onDateSelect, onBookingSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const initialLoadRef = useRef(true);
  const lastCallbackRef = useRef(null);
  const navigationInProgressRef = useRef(false);

  // Stable callback for date range changes
  const stableOnDateRangeChange = useCallback((startDate, endDate) => {
    if (onDateRangeChange && !navigationInProgressRef.current) {
      try {
        onDateRangeChange(startDate, endDate);
      } catch (error) {
        console.error('Error in onDateRangeChange callback:', error);
      }
    }
  }, [onDateRangeChange]);

  // Navigation functions with navigation lock
  const nextMonth = useCallback(() => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = addMonths(prev, 1);
      console.log('Navigating to next month:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const prevMonth = useCallback(() => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = subMonths(prev, 1);
      console.log('Navigating to previous month:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const nextYear = useCallback(() => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = addYears(prev, 1);
      console.log('Navigating to next year:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const prevYear = useCallback(() => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = subYears(prev, 1);
      console.log('Navigating to previous year:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const goToToday = useCallback(() => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    const today = new Date();
    console.log('Navigating to today:', format(today, 'MMMM yyyy'));
    setCurrentMonth(today);
    setSelectedDate(today);
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const handleMonthChange = useCallback((monthIndex) => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = setMonth(prev, monthIndex);
      console.log('Month dropdown changed to:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  const handleYearChange = useCallback((year) => {
    navigationInProgressRef.current = true;
    setIsNavigating(true);
    setCurrentMonth(prev => {
      const newMonth = setYear(prev, year);
      console.log('Year dropdown changed to:', format(newMonth, 'MMMM yyyy'));
      return newMonth;
    });
    setTimeout(() => {
      navigationInProgressRef.current = false;
      setIsNavigating(false);
    }, 800);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
        return; // Don't interfere with form inputs
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevMonth();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextMonth();
          break;
        case 'ArrowUp':
          event.preventDefault();
          prevYear();
          break;
        case 'ArrowDown':
          event.preventDefault();
          nextYear();
          break;
        case 'Home':
          event.preventDefault();
          goToToday();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array since functions are stable

  useEffect(() => {
    // Update date range when month changes
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const currentDateKey = `${startDate.getTime()}-${endDate.getTime()}`;
    
    console.log('Calendar month changed:', {
      currentMonth: format(currentMonth, 'MMMM yyyy'),
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      isInitialLoad: initialLoadRef.current,
      navigationInProgress: navigationInProgressRef.current,
      dateKey: currentDateKey
    });
    
    // Only call the callback if this is a new date range and not during navigation
    if (!initialLoadRef.current && lastCallbackRef.current !== currentDateKey && !navigationInProgressRef.current) {
      lastCallbackRef.current = currentDateKey;
      
      const timeoutId = setTimeout(() => {
        stableOnDateRangeChange(startDate, endDate);
      }, 600); // Longer debounce to ensure navigation is complete
      
      return () => clearTimeout(timeoutId);
    }
    
    // Mark that initial load is complete
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      lastCallbackRef.current = currentDateKey;
    }
  }, [currentMonth, stableOnDateRangeChange]);

  useEffect(() => {
    // Process bookings data for calendar display, but don't update during navigation
    if (!navigationInProgressRef.current) {
      console.log('BookingCalendar received bookings:', bookings);
      if (bookings && bookings.length > 0) {
        setCalendarBookings(bookings);
      } else {
        setCalendarBookings([]);
      }
    }
  }, [bookings]);



  const onDateClick = (day) => {
    console.log('Calendar date clicked:', day);
    setSelectedDate(day);
    
    // Check if there are existing bookings for this date
    const dayBookings = calendarBookings.filter(booking => {
      try {
        const bookingDate = booking.bookingDate || booking.start || booking.date;
        const matches = bookingDate && isSameDay(new Date(bookingDate), day);
        if (matches) {
          console.log('Found booking for this date:', booking);
        }
        return matches;
      } catch (error) {
        console.error('Error comparing dates:', error, booking);
        return false;
      }
    });
    
    console.log('Day bookings found:', dayBookings);
    
    if (onDateSelect) {
      console.log('Calling onDateSelect with:', { day, dayBookings });
      // Pass both the date and whether there are existing bookings
      onDateSelect(day, dayBookings);
    } else {
      console.warn('onDateSelect callback not provided');
    }
  };

  const renderHeader = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    // Generate year options (current year ± 10 years for better range)
    const yearOptions = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      yearOptions.push(i);
    }

    return (
      <div className="mb-4">
        {/* Main navigation row */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 space-y-2 sm:space-y-0">
          {/* Year navigation */}
          <div className="flex items-center space-x-1 order-2 sm:order-1">
            <button
              onClick={prevYear}
              className="p-1 rounded hover:bg-gray-200 text-gray-600"
              title="Previous Year"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Previous Month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Month and Year display/selectors */}
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <select
              value={currentMonthIndex}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="text-lg font-semibold bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded px-2 py-1 cursor-pointer"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="text-lg font-semibold bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded px-2 py-1 cursor-pointer"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Forward navigation */}
          <div className="flex items-center space-x-1 order-3">
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Next Month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={nextYear}
              className="p-1 rounded hover:bg-gray-200 text-gray-600"
              title="Next Year"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick navigation buttons */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex justify-center space-x-2 flex-wrap">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(new Date(), 1))}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Next Month
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(new Date(), 1))}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Last Month
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Use arrow keys: ← → (months), ↑ ↓ (years), Home (today)
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = 'EEE';
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-sm text-gray-600 py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find bookings for this day
        const dayBookings = calendarBookings.filter(booking => {
          // Handle different date formats that might come from the API
          try {
            const bookingDate = booking.bookingDate || booking.start || booking.date;
            return bookingDate && isSameDay(new Date(bookingDate), cloneDay);
          } catch (error) {
            console.error('Error comparing dates:', error, booking);
            return false;
          }
        });
        
        days.push(
          <div
            className={`min-h-[100px] p-1 border ${
              !isSameMonth(day, monthStart)
                ? 'text-gray-400 bg-gray-50'
                : isSameDay(day, selectedDate)
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white'
            } cursor-pointer`}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between">
              <span className={`text-sm ${
                isSameDay(day, new Date()) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
              }`}>
                {formattedDate}
              </span>
              {dayBookings.length > 0 && (
                <span className="text-xs bg-green-500 text-white rounded-full px-1.5 py-0.5">
                  {dayBookings.length}
                </span>
              )}
            </div>
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
              {dayBookings.map((booking) => {
                // Handle different booking data structures
                const bookingId = booking._id || booking.id || `booking-${Math.random()}`;
                const status = booking.status || 'inquiry';
                const startTime = booking.timeSlot?.startTime || 
                                 (booking.start ? new Date(booking.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '');
                const contactName = booking.contactPerson?.name || 
                                   booking.title || 
                                   (booking.client?.name || 'Unnamed');
                
                return (
                  <div
                    key={bookingId}
                    className={`text-xs p-1 rounded truncate ${
                      status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      status === 'inquiry' ? 'bg-yellow-100 text-yellow-800' :
                      status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBookingSelect) onBookingSelect(booking);
                    }}
                  >
                    {startTime && `${startTime} - `}{contactName}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="calendar">
      {isNavigating && (
        <div className="mb-2 text-center">
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Navigating...
          </span>
        </div>
      )}
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default BookingCalendar;