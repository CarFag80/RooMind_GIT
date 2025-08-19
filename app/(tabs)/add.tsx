import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Users, Crown, Save, RotateCcw, CircleAlert as AlertCircle, Euro, DollarSign, ChevronDown } from 'lucide-react-native';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateRangePicker from '@/components/DateRangePicker';
import { useFocusEffect } from 'expo-router';
import InfoModal from '@/components/InfoModal';
import TripleRoomIcon from '@/components/TripleRoomIcon';

// Memoized room types to avoid recreation on each render
const ROOM_TYPES = [
  { id: 'single', label: 'Singola', icon: Home, description: 'Camera per 1 persona' },
  { id: 'double', label: 'Doppia', icon: Users, description: 'Camera per 2 persone' },
  { id: 'triple', label: 'Tripla', icon: Users, description: 'Camera per 3 persone' },
  { id: 'suite', label: 'Suite', icon: Crown, description: 'Camera di lusso' },
] as const;

// Currency options
const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro', icon: Euro },
  { code: 'USD', symbol: '$', label: 'Dollaro USA', icon: DollarSign },
  { code: 'GBP', symbol: '£', label: 'Sterlina', icon: DollarSign },
  { code: 'CHF', symbol: 'CHF', label: 'Franco Svizzero', icon: DollarSign },
  { code: 'JPY', symbol: '¥', label: 'Yen Giapponese', icon: DollarSign },
] as const;

