import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Calendar, ArrowRight } from 'lucide-react-native';
import ModernCalendar from './Calendar';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (startDate?: Date, endDate?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  minimumDate,
  maximumDate,
  label = "Seleziona periodo"
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDate = React.useCallback((date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const handleRangeSelect = React.useCallback((start: Date, end?: Date) => {
    onRangeChange(start, end);
    // Don't auto-close, let user confirm
  }, [onRangeChange]);

  const clearDates = React.useCallback(() => {
    onRangeChange(undefined, undefined);
  }, [onRangeChange]);

  const getDisplayText = React.useCallback(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `${formatDate(startDate)} - Seleziona fine`;
    } else {
      return "Seleziona date soggiorno";
    }
  }, [startDate, endDate, formatDate]);

  const openCalendar = React.useCallback(() => {
    setShowCalendar(true);
  }, []);

  const closeCalendar = React.useCallback(() => {
    setShowCalendar(false);
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={openCalendar}
          activeOpacity={0.7}>
          <Calendar size={20} color="#6750A4" />
          <Text style={[
            styles.dateText,
            !startDate && styles.placeholderText
          ]}>
            {getDisplayText()}
          </Text>
        </TouchableOpacity>

        {(startDate || endDate) && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearDates}
            activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>Cancella date</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={closeCalendar}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona periodo soggiorno</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeCalendar}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarContainer}>
              <ModernCalendar
                mode="range"
                startDate={startDate}
                endDate={endDate}
                onRangeSelect={handleRangeSelect}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={clearDates}>
                <Text style={styles.footerButtonText}>Cancella</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonPrimary]}
                onPress={closeCalendar}>
                <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>
                  Conferma
                </Text>
              </TouchableOpacity>
            </View>
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
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '500',
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
    maxWidth: 400,
    width: '100%',
    maxHeight: '90%',
    minHeight: 300,
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
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#625B71',
    fontWeight: '600',
  },
  calendarContainer: {
    padding: 16,
    flex: 1,
    minHeight: 400,
    maxHeight: 450,
  },
  selectionStatus: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6750A4',
  },
  statusText: {
    fontSize: 14,
    color: '#1C1B1F',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 20,
    gap: 12,
    flexShrink: 0,
    minHeight: 70,
    alignItems: 'center',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  footerButtonPrimary: {
    backgroundColor: '#6750A4',
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6750A4',
    textAlign: 'center',
  },
  footerButtonTextPrimary: {
    color: '#FFFFFF',
  },
});