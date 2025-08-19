import React, { useState, useEffect, useCallback } from 'react';
import { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Users, Crown, CreditCard as Edit3, Building, Hash, Calendar, ArrowRight, Star } from 'lucide-react-native';
import TripleRoomIcon from '@/components/TripleRoomIcon';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InfoModal from '@/components/InfoModal';
import StarRating from '@/components/StarRating';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

// Memoized components for better performance
const RoomTypeIcon = memo(({ roomType }: { roomType: string }) => {
  switch (roomType) {
    case 'single':
      return <Home size={20} color="#6750A4" />;
    case 'double':
      return <Users size={20} color="#6750A4" />;
    case 'triple':
      return <TripleRoomIcon size={20} color="#6750A4" />;
    case 'suite':
      return <Crown size={20} color="#6750A4" />;
    default:
      return <Home size={20} color="#6750A4" />;
  }
});

const StatsCard = memo(({ number, label }: { number: number; label: string }) => (
  <View style={styles.statsCard}>
    <Text style={styles.statsNumber}>{number}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
));

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);
  const insets = useSafeAreaInsets();
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    icon: null as React.ReactNode,
    onClose: () => {}
  });

  const loadRooms = async () => {
    try {
      const roomsData = await RoomStorage.getRooms();
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Errore nel caricamento delle camere:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [])
  );

  const deleteRoom = useCallback(async (id: string, roomName: string) => {
    console.log('🏠 Richiesta eliminazione camera:', roomName, 'ID:', id);
    
    setModalContent({
      title: 'Conferma Eliminazione',
      message: `Eliminare definitivamente la camera "${roomName}"?\n\nQuesta azione non può essere annullata.`,
      icon: <Edit3 size={24} color="#F44336" />,
      onClose: async () => {
        setModalVisible(false);
        try {
          const success = await RoomStorage.deleteRoom(id);
          
          if (success) {
            await loadRooms();
            setTimeout(() => {
              setModalContent({
                title: 'Camera Eliminata',
                message: 'La camera è stata eliminata con successo.',
                icon: <Edit3 size={24} color="#4CAF50" />,
                onClose: () => setModalVisible(false)
              });
              setModalVisible(true);
            }, 100);
          } else {
            setModalContent({
              title: 'Camera Non Trovata',
              message: 'La camera richiesta non è stata trovata.',
              icon: <Edit3 size={24} color="#FF9800" />,
              onClose: () => setModalVisible(false)
            });
            setModalVisible(true);
          }
        } catch (error) {
          console.error('💥 Errore eliminazione:', error);
          setModalContent({
            title: 'Errore di Eliminazione',
            message: 'Si è verificato un errore durante l\'eliminazione. Riprova.',
            icon: <Edit3 size={24} color="#F44336" />,
            onClose: () => setModalVisible(false)
          });
          setModalVisible(true);
        }
      }
    });
    setModalVisible(true);
  }, [loadRooms]);

  const editRoom = (room: Room) => {
    // Use push instead of navigate for better performance
    router.push({
      pathname: '/edit-room',
      params: { roomId: room.id }
    });
  };

  const getRoomTypeLabel = (roomType: string) => {
    switch (roomType) {
      case 'single':
        return 'Singola';
      case 'double':
        return 'Doppia';
      case 'triple':
        return 'Tripla';
      case 'suite':
        return 'Suite';
      default:
        return 'Standard';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateRange = (room: Room): { checkIn?: Date, checkOut?: Date } => {
    // Handle legacy data migration
    if ('date' in room && room.date) {
      return { checkIn: new Date(room.date) };
    }
    
    return {
      checkIn: room.checkInDate ? new Date(room.checkInDate) : undefined,
      checkOut: room.checkOutDate ? new Date(room.checkOutDate) : undefined
    };
  };

  // Check if checkout date has passed (for rating display)
  const shouldShowRating = (room: Room): boolean => {
    const { checkOut } = getDateRange(room);
    if (!checkOut) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkoutDate = new Date(checkOut);
    checkoutDate.setHours(0, 0, 0, 0);
    
    return checkoutDate < today;
  };

  const getCurrencySymbol = (currencyCode: string) => {
    switch (currencyCode) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'CHF': return 'CHF';
      case 'JPY': return '¥';
      default: return '€';
    }
  };

  // Memoize expensive calculations
  const uniqueHotels = React.useMemo(() => 
    new Set(rooms.map(r => r.hotelName)).size, 
    [rooms]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6750A4', '#7F67BE']}
          style={styles.header}>
          <Text style={styles.headerTitle}>RooMind</Text>
          <Text style={styles.headerSubtitle}>Le tue camere, sempre con te</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6750A4', '#7F67BE']}
        style={styles.header}>
        <Text style={styles.headerTitle}>RooMind</Text>
        <Text style={styles.headerSubtitle}>Le tue camere, sempre con te</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 100) }
        ]}>
        <View style={styles.statsContainer}>
          <StatsCard number={rooms.length} label="Camere Totali" />
          <StatsCard number={uniqueHotels} label="Alberghi" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Le tue camere</Text>
        </View>

        {rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Home size={64} color="#CAC4D0" />
            <Text style={styles.emptyTitle}>Nessuna camera</Text>
            <Text style={styles.emptySubtitle}>
              Aggiungi la tua prima camera per iniziare
            </Text>
          </View>
        ) : (
          <View style={styles.roomsGrid}>
            {rooms.map((room) => {
              const { checkIn, checkOut } = getDateRange(room);
              
              return (
                <View key={room.id} style={styles.roomCard}>
                  <View style={styles.roomHeader}>
                    <View style={styles.roomIconContainer}>
                      <RoomTypeIcon roomType={room.roomType || 'single'} />
                    </View>
                    <View style={styles.roomActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editRoom(room)}
                        activeOpacity={0.7}>
                        <Edit3 size={16} color="#625B71" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.roomMainInfo}>
                    <View style={styles.roomNumberContainer}>
                      <Hash size={18} color="#6750A4" />
                      <Text style={styles.roomNumber} numberOfLines={1} ellipsizeMode="tail">
                        Camera {room.roomNumber}
                      </Text>
                    </View>
                    
                    <View style={styles.floorContainer}>
                      <Building size={18} color="#625B71" />
                      <Text style={styles.floorText} numberOfLines={1} ellipsizeMode="tail">
                        Piano {room.floor}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.hotelInfo}>
                    <Text style={styles.hotelName}>{room.hotelName}</Text>
                    <Text style={styles.hotelAddress} numberOfLines={2}>
                      {room.hotelAddress}
                    </Text>
                  </View>

                  {(checkIn || checkOut) && (
                    <View style={styles.dateInfo}>
                      <View style={styles.dateContent}>
                        {checkIn && checkOut ? (
                          <View style={styles.dateRange}>
                            <Text style={styles.dateText}>{formatDate(checkIn)}</Text>
                            <ArrowRight size={12} color="#6750A4" />
                            <Text style={styles.dateText}>{formatDate(checkOut)}</Text>
                          </View>
                        ) : checkIn ? (
                          <Text style={styles.dateText}>Check-in: {formatDate(checkIn)}</Text>
                        ) : checkOut ? (
                          <Text style={styles.dateText}>Check-out: {formatDate(checkOut)}</Text>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {room.pricePerNight && room.currency && (
                    <View style={styles.priceInfo}>
                      <Text style={styles.priceLabel}>Prezzo per notte</Text>
                      <Text style={styles.priceAmount}>
                        {room.pricePerNight.toFixed(2)} {getCurrencySymbol(room.currency)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.bottomRow}>
                    <View style={styles.roomTypeTag}>
                      <Text style={styles.roomTypeText}>
                        {getRoomTypeLabel(room.roomType || 'single')}
                      </Text>
                    </View>
                    
                    {shouldShowRating(room) && (
                      <View style={styles.ratingContainer}>
                        <StarRating
                          rating={room.rating || 0}
                          readonly={true}
                          size={14}
                          color="#FFD700"
                          emptyColor="#E0E0E0"
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      <InfoModal
        visible={modalVisible}
        onClose={modalContent.onClose}
        title={modalContent.title}
        message={modalContent.message}
        icon={modalContent.icon}
      />
      
      {showPWAPrompt && (
        <PWAInstallPrompt
          onInstall={() => setShowPWAPrompt(false)}
          onDismiss={() => setShowPWAPrompt(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7FF',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 100,
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E8DEF8',
    opacity: 0.9,
    flexShrink: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#49454F',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#625B71',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1B1F',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#49454F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#79747E',
    textAlign: 'center',
  },
  roomsGrid: {
    gap: 16,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2FA',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  roomMainInfo: {
    marginBottom: 16,
  },
  roomNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1F',
    marginLeft: 8,
  },
  floorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floorText: {
    fontSize: 16,
    color: '#625B71',
    marginLeft: 8,
    fontWeight: '500',
  },
  hotelInfo: {
    backgroundColor: '#F7F2FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6750A4',
    marginBottom: 6,
  },
  hotelAddress: {
    fontSize: 14,
    color: '#625B71',
    lineHeight: 20,
  },
  dateInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dateContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B5E20',
    textAlign: 'center',
  },
  arrowIcon: {
    marginHorizontal: 6,
  },
  roomTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8DEF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roomTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6750A4',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  priceInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
  },
});