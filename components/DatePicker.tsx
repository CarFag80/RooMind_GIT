import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Modal } from 'react-native';
import { Calendar } from 'lucide-react-native';
import * as Localization from 'expo-localization';
import ModernCalendar from './Calendar';

interface DatePickerProps {
  label: string;
  date?: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  placeholder?: string;
  mode?: 'single';
}

export default function DatePicker({ 
  label, 
  date, 
  onDateChange, 
  minimumDate,
  placeholder = "Seleziona data",
  mode = 'single'
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Update input value when date prop changes
  useEffect(() => {
    if (date) {
      setInputValue(formatDateForInput(date));
    } else {
      setInputValue('');
    }
  }, [date]);
  
  const getSystemLanguage = React.useCallback(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator?.language || navigator?.languages?.[0] || 'en-US';
    } else {
      return Localization.locale || 'en-US';
    }
  }, []);
  
  const isItalianLocale = React.useCallback(() => {
    const language = getSystemLanguage().toLowerCase();
    return language.startsWith('it');
  }, [getSystemLanguage]);

  const formatDate = React.useCallback((date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatDateForInput = React.useCallback((date: Date) => {
    if (isItalianLocale()) {
      // Italian format DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } else {
      // International format YYYY-MM-DD for HTML input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }, [isItalianLocale]);

  const parseInputDate = React.useCallback((dateString: string) => {
    if (!dateString) return null;
    
    if (isItalianLocale()) {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = dateString.match(dateRegex);
      
      if (!match) {
        console.warn('Invalid Italian date format:', dateString);
        return null;
      }
      
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (date.getDate() !== parseInt(day) || 
          date.getMonth() !== parseInt(month) - 1 || 
          date.getFullYear() !== parseInt(year)) {
        console.warn('Invalid date values:', dateString);
        return null;
      }
      
      return date;
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        console.warn('Invalid international date format:', dateString);
        return null;
      }
      
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return null;
      }
      
      return date;
    }
  }, [isItalianLocale]);

  const getMinimumDateString = React.useCallback(() => {
    if (!minimumDate) return undefined;
    
    if (isItalianLocale()) {
      return formatDateForInput(minimumDate);
    } else {
      const year = minimumDate.getFullYear();
      const month = String(minimumDate.getMonth() + 1).padStart(2, '0');
      const day = String(minimumDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }, [minimumDate, isItalianLocale]);

  const handleDateChange = React.useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  }, [onDateChange]);

  const openPicker = React.useCallback(() => {
    setShowCalendar(true);
  }, []);

  const handleCalendarSelect = React.useCallback((selectedDate: Date) => {
    onDateChange(selectedDate);
    setShowCalendar(false);
  }, [onDateChange]);

  const getPlaceholder = React.useCallback(() => {
    if (isItalianLocale()) {
      return "DD/MM/YYYY";
    } else {
      return "YYYY-MM-DD";
    }
  }, [isItalianLocale]);

  const getInputType = React.useCallback(() => {
    return isItalianLocale() ? "text" : "date";
  }, [isItalianLocale]);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={openPicker}
          activeOpacity={0.7}>
          <Calendar size={20} color="#6750A4" />
          <Text style={[
            styles.dateText,
            !date && styles.placeholderText
          ]}>
            {date ? formatDate(date) : placeholder}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ModernCalendar
              selectedDate={date}
              onDateSelect={handleCalendarSelect}
              minimumDate={minimumDate}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  dateText: {
    fontSize: 16,
    color: '#1C1B1F',
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: '#79747E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    maxWidth: 400,
    width: '100%',
    maxHeight: '85%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
    height: 70,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1F',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#625B71',
    fontWeight: '600',
  },
});