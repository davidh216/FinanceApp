import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  isOpen,
  onClose,
  onDateRangeSelect,
  currentStartDate,
  currentEndDate,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    currentStartDate ? new Date(currentStartDate) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    currentEndDate ? new Date(currentEndDate) : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!isSelectingEnd) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingEnd(true);
    } else {
      if (date >= selectedStartDate!) {
        setSelectedEndDate(date);
        setIsSelectingEnd(false);
      } else {
        // If end date is before start date, swap them
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
        setIsSelectingEnd(false);
      }
    }
  };

  const handleApply = () => {
    if (selectedStartDate && selectedEndDate) {
      onDateRangeSelect(
        selectedStartDate.toISOString().split('T')[0],
        selectedEndDate.toISOString().split('T')[0]
      );
      onClose();
    }
  };

  const handleClear = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEnd(false);
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateSelected = (date: Date) => {
    return (
      (selectedStartDate && date.toDateString() === selectedStartDate.toDateString()) ||
      (selectedEndDate && date.toDateString() === selectedEndDate.toDateString())
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={pickerRef}
        className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Selection Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Selected Range:</div>
          <div className="text-sm font-medium">
            {selectedStartDate ? formatDate(selectedStartDate) : 'Start date'} 
            {' → '}
            {selectedEndDate ? formatDate(selectedEndDate) : 'End date'}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-lg font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date, isCurrentMonth }, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  p-2 text-sm rounded-md transition-colors
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900 hover:bg-blue-50'}
                  ${isDateSelected(date) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isDateInRange(date) && !isDateSelected(date) ? 'bg-blue-100' : ''}
                  ${date.toDateString() === new Date().toDateString() ? 'font-bold' : ''}
                `}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedStartDate || !selectedEndDate}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}; 
