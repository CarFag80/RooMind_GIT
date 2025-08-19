import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Room } from '@/types/room';

const STORAGE_KEY = 'roomind_rooms';

// Optimized cache with better memory management
let roomsCache: Room[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // Increased to 1 minute for better performance

// Optimized web storage with error handling
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        // Invalidate cache after successful write
        roomsCache = null;
        cacheTimestamp = 0;
      }
    } catch (error) {
      console.error('localStorage setItem failed:', error);
      throw error;
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        roomsCache = null;
        cacheTimestamp = 0;
      }
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  }
};

const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

// Optimized date parsing with validation
const parseDate = (dateValue: any): Date | undefined => {
  if (!dateValue) return undefined;
  
  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
};

// Optimized room processing with better type safety
const processRoom = (room: any): Room => ({
  id: room.id,
  name: room.name || room.roomNumber || 'Camera senza nome',
  description: room.description || '',
  roomType: room.roomType || 'single',
  roomNumber: room.roomNumber || '',
  floor: room.floor || '',
  hotelName: room.hotelName || '',
  hotelAddress: room.hotelAddress || '',
  createdAt: parseDate(room.createdAt) || new Date(),
  updatedAt: parseDate(room.updatedAt) || new Date(),
  checkInDate: parseDate(room.checkInDate) || parseDate(room.date), // Legacy support
  checkOutDate: parseDate(room.checkOutDate),
  rating: typeof room.rating === 'number' ? room.rating : undefined,
  pricePerNight: typeof room.pricePerNight === 'number' ? room.pricePerNight : undefined,
  currency: room.currency || undefined,
});

export class RoomStorage {
  // Optimized cache management
  private static invalidateCache(): void {
    roomsCache = null;
    cacheTimestamp = 0;
  }

  private static isCacheValid(): boolean {
    return roomsCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  }

  static async getRooms(): Promise<Room[]> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      return roomsCache!;
    }
    
    try {
      const data = await storage.getItem(STORAGE_KEY);
      
      if (!data) {
        roomsCache = [];
        cacheTimestamp = Date.now();
        return [];
      }

      const rawRooms: any[] = JSON.parse(data);
      
      // Process and validate rooms with error handling
      const processedRooms: Room[] = rawRooms
        .filter(room => room && typeof room === 'object')
        .map(processRoom)
        .filter(room => room.id && room.roomNumber && room.hotelName); // Basic validation
      
      // Sort by creation date (newest first)
      const sortedRooms = processedRooms.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      // Update cache
      roomsCache = sortedRooms;
      cacheTimestamp = Date.now();
      
      return sortedRooms;
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Return empty array on error but don't cache it
      return [];
    }
  }

  static async addRoom(roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
    try {
      const rooms = await this.getRooms();
      
      // Generate unique ID with timestamp and random component
      const newRoom: Room = {
        ...roomData,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add to beginning of array for better performance
      const updatedRooms = [newRoom, ...rooms];
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
      
      // Update cache immediately
      roomsCache = updatedRooms;
      cacheTimestamp = Date.now();
      
      return newRoom;
    } catch (error) {
      console.error('Error adding room:', error);
      throw new Error('Failed to add room');
    }
  }

  static async updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room | null> {
    try {
      const rooms = await this.getRooms();
      const roomIndex = rooms.findIndex(room => room.id === id);
      
      if (roomIndex === -1) {
        console.warn('Room not found for update:', id);
        return null;
      }

      const existingRoom = rooms[roomIndex];
      
      // Create updated room with explicit field handling
      const updatedRoom: Room = {
        ...existingRoom,
        ...updates,
        id: existingRoom.id, // Ensure ID is not overwritten
        createdAt: existingRoom.createdAt, // Preserve creation date
        updatedAt: new Date(),
      };
      
      // Handle price/currency logic
      if ('pricePerNight' in updates) {
        if (updates.pricePerNight === undefined) {
          // Remove price and currency
          delete updatedRoom.pricePerNight;
          delete updatedRoom.currency;
        } else {
          // Set price and ensure currency exists
          updatedRoom.pricePerNight = updates.pricePerNight;
          updatedRoom.currency = updates.currency || existingRoom.currency || 'EUR';
        }
      }
      
      // Update the room in the array
      rooms[roomIndex] = updatedRoom;
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      
      // Update cache
      roomsCache = rooms;
      cacheTimestamp = Date.now();
      
      return updatedRoom;
    } catch (error) {
      console.error('Error updating room:', error);
      throw new Error('Failed to update room');
    }
  }

  static async deleteRoom(id: string): Promise<boolean> {
    try {
      const rooms = await this.getRooms();
      const initialLength = rooms.length;
      
      // Filter out the room to delete
      const updatedRooms = rooms.filter(room => room.id !== id);
      
      // Check if room was actually removed
      if (updatedRooms.length === initialLength) {
        console.warn('Room not found for deletion:', id);
        return false;
      }
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
      
      // Update cache
      roomsCache = updatedRooms;
      cacheTimestamp = Date.now();
      
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw new Error('Failed to delete room');
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEY);
      this.invalidateCache();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  // Utility method to get cache info (for debugging)
  static getCacheInfo(): { cached: boolean; timestamp: number; size: number } {
    return {
      cached: roomsCache !== null,
      timestamp: cacheTimestamp,
      size: roomsCache?.length || 0
    };
  }
}