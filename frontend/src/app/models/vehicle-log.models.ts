export interface EntryRequest {
  vehicleNumber: string;
  slotId: number;
  userId: number;
}

export interface ExitRequest {
  vehicleNumber: string;
}

export interface VehicleLogResponse {
  logId: number;
  vehicleNumber: string;
  slotId: number;
  userId: number;
  reservationId?: number;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  status: 'ACTIVE' | 'COMPLETED';
}
