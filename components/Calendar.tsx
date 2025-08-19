import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Ensure proper date handling
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
};

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  highlightedDates?: Date[];
  mode?: 'single' | 'range';
  startDate?: Date;
  endDate?: Date;
  onRangeSelect?: (startDate: Date, endDate?: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  minimumDate,
  maximumDate,
  highlightedDates = [],
  mode = 'single',
  startDate,
  endDate,
  onRangeSelect
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate || startDate || new Date();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Memoized calendar data for performance
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday (1) instead of Sunday (0)
    const startDateCalc = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    startDateCalc.setDate(firstDay.getDate() - dayOfWeek);
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDateCalc);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      
      let isSelected = false;
      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      
      if (mode === 'single') {
        isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
      } else if (mode === 'range') {
        const safeStartDate = startDate ? ensureDate(startDate) : null;
        const safeEndDate = endDate ? ensureDate(endDate) : null;
        
        isRangeStart = safeStartDate ? date.getTime() === safeStartDate.getTime() : false;
        isRangeEnd = safeEndDate ? date.getTime() === safeEndDate.getTime() : false;
        isSelected = isRangeStart || isRangeEnd;
        
        if (safeStartDate && safeEndDate) {
          const startTime = safeStartDate.getTime();
          const endTime = safeEndDate.getTime();
          const dateTime = date.getTime();
          isInRange = dateTime > startTime && dateTime < endTime;
        }
      }
      
      const isDisabled = 
        (minimumDate && date < minimumDate) ||
        (maximumDate && date > maximumDate);
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd,
        isDisabled
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, selectedDate, startDate, endDate, minimumDate, maximumDate, mode]);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDatePress = (day: CalendarDay) => {
    if (day.isDisabled) return;
    
    if (mode === 'single') {
      onDateSelect(day.date);
    } else if (mode === 'range' && onRangeSelect) {
      if (!startDate) {
        // First selection - set start date
        onRangeSelect(day.date, undefined);
      } else if (!endDate) {
        // Second selection - set end date or reset if same date
        if (day.date.getTime() === startDate.getTime()) {
          // Clicking same date - reset selection
          onRangeSelect(day.date, undefined);
        } else if (day.date > startDate) {
          // Valid end date
          onRangeSelect(startDate, day.date);
        } else {
          // Earlier date - reset to new start
          onRangeSelect(day.date, undefined);
        }
      } else {
        // Both dates selected - start new selection
        onRangeSelect(day.date, undefined);
      }
    }
  };

  const getDayStyle = (day: CalendarDay) => {
    const styles = [dayStyles.day];
    
    if (!day.isCurrentMonth) {
      styles.push(dayStyles.dayOtherMonth);
    }
    
    if (day.isDisabled) {
      styles.push(dayStyles.dayDisabled);
    } else if (day.isRangeStart || day.isRangeEnd) {
      styles.push(dayStyles.dayRangeEnd);
    } else if (day.isSelected) {
      styles.push(dayStyles.daySelected);
    } else if (day.isInRange) {
      styles.push(dayStyles.dayInRange);
    } else if (day.isToday) {
      styles.push(dayStyles.dayToday);
    }
    
    return styles;
  };

  const getDayTextStyle = (day: CalendarDay) => {
    const styles = [dayStyles.dayText];
    
    if (!day.isCurrentMonth) {
      styles.push(dayStyles.dayTextOtherMonth);
    }
    
    if (day.isDisabled) {
      styles.push(dayStyles.dayTextDisabled);
    } else if (day.isSelected || day.isRangeStart || day.isRangeEnd) {
      styles.push(dayStyles.dayTextSelected);
    } else if (day.isInRange) {
      styles.push(dayStyles.dayTextInRange);
    } else if (day.isToday) {
      styles.push(dayStyles.dayTextToday);
    }
    
    return styles;
  };

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}>
          <ChevronLeft size={20} color="#6750A4" />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}>
          <ChevronRight size={20} color="#6750A4" />
        </TouchableOpacity>
      </View>

      {/* Day names header */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((dayName) => (
          <View key={dayName} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarData.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={getDayStyle(day)}
            onPress={() => handleDatePress(day)}
            disabled={day.isDisabled}
            activeOpacity={0.7}>
            <Text style={getDayTextStyle(day)}>
              {day.date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Range info */}
      {mode === 'range' && (startDate || endDate) && (
        <View style={styles.rangeInfo}>
          {startDate && (
            <Text style={styles.rangeText}>
              Check-in: {startDate.toLocaleDateString('it-IT')}
            </Text>
          )}
          {endDate && (
            <Text style={styles.rangeText}>
              Check-out: {endDate.toLocaleDateString('it-IT')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 350,
    maxHeight: 450,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    height: 40,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1F',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    height: 30,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#625B71',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 240,
    height: 240,
  },
  rangeInfo: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    minHeight: 45,
    flexShrink: 0,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1B5E20',
    marginBottom: 2,
    lineHeight: 18,
  },
});

const dayStyles = StyleSheet.create({
  day: {
    width: '14.28571%', // 100% / 7 days
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayOtherMonth: {
    opacity: 0.3,
  },
  dayToday: {
    backgroundColor: '#E8DEF8',
    borderRadius: 6,
  },
  daySelected: {
    backgroundColor: '#6750A4',
    borderRadius: 6,
  },
  dayRangeEnd: {
    backgroundColor: '#6750A4',
    borderRadius: 6,
  },
  dayInRange: {
    backgroundColor: '#E8DEF8',
    borderRadius: 4,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1B1F',
  },
  dayTextOtherMonth: {
    color: '#79747E',
  },
  dayTextToday: {
    color: '#6750A4',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextInRange: {
    color: '#6750A4',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: '#CAC4D0',
  },
});