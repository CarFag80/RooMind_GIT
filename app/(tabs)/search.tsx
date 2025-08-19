import React, { useState, useEffect } from 'react';
import { useMemo, memo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search as SearchIcon, Chrome as Home, Users, Crown, Building, Hash, Calendar, ArrowRight } from 'lucide-react-native';
import TripleRoomIcon from '@/components/TripleRoomIcon';
import { RoomStorage } from '@/services/storage';
import { Room } from '@/types/room';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

// Memoized search function for better performance
const useFilteredRooms = (rooms: Room[], searchQuery: string, selectedRoomType: string | null) => {
  return useMemo(() => {
    let filtered = rooms;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(query) ||
        room.description.toLowerCase().includes(query) ||
        room.roomNumber.toLowerCase().includes(query) ||
        room.hotelName.toLowerCase().includes(query) ||
        room.hotelAddress.toLowerCase().includes(query) ||
        room.floor.toLowerCase().includes(query)
      );
    }

    if (selectedRoomType) {
      filtered = filtered.filter(room => (room.roomType || 'single') === selectedRoomType);
    }

    return filtered;
  }, [rooms, searchQuery, selectedRoomType]);
};

// Memoized room item component
const RoomItem = memo(({ room }: { room: Room }) => {
  const { checkIn, checkOut } = getDateRange(room);
  
  return (
    <View style={styles.roomItem}>
      <View style={styles.roomIconContainer}>
        {getRoomTypeIcon(room.roomType || 'single')}
      </View>
      
      <View style={styles.roomInfo}>
        <View style={styles.roomMainInfo}>
          <View style={styles.roomNumberContainer}>
            <Hash size={16} color="#6750A4" />
            <Text style={styles.roomNumber} numberOfLines={1} ellipsizeMode="tail">
              Camera {room.roomNumber}
            </Text>
          </View>
          
          <View style={styles.floorContainer}>
            <Building size={16} color="#625B71" />
            <Text style={styles.floorText} numberOfLines={1} ellipsizeMode="tail">
              Piano {room.floor}
            </Text>
          </View>
        </View>

        <View style={styles.hotelInfo}>
          <Text style={styles.hotelName}>{room.hotelName}</Text>
          <Text style={styles.hotelAddress} numberOfLines={1}>
            {room.hotelAddress}
          </Text>
        </View>

        {(checkIn || checkOut) && (
          <View style={styles.dateInfo}>
            <Calendar size={14} color="#6750A4" />
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

        <View style={styles.roomTypeTag}>
          <Text style={styles.roomTypeText}>
            {getRoomTypeLabel(room.roomType || 'single')}
          </Text>
        </View>
      </View>
    </View>
  );
});

// Helper functions moved outside component
const getRoomTypeIcon = (roomType: string) => {
  switch (roomType) {
    case 'single':
      return <Home size={20} color="#6750A4" />;
    case 'double':
      return <Users size={20} color="#6750A4" />;
    case 'triple':
      return <Users size={20} color="#6750A4" />;
    case 'suite':
      return <Crown size={20} color="#6750A4" />;
    default:
      return <Home size={20} color="#6750A4" />;
  }
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

export default function SearchScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Use memoized filtering
  const filteredRooms = useFilteredRooms(rooms, searchQuery, selectedRoomType);

  useFocusEffect(
    React.useCallback(() => {
      loadRooms();
    }, [])
  );

  const loadRooms = React.useCallback(async () => {
    try {
      const roomsData = await RoomStorage.getRooms();
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Errore nel caricamento delle camere:', error);
      setRooms([]);
    }
  }, []);

  const roomTypes = React.useMemo(() => [
    { id: 'single', label: 'Singola', icon: Home },
    { id: 'double', label: 'Doppia', icon: Users },
    { id: 'triple', label: 'Tripla', icon: Users },
    { id: 'suite', label: 'Suite', icon: Crown },
  ], []);

  const handleRoomTypeSelect = React.useCallback((roomTypeId: string | null) => {
    setSelectedRoomType(current => current === roomTypeId ? null : roomTypeId);
  }, []);

  const handleSearchChange = React.useCallback((text: string) => {
    setSearchQuery(text);
  }, []);
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6750A4', '#7F67BE']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Cerca Camere</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color="#79747E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per nome, numero, albergo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#79747E"
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Tipologie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomTypesScroll}>
          <TouchableOpacity
            style={[
              styles.roomTypeChip,
              selectedRoomType === null && styles.roomTypeChipActive
            ]}
            onPress={() => setSelectedRoomType(null)}>
            <Text style={[
              styles.roomTypeChipText,
              selectedRoomType === null && styles.roomTypeChipTextActive
            ]}>
              Tutte
            </Text>
          </TouchableOpacity>
          
          {roomTypes.map((roomType) => {
            const isActive = selectedRoomType === roomType.id;
            
            return (
              <TouchableOpacity
                key={roomType.id}
                style={[
                  styles.roomTypeChip,
                  isActive && styles.roomTypeChipActive
                ]}
                onPress={() => setSelectedRoomType(isActive ? null : roomType.id)}>
                {roomType.id === 'triple' ? (
                  <TripleRoomIcon 
                    size={16} 
                    color={isActive ? '#FFFFFF' : '#6750A4'} 
                  />
                ) : (
                  React.createElement(roomType.icon, {
                    size: 16,
                    color: isActive ? '#FFFFFF' : '#6750A4',
                    style: styles.roomTypeIcon
                  })
                )}
                <Text style={[
                  styles.roomTypeChipText,
                  isActive && styles.roomTypeChipTextActive
                ]}>
                  {roomType.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.results} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 100) }
        ]}>
        <Text style={styles.resultsCount}>
          {filteredRooms.length} risultat{filteredRooms.length !== 1 ? 'i' : 'o'}
        </Text>

        {filteredRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <SearchIcon size={64} color="#CAC4D0" />
            <Text style={styles.emptyTitle}>Nessun risultato</Text>
            <Text style={styles.emptySubtitle}>
              Prova a modificare i filtri di ricerca
            </Text>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {filteredRooms.map((room) => (
              <RoomItem key={room.id} room={room} />
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F2FA',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1B1F',
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 12,
  },
  roomTypesScroll: {
    flexDirection: 'row',
  },
  roomTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F2FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8DEF8',
  },
  roomTypeChipActive: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  roomTypeIcon: {
    marginRight: 6,
  },
  roomTypeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6750A4',
  },
  roomTypeChipTextActive: {
    color: '#FFFFFF',
  },
  results: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  resultsCount: {
    fontSize: 14,
    color: '#625B71',
    marginTop: 20,
    marginBottom: 16,
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
  roomsList: {
    gap: 12,
  },
  roomItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomMainInfo: {
    marginBottom: 12,
  },
  roomNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1F',
    marginLeft: 6,
  },
  floorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floorText: {
    fontSize: 14,
    color: '#625B71',
    marginLeft: 6,
    fontWeight: '500',
  },
  hotelInfo: {
    backgroundColor: '#F7F2FA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6750A4',
    marginBottom: 2,
  },
  hotelAddress: {
    fontSize: 12,
    color: '#625B71',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  dateContent: {
    marginLeft: 6,
    flex: 1,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  arrowIcon: {
    marginHorizontal: 6,
  },
  roomTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8DEF8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6750A4',
  },
  priceInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
    textAlign: 'center',
  },
});