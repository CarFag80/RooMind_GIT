export interface Room {
  id: string;
  name: string;
  description: string;
  roomType: 'single' | 'double' | 'triple' | 'suite';
  roomNumber: string;
  floor: string;
  hotelName: string;
  hotelAddress: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  rating?: number; // 1-5 stars
  pricePerNight?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}