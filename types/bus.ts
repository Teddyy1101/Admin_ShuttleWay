export type BusStatus = 'ACTIVE' | 'MAINTENANCE';

export interface Bus {
  id: string;
  licensePlate: string;
  seatCapacity: number;
  status: BusStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetBusesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BusStatus;
}

export interface CreateBusPayload {
  licensePlate: string;
  seatCapacity: number;
  status?: BusStatus;
}

export interface UpdateBusPayload {
  licensePlate?: string;
  seatCapacity?: number;
  status?: BusStatus;
}