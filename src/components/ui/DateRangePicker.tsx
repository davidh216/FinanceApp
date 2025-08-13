import React, { useState, useRef, useEffect } from 'react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './Button';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  onClose?: () => void;
  className?: string;
}

const PRESET_RANGES = [
  {
    label: 'Today',
    getRange: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: 'Yesterday',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 1)),
      endDate: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: 'Last 7 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 29)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 90 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 89)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: 'This month',
    getRange: () => ({
      startDate: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last month',
    getRange: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        startDate: startOfDay(lastMonth),
        endDate: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  onClose,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | null>(value || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (value) {
      setTempRange(value);
    }
  }, [value]);

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const range = preset.getRange();
    const newRange: DateRange = {
      ...range,
      label: preset.label,
    };
    setTempRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempRange) {
      onChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempRange(value || null);
    setIsOpen(false);
    onClose?.();
  };

  const handleClear = () => {
    setTempRange(null);
    onChange({
      startDate: new Date(),
      endDate: new Date(),
      label: 'Custom',
    });
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!tempRange) return false;
    return date >= tempRange.startDate && date <= tempRange.endDate;
  };

  const isDateSelected = (date: Date) => {
    if (!tempRange) return false;
    return (
      format(date, 'yyyy-MM-dd') === format(tempRange.startDate, 'yyyy-MM-dd') ||
      format(date, 'yyyy-MM-dd') === format(tempRange.endDate, 'yyyy-MM-dd')
    );
  };

  const handleDateClick = (date: Date) => {
    if (!tempRange) {
      setTempRange({
        startDate: date,
        endDate: date,
        label: 'Custom',
      });
    } else if (date < tempRange.startDate) {
      setTempRange({
        ...tempRange,
        startDate: date,
      });
    } else {
      setTempRange({
        ...tempRange,
        endDate: date,
      });
    }
  };

  const displayValue = value ? `${format(value.startDate, 'MMM dd')} - ${format(value.endDate, 'MMM dd')}` : 'Select date range';

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-[200px] justify-between"
      >
        <Calendar className="w-4 h-4" />
        <span className="truncate">{displayValue}</span>
        {value && (
          <X
            className="w-4 h-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[600px]">
          <div className="p-4">
            <div className="flex gap-4">
              {/* Preset Ranges */}
              <div className="w-48 border-r border-gray-200 pr-4">
                <h3 className="font-medium text-gray-900 mb-3">Quick Select</h3>
                <div className="space-y-2">
                  {PRESET_RANGES.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-medium text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <div key={index} className="text-center">
                      {date ? (
                        <button
                          onClick={() => handleDateClick(date)}
                          className={`w-8 h-8 text-sm rounded-full transition-colors ${
                            isDateSelected(date)
                              ? 'bg-blue-600 text-white'
                              : isDateInRange(date)
                              ? 'bg-blue-100 text-blue-900'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Selected Range Display */}
                {tempRange && (
                  <div className="text-sm text-gray-600 mb-4">
                    <div>Start: {format(tempRange.startDate, 'MMM dd, yyyy')}</div>
                    <div>End: {format(tempRange.endDate, 'MMM dd, yyyy')}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApply}
                    disabled={!tempRange}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
