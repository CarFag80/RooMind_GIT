import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Room } from '@/types/room';

const STORAGE_KEY = 'roomind_rooms';

let roomsCache: Room[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000;

const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        roomsCache = null;
      }
    } catch (error) {
      console.error('🚨 localStorage setItem failed:', error);
      throw error;
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        roomsCache = null;
      }
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  }
};

const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export class RoomStorage {
  static async getRooms(): Promise<Room[]> {
    const now = Date.now();
    if (roomsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return roomsCache;
    }
    
    try {
      const data = await storage.getItem(STORAGE_KEY);
      if (data) {
        const rooms: any[] = JSON.parse(data);
        const processedRooms: Room[] = rooms.map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt),
          roomType: room.roomType || 'single',
          checkInDate: room.checkInDate ? new Date(room.checkInDate) : (room.date ? new Date(room.date) : undefined),
          checkOutDate: room.checkOutDate ? new Date(room.checkOutDate) : undefined,
        }));
        
        const sortedRooms = processedRooms.sort((a: Room, b: Room) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        
        roomsCache = sortedRooms;
        cacheTimestamp = now;
        
        return sortedRooms;
      }
      
      roomsCache = [];
      cacheTimestamp = now;
      return [];
    } catch (error) {
      console.error('Errore nel caricamento delle camere:', error);
      return [];
    }
  }

  static async addRoom(roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
    try {
      const rooms = await this.getRooms();
      const newRoom: Room = {
        ...roomData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      rooms.unshift(newRoom);
      await storage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      
      roomsCache = rooms;
      cacheTimestamp = Date.now();
      
      return newRoom;
    } catch (error) {
      console.error('Errore nell\'aggiunta della camera:', error);
      throw error;
    }
  }

  static async updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<Room | null> {
    try {
      console.log('🔄 INIZIO UPDATE ROOM');
      console.log('🆔 Room ID:', id);
      console.log('📝 Updates ricevuti:', updates);
      
      const rooms = await this.getRooms();
      const roomIndex = rooms.findIndex(room => room.id === id);
      
      if (roomIndex === -1) {
        console.log('❌ Camera non trovata');
        return null;
      }

      console.log('📋 Camera originale:', rooms[roomIndex]);
      
      // Create completely new room object to avoid reference issues
      const updatedRoom: Room = {
        id: rooms[roomIndex].id,
        createdAt: rooms[roomIndex].createdAt,
        updatedAt: new Date(),
        name: updates.name ?? rooms[roomIndex].name,
        description: updates.description ?? rooms[roomIndex].description,
        roomType: updates.roomType ?? rooms[roomIndex].roomType,
        roomNumber: updates.roomNumber ?? rooms[roomIndex].roomNumber,
        floor: updates.floor ?? rooms[roomIndex].floor,
        hotelName: updates.hotelName ?? rooms[roomIndex].hotelName,
        hotelAddress: updates.hotelAddress ?? rooms[roomIndex].hotelAddress,
        checkInDate: updates.checkInDate ?? rooms[roomIndex].checkInDate,
        checkOutDate: updates.checkOutDate ?? rooms[roomIndex].checkOutDate,
        rating: updates.rating ?? rooms[roomIndex].rating,
      };
      
      // Handle price and currency explicitly
      if ('pricePerNight' in updates) {
        if (updates.pricePerNight !== undefined) {
          updatedRoom.pricePerNight = updates.pricePerNight;
          updatedRoom.currency = updates.currency ?? rooms[roomIndex].currency ?? 'EUR';
          console.log('💰 Prezzo aggiornato:', updatedRoom.pricePerNight, updatedRoom.currency);
        } else {
          // Remove price and currency completely
          console.log('🗑️ Rimosso prezzo e valuta');
        }
      } else {
        // Keep existing price and currency
        if (rooms[roomIndex].pricePerNight !== undefined) {
          updatedRoom.pricePerNight = rooms[roomIndex].pricePerNight;
          updatedRoom.currency = rooms[roomIndex].currency;
        }
      }
      
      // Handle currency updates when price exists
      if ('currency' in updates && updatedRoom.pricePerNight !== undefined) {
        updatedRoom.currency = updates.currency;
        console.log('💱 Valuta aggiornata:', updatedRoom.currency);
      }
      
      console.log('✅ Camera aggiornata:', updatedRoom);
      
      rooms[roomIndex] = updatedRoom;

      await storage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      
      // Force cache invalidation
      roomsCache = rooms;
      cacheTimestamp = Date.now();
      
      console.log('💾 Salvataggio completato');
      return rooms[roomIndex];
    } catch (error) {
      console.error('Errore nell\'aggiornamento della camera:', error);
      throw error;
    }
  }

  static async deleteRoom(id: string): Promise<boolean> {
    try {
      console.log('🔥 INIZIO ELIMINAZIONE CAMERA');
      console.log('🔥 ID da eliminare:', id, 'tipo:', typeof id);
      
      const rooms = await this.getRooms();
      console.log('📋 Camere caricate:', rooms.length);
      
      const roomToDelete = rooms.find(room => room.id === id);
      if (!roomToDelete) {
        console.log('❌ Camera non trovata con ID:', id);
        return false;
      }
      
      console.log('🎯 Camera trovata:', roomToDelete.name);
      
      const updatedRooms = rooms.filter(room => room.id !== id);
      console.log('📊 Camere dopo filtro:', updatedRooms.length);
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
      console.log('💾 Dati salvati');
      
      const verifyRooms = await this.getRooms();
      console.log('✅ Verifica: camere rimanenti:', verifyRooms.length);
      
      return verifyRooms.length === updatedRooms.length;
    } catch (error) {
      console.error('💥 Errore eliminazione:', error);
      throw error;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await storage.removeItem(STORAGE_KEY);
      
      roomsCache = null;
      cacheTimestamp = 0;
    } catch (error) {
      console.error('💥 Errore pulizia:', error);
      throw error;
    }
  }
}