export default function AddScreen() {
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState('single');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [pricePerNight, setPricePerNight] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const roomNumberRef = useRef<TextInput>(null);
  
  // Modal states - unified system
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    icon: null as React.ReactNode,
    onClose: () => {}
  });

  const resetForm = useCallback(() => {
    setDescription('');
    setRoomType('single');
    setRoomNumber('');
    setFloor('');
    setHotelName('');
    setHotelAddress('');
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setPricePerNight('');
    setCurrency('EUR');
    
    // Show reset confirmation modal
    setModalContent({
      title: 'Form Resettato',
      message: 'Tutti i campi sono stati cancellati con successo.',
      icon: <RotateCcw size={24} color="#4CAF50" />,
      onClose: () => setModalVisible(false)
    });
    setModalVisible(true);
  }, []);

  const resetFormSilently = useCallback(() => {
    setDescription('');
    setRoomType('single');
    setRoomNumber('');
    setFloor('');
    setHotelName('');
    setHotelAddress('');
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setPricePerNight('');
    setCurrency('EUR');
  }, []);

  const handleSave = useCallback(async () => {
    if (!roomNumber.trim()) {
      setModalContent({
        title: 'Campo Obbligatorio',
        message: 'Il numero della camera è obbligatorio per continuare.',
        icon: <AlertCircle size={24} color="#FF5722" />,
        onClose: () => {
          setModalVisible(false);
          roomNumberRef.current?.focus();
        }
      });
      setModalVisible(true);
      return;
    }

    if (!floor.trim()) {
      setModalContent({
        title: 'Campo Obbligatorio',
        message: 'Il piano è obbligatorio per continuare.',
        icon: <AlertCircle size={24} color="#FF5722" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
      return;
    }

    if (!hotelName.trim()) {
      setModalContent({
        title: 'Campo Obbligatorio',
        message: 'Il nome dell\'albergo è obbligatorio per continuare.',
        icon: <AlertCircle size={24} color="#FF5722" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
      return;
    }

    if (!hotelAddress.trim()) {
      setModalContent({
        title: 'Campo Obbligatorio',
        message: 'L\'indirizzo dell\'albergo è obbligatorio per continuare.',
        icon: <AlertCircle size={24} color="#FF5722" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
      return;
    }

    // Validate dates if both are provided
    if (checkInDate && checkOutDate && checkInDate >= checkOutDate) {
      setModalContent({
        title: 'Date Non Valide',
        message: 'La data di check-out deve essere successiva alla data di check-in.',
        icon: <AlertCircle size={24} color="#FF9800" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      const newRoom: Omit<Room, 'id' | 'createdAt' | 'updatedAt'> = {
        name: roomNumber.trim(),
        description: description.trim() || '',
        roomType: roomType as Room['roomType'],
        roomNumber: roomNumber.trim(),
        floor: floor.trim(),
        hotelName: hotelName.trim(),
        hotelAddress: hotelAddress.trim(),
        checkInDate,
        checkOutDate,
        pricePerNight: pricePerNight ? parseFloat(pricePerNight) : undefined,
        currency: pricePerNight ? currency : undefined,
      };

      await RoomStorage.addRoom(newRoom);
      
      // Show success modal first, then navigate
      setModalContent({
        title: 'Camera Salvata!',
        message: 'La nuova camera è stata aggiunta con successo.',
        icon: <Save size={24} color="#4CAF50" />,
        onClose: () => {
          setModalVisible(false);
          resetFormSilently();
          router.replace('/(tabs)/');
        }
      });
      setModalVisible(true);
      
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      setModalContent({
        title: 'Errore di Salvataggio',
        message: 'Si è verificato un errore durante il salvataggio. Riprova.',
        icon: <AlertCircle size={24} color="#F44336" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [roomNumber, floor, hotelName, hotelAddress, checkInDate, checkOutDate, description, roomType, pricePerNight, currency, resetFormSilently]);

  const handlePriceChange = useCallback((text: string) => {
    const cleanText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setPricePerNight(cleanText);
  }, []);

  const handleCurrencySelect = useCallback((currencyCode: string) => {
    setCurrency(currencyCode);
    setShowCurrencyPicker(false);
  }, []);

  const toggleCurrencyPicker = useCallback(() => {
    setShowCurrencyPicker(prev => !prev);
  }, []);

  const handleRoomTypeSelect = useCallback((typeId: string) => {
    setRoomType(typeId);
  }, []);

  // Focus automatico sul campo numero camera quando si apre la schermata
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        roomNumberRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6750A4', '#7F67BE']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Nuova Camera</Text>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={resetForm}
          activeOpacity={0.7}>
          <RotateCcw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.form} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 100) }
        ]}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numero camera *</Text>
          <TextInput
            ref={roomNumberRef}
            style={styles.textInput}
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="es. 101, A12, Suite Presidenziale"
            placeholderTextColor="#79747E"
            returnKeyType="next"
            maxLength={15}
            onSubmitEditing={() => {
              // Trova il prossimo campo (piano) e fai focus
              // Questo migliorerà l'esperienza utente
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Piano *</Text>
          <TextInput
            style={styles.textInput}
            value={floor}
            onChangeText={setFloor}
            placeholder="es. 1, 2, Piano Terra, Attico"
            placeholderTextColor="#79747E"
            maxLength={12}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome albergo *</Text>
          <TextInput
            style={styles.textInput}
            value={hotelName}
            onChangeText={setHotelName}
            placeholder="es. Hotel Excelsior, Grand Hotel"
            placeholderTextColor="#79747E"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Indirizzo albergo *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={hotelAddress}
            onChangeText={setHotelAddress}
            placeholder="es. Via Roma 123, 00100 Roma RM"
            placeholderTextColor="#79747E"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Date soggiorno</Text>
          <Text style={styles.sectionSubtitle}>
            Opzionale - Aggiungi le date del tuo soggiorno
          </Text>
          
          <DateRangePicker
            startDate={checkInDate}
            endDate={checkOutDate}
            onRangeChange={(start, end) => {
              setCheckInDate(start);
              setCheckOutDate(end);
            }}
            label="Periodo soggiorno"
          />
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Prezzo a notte</Text>
          <Text style={styles.sectionSubtitle}>
            Opzionale - Aggiungi il costo per notte
          </Text>
          
          <View style={styles.priceContainer}>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                value={pricePerNight}
                onChangeText={handlePriceChange}
                placeholder="0.00"
                placeholderTextColor="#79747E"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={toggleCurrencyPicker}
              activeOpacity={0.7}>
              <Text style={styles.currencyText}>
                {CURRENCIES.find(c => c.code === currency)?.symbol || '€'}
              </Text>
              <Text style={styles.currencyCode}>{currency}</Text>
              <ChevronDown size={16} color="#6750A4" />
            </TouchableOpacity>
          </View>
          
          {showCurrencyPicker && (
            <View style={styles.currencyPicker}>
              {CURRENCIES.map((curr) => {
                const IconComponent = curr.icon;
                const isSelected = currency === curr.code;
                
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyOption,
                      isSelected && styles.currencyOptionSelected
                    ]}
                    onPress={() => {
                      handleCurrencySelect(curr.code);
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.currencyOptionLeft}>
                      <IconComponent size={20} color={isSelected ? '#6750A4' : '#625B71'} />
                      <View style={styles.currencyInfo}>
                        <Text style={[
                          styles.currencyLabel,
                          isSelected && styles.currencyLabelSelected
                        ]}>
                          {curr.label}
                        </Text>
                        <Text style={[
                          styles.currencySymbol,
                          isSelected && styles.currencySymbolSelected
                        ]}>
                          {curr.symbol} {curr.code}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Note aggiuntive, caratteristiche particolari, servizi..."
            placeholderTextColor="#79747E"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipologia camera</Text>
          <View style={styles.roomTypesContainer}>
            {ROOM_TYPES.map((type) => {
              const isSelected = roomType === type.id;
              
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.roomTypeOption,
                    isSelected && styles.roomTypeOptionSelected
                  ]}
                  onPress={() => handleRoomTypeSelect(type.id)}
                  activeOpacity={0.7}>
                  <View style={[
                    styles.roomTypeIconContainer,
                    isSelected && styles.roomTypeIconContainerSelected
                  ]}>
                    {type.id === 'triple' ? (
                      <TripleRoomIcon 
                        size={24} 
                        color={isSelected ? '#FFFFFF' : '#6750A4'} 
                      />
                    ) : (
                      React.createElement(type.icon, {
                        size: 24,
                        color: isSelected ? '#FFFFFF' : '#6750A4'
                      })
                    )}
                  </View>
                  <Text style={[
                    styles.roomTypeLabel,
                    isSelected && styles.roomTypeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={[
                    styles.roomTypeDescription,
                    isSelected && styles.roomTypeDescriptionSelected
                  ]}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}>
          <Save size={20} color="#FFFFFF" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvataggio...' : 'Salva Camera'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <InfoModal
        visible={modalVisible}
        onClose={modalContent.onClose}
        title={modalContent.title}
        message={modalContent.message}
        icon={modalContent.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 80,
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flexShrink: 1,
    minWidth: 0,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0,
  },
  form: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C1B1F',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  dateSection: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#79747E',
    marginBottom: 16,
  },
  priceSection: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: '#F7F2FA',
    borderWidth: 1,
    borderColor: '#E8DEF8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    textAlign: 'right',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8DEF8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minWidth: 100,
    justifyContent: 'center',
    gap: 4,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6750A4',
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6750A4',
  },
  currencyPicker: {
    marginTop: 12,
    backgroundColor: '#F7F2FA',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DEF8',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DEF8',
  },
  currencyOptionSelected: {
    backgroundColor: '#E8DEF8',
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1B1F',
    marginBottom: 2,
  },
  currencyLabelSelected: {
    fontWeight: '600',
    color: '#6750A4',
  },
  currencySymbol: {
    fontSize: 14,
    color: '#625B71',
  },
  currencySymbolSelected: {
    color: '#6750A4',
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6750A4',
  },
  roomTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomTypeOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DEF8',
    backgroundColor: '#FFFFFF',
    flex: 1,
    minWidth: 100,
  },
  roomTypeOptionSelected: {
    borderColor: '#6750A4',
    backgroundColor: '#E8DEF8',
  },
  roomTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roomTypeIconContainerSelected: {
    backgroundColor: '#6750A4',
  },
  roomTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#49454F',
    textAlign: 'center',
    marginBottom: 4,
  },
  roomTypeLabelSelected: {
    color: '#6750A4',
    fontWeight: '700',
  },
  roomTypeDescription: {
    fontSize: 12,
    color: '#79747E',
    textAlign: 'center',
  },
  roomTypeDescriptionSelected: {
    color: '#6750A4',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6750A4',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#CAC4D0',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});