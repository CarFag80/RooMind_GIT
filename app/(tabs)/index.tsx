import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, Users, Crown, CreditCard as Edit3, Building, Hash, ArrowRight } from 'lucide-react-native';
import TripleRoomIcon from '@/components/TripleRoomIcon';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InfoModal from '@/components/InfoModal';
import StarRating from '@/components/StarRating';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import NotificationCenter from '@/components/NotificationCenter';
import { notificationService } from '@/services/notificationService';

// Memoized components for better performance
const RoomTypeIcon = React.memo(({ roomType }: { roomType: string }) => {
  const iconProps = { size: 20, color: "#6750A4" };
  
  switch (roomType) {
    case 'single':
      return <Home {...iconProps} />;
    case 'double':
      return <Users {...iconProps} />;
    case 'triple':
      return <TripleRoomIcon {...iconProps} />;
    case 'suite':
      return <Crown {...iconProps} />;
    default:
      return <Home {...iconProps} />;
  }
});

const StatsCard = React.memo(({ number, label }: { number: number; label: string }) => (
  <View style={styles.statsCard}>
    <Text style={styles.statsNumber}>{number}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
));

// Memoized room card component
const RoomCard = React.memo(({ 
  room, 
  onEdit 
}: { 
  room: Room; 
  onEdit: (room: Room) => void;
}) => {
  const { checkIn, checkOut } = useMemo(() => getDateRange(room), [room]);
  const shouldShowRating = useMemo(() => checkShouldShowRating(room), [room]);
  
  const handleEdit = useCallback(() => {
    onEdit(room);
  }, [room, onEdit]);

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomIconContainer}>
          <RoomTypeIcon roomType={room.roomType || 'single'} />
        </View>
        <View style={styles.roomActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
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
        
        {shouldShowRating && (
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
});

// Utility functions moved outside component for better performance
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

const checkShouldShowRating = (room: Room): boolean => {
  const { checkOut } = getDateRange(room);
  if (!checkOut) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkoutDate = new Date(checkOut);
  checkoutDate.setHours(0, 0, 0, 0);
  
  return checkoutDate < today;
};

const getRoomTypeLabel = (roomType: string) => {
  const labels = {
    single: 'Singola',
    double: 'Doppia',
    triple: 'Tripla',
    suite: 'Suite'
  };
  return labels[roomType as keyof typeof labels] || 'Standard';
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getCurrencySymbol = (currencyCode: string) => {
  const symbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF',
    JPY: '¥'
  };
  return symbols[currencyCode as keyof typeof symbols] || '€';
};

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ 
    title: '', 
    message: '', 
    icon: null as React.ReactNode,
    onClose: () => setModalVisible(false)
  });

  // Memoized calculations for better performance
  const uniqueHotels = useMemo(() => 
    new Set(rooms.map(r => r.hotelName)).size, 
    [rooms]
  );

  const loadRooms = useCallback(async () => {
    try {
      const roomsData = await RoomStorage.getRooms();
      setRooms(roomsData || []);
      
      // Schedule notifications for all rooms
      if (roomsData && roomsData.length > 0) {
        await notificationService.rescheduleAllNotifications(roomsData);
      }
      
      // Update unread count
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, [loadRooms]);

  const editRoom = useCallback((room: Room) => {
    router.push({
      pathname: '/edit-room',
      params: { roomId: room.id }
    });
  }, []);

  const handlePWAInstall = useCallback(() => {
    setShowPWAPrompt(false);
  }, []);

  const handlePWADismiss = useCallback(() => {
    setShowPWAPrompt(false);
  }, []);

  const handleNotificationPress = useCallback(() => {
    setShowNotifications(true);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setShowNotifications(false);
    // Update unread count when closing
    setUnreadCount(notificationService.getUnreadCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>RooMind</Text>
            <Text style={styles.headerSubtitle}>Le tue camere, sempre con te</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}>
            <Bell size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={editRoom}
              />
            ))}
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
          onInstall={handlePWAInstall}
          onDismiss={handlePWADismiss}
        />
      )}
      
      <NotificationCenter
        visible={showNotifications}
        onClose={handleNotificationClose}
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
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: 100,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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