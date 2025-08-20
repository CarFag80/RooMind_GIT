import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Users, Crown, Save, ArrowLeft, CircleAlert as AlertCircle, Star, Euro, DollarSign } from 'lucide-react-native';
import { ChevronDown } from 'lucide-react-native';
import TripleRoomIcon from '@/components/TripleRoomIcon';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateRangePicker from '@/components/DateRangePicker';
import InfoModal from '@/components/InfoModal';
import StarRating from '@/components/StarRating';
import { notificationService } from '@/services/notificationService';

export default function EditRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
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
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    icon: React.ReactNode;
    onClose: () => void;
  }>({
    title: '',
    message: '',
    icon: null as React.ReactNode,
    onClose: () => {}
  });
  const insets = useSafeAreaInsets();
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Currency options
  const CURRENCIES = React.useMemo(() => [
    { code: 'EUR', symbol: '€', label: 'Euro', icon: Euro },
    { code: 'USD', symbol: '$', label: 'Dollaro USA', icon: DollarSign },
    { code: 'GBP', symbol: '£', label: 'Sterlina', icon: DollarSign },
    { code: 'CHF', symbol: 'CHF', label: 'Franco Svizzero', icon: DollarSign },
    { code: 'JPY', symbol: '¥', label: 'Yen Giapponese', icon: DollarSign },
  ], []);

  const roomTypes = React.useMemo(() => [
    { id: 'single', label: 'Singola', icon: Home, description: 'Camera per 1 persona' },
    { id: 'double', label: 'Doppia', icon: Users, description: 'Camera per 2 persone' },
    { id: 'triple', label: 'Tripla', icon: Users, description: 'Camera per 3 persone' },
    { id: 'suite', label: 'Suite', icon: Crown, description: 'Camera di lusso' },
  ], []);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = React.useCallback(async () => {
    if (!roomId) return;
    
    try {
      const rooms = await RoomStorage.getRooms();
      const foundRoom = rooms.find(r => r.id === roomId);
      
      if (foundRoom) {
        setRoom(foundRoom);
        setDescription(foundRoom.description);
        if ('category' in foundRoom) {
          setRoomType('single');
        } else {
          setRoomType(foundRoom.roomType);
        }
        setRoomNumber(foundRoom.roomNumber);
        setFloor(foundRoom.floor);
        setHotelName(foundRoom.hotelName);
        setHotelAddress(foundRoom.hotelAddress);
        setRating(foundRoom.rating || 0);
        
        // Load price and currency
        if (foundRoom.pricePerNight) {
          setPricePerNight(foundRoom.pricePerNight.toString());
        }
        if (foundRoom.currency) {
          setCurrency(foundRoom.currency);
        }
        
        // Handle legacy data migration and new structure
        if ('date' in foundRoom && foundRoom.date) {
          // Legacy single date - use as check-in
          setCheckInDate(new Date(foundRoom.date));
        } else {
          // New structure with separate dates
          if (foundRoom.checkInDate) {
            setCheckInDate(new Date(foundRoom.checkInDate));
          }
          if (foundRoom.checkOutDate) {
            setCheckOutDate(new Date(foundRoom.checkOutDate));
          }
        }
      } else {
        setModalContent({
          title: 'Camera Non Trovata',
          message: 'La camera richiesta non è stata trovata nel database.',
          icon: <AlertCircle size={24} color="#FF5722" />,
          onClose: () => {
            setModalVisible(false);
            router.back();
          }
        });
        setModalVisible(true);
        router.back();
      }
    } catch (error) {
      console.error('Errore nel caricamento della camera:', error);
      setModalContent({
        title: 'Errore di Caricamento',
        message: 'Impossibile caricare i dati della camera. Riprova.',
        icon: <AlertCircle size={24} color="#F44336" />,
        onClose: () => {
          setModalVisible(false);
          router.back();
        }
      });
      setModalVisible(true);
      router.back();
    }
  }, [roomId]);

  const validateForm = React.useCallback(() => {
    const errors: {[key: string]: boolean} = {};
    const missingFields: string[] = [];
    
    if (!roomNumber.trim()) {
      errors.roomNumber = true;
      missingFields.push('Numero camera');
    }
    
    if (!floor.trim()) {
      errors.floor = true;
      missingFields.push('Piano');
    }
    
    if (!hotelName.trim()) {
      errors.hotelName = true;
      missingFields.push('Nome albergo');
    }
    
    if (!hotelAddress.trim()) {
      errors.hotelAddress = true;
      missingFields.push('Indirizzo albergo');
    }
    
    setValidationErrors(errors);
    
    if (missingFields.length > 0) {
      const message = `Per salvare le modifiche, compila i seguenti campi obbligatori:\n\n${missingFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}`;
      setValidationMessage(message);
      return false;
    }
    
    return true;
  }, [roomNumber, floor, hotelName, hotelAddress]);

  const handleSave = React.useCallback(async () => {
    if (!room) return;

    // Validate form
    if (!validateForm()) {
      setShowValidationModal(true);
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
      console.log('💾 INIZIO SALVATAGGIO MODIFICHE');
      console.log('💰 Prezzo input:', pricePerNight);
      console.log('💱 Valuta input:', currency);
      
      // Prepare updates object with explicit field handling
      const updates: Partial<Omit<Room, 'id' | 'createdAt'>> = {
        name: roomNumber.trim(),
        description: description.trim() || '',
        roomType: roomType as Room['roomType'],
        roomNumber: roomNumber.trim(),
        floor: floor.trim(),
        hotelName: hotelName.trim(),
        hotelAddress: hotelAddress.trim(),
        checkInDate,
        checkOutDate,
        rating: rating > 0 ? rating : undefined,
      };
      
      // Handle price and currency explicitly
      const trimmedPrice = pricePerNight?.trim();
      console.log('💰 Prezzo trimmed:', trimmedPrice);
      
      if (trimmedPrice && !isNaN(parseFloat(trimmedPrice))) {
        updates.pricePerNight = parseFloat(trimmedPrice);
        updates.currency = currency;
        console.log('✅ Prezzo valido:', updates.pricePerNight, updates.currency);
      } else {
        // If price is empty or invalid, remove both price and currency
        updates.pricePerNight = undefined;
        updates.currency = undefined;
        console.log('❌ Prezzo rimosso');
      }
      
      console.log('📝 Updates finali:', updates);

      const updatedRoom = await RoomStorage.updateRoom(room.id, updates);
      console.log('✅ Room aggiornata:', updatedRoom);
      
      // Update notifications for the room
      if (updatedRoom) {
        try {
          await notificationService.removeNotificationsForRoom(updatedRoom.id);
          await notificationService.scheduleNotificationsForRoom(updatedRoom);
        } catch (error) {
          console.error('Failed to update notifications:', error);
        }
      }
      
      setModalContent({
        title: 'Modifiche Salvate!',
        message: 'La camera è stata aggiornata con successo.',
        icon: <Save size={24} color="#4CAF50" />,
        onClose: () => {
          setModalVisible(false);
          router.replace('/(tabs)/');
        }
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      setModalContent({
        title: 'Errore di Aggiornamento',
        message: 'Si è verificato un errore durante l\'aggiornamento. Riprova.',
        icon: <AlertCircle size={24} color="#F44336" />,
        onClose: () => setModalVisible(false)
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [room, validateForm, checkInDate, checkOutDate, description, roomType, roomNumber, floor, hotelName, hotelAddress, rating, pricePerNight, currency]);

  const getFieldStyle = React.useCallback((fieldName: string) => {
    const hasError = validationErrors[fieldName];
    
    return [
      styles.textInput,
      hasError && {
        borderColor: '#FF5252',
        borderWidth: 2,
        backgroundColor: '#FFEBEE',
      }
    ];
  }, [validationErrors]);

  const handleRoomTypeSelect = React.useCallback((typeId: string) => {
    setRoomType(typeId);
  }, []);

  const handlePriceChange = React.useCallback((text: string) => {
    const cleanText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setPricePerNight(cleanText);
  }, []);

  const handleCurrencySelect = React.useCallback((currencyCode: string) => {
    setCurrency(currencyCode);
    setShowCurrencyPicker(false);
  }, []);

  const toggleCurrencyPicker = React.useCallback(() => {
    setShowCurrencyPicker(prev => !prev);
  }, []);

  if (!room) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6750A4', '#7F67BE']}
          style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Caricamento...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6750A4', '#7F67BE']}
        style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifica Camera</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.form} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 100) }
        ]}>
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Numero camera *</Text>
            {validationErrors.roomNumber && (
              <View style={styles.errorIndicator}>
                <AlertCircle size={16} color="#FF5252" />
                <Text style={styles.errorText}>Campo obbligatorio</Text>
              </View>
            )}
          </View>
          <TextInput
            style={getFieldStyle('roomNumber')}
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="es. 101, A12, Suite Presidenziale"
            placeholderTextColor="#79747E"
            maxLength={15}
            onFocus={() => {
              if (validationErrors.roomNumber) {
                setValidationErrors(prev => ({ ...prev, roomNumber: false }));
              }
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Piano *</Text>
            {validationErrors.floor && (
              <View style={styles.errorIndicator}>
                <AlertCircle size={16} color="#FF5252" />
                <Text style={styles.errorText}>Campo obbligatorio</Text>
              </View>
            )}
          </View>
          <TextInput
            style={getFieldStyle('floor')}
            value={floor}
            onChangeText={setFloor}
            placeholder="es. 1, 2, Piano Terra, Attico"
            placeholderTextColor="#79747E"
            maxLength={12}
            onFocus={() => {
              if (validationErrors.floor) {
                setValidationErrors(prev => ({ ...prev, floor: false }));
              }
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Nome albergo *</Text>
            {validationErrors.hotelName && (
              <View style={styles.errorIndicator}>
                <AlertCircle size={16} color="#FF5252" />
                <Text style={styles.errorText}>Campo obbligatorio</Text>
              </View>
            )}
          </View>
          <TextInput
            style={getFieldStyle('hotelName')}
            value={hotelName}
            onChangeText={setHotelName}
            placeholder="es. Hotel Excelsior, Grand Hotel"
            placeholderTextColor="#79747E"
            onFocus={() => {
              if (validationErrors.hotelName) {
                setValidationErrors(prev => ({ ...prev, hotelName: false }));
              }
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Indirizzo albergo *</Text>
            {validationErrors.hotelAddress && (
              <View style={styles.errorIndicator}>
                <AlertCircle size={16} color="#FF5252" />
                <Text style={styles.errorText}>Campo obbligatorio</Text>
              </View>
            )}
          </View>
          <TextInput
            style={[getFieldStyle('hotelAddress'), styles.textArea]}
            value={hotelAddress}
            onChangeText={setHotelAddress}
            placeholder="es. Via Roma 123, 00100 Roma RM"
            placeholderTextColor="#79747E"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => {
              if (validationErrors.hotelAddress) {
                setValidationErrors(prev => ({ ...prev, hotelAddress: false }));
              }
            }}
          />
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Date soggiorno</Text>
          <Text style={styles.sectionSubtitle}>
            Opzionale - Modifica le date del soggiorno
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

        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Prezzo a notte</Text>
          <Text style={styles.sectionSubtitle}>
            Opzionale - Modifica il costo per notte
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
          <Text style={styles.label}>Tipologia camera</Text>
          <View style={styles.roomTypesContainer}>
            {roomTypes.map((type) => {
              const isSelected = roomType === type.id;
              
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.roomTypeOption,
                    isSelected && styles.roomTypeOptionSelected
                  ]}
                  onPress={() => handleRoomTypeSelect(type.id)}>
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

        {/* Rating Section - Show if checkout date has passed */}
        {(() => {
          if (!checkOutDate) return null;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const checkoutDate = new Date(checkOutDate);
          checkoutDate.setHours(0, 0, 0, 0);
          
          const shouldShowRating = checkoutDate < today;
          
          if (!shouldShowRating) return null;
          
          return (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Valutazione soggiorno</Text>
              <Text style={styles.sectionSubtitle}>
                Come valuti questa camera? (opzionale)
              </Text>
              
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size={32}
                  color="#FFD700"
                  emptyColor="#E0E0E0"
                />
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating} su 5 stelle
                  </Text>
                )}
              </View>
            </View>
          );
        })()}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          <Save size={20} color="#FFFFFF" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <InfoModal
        visible={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Campi Obbligatori Mancanti"
        message={validationMessage}
        icon={<AlertCircle size={24} color="#FF5252" />}
      />
      
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
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 80,
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flexShrink: 1,
    minWidth: 0,
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
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: '500',
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
  ratingSection: {
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
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6750A4',
    marginTop: 12,
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
});