export enum Direction {
  PICK_UP = 'PICK_UP',
  DROP_OFF = 'DROP_OFF',
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

export enum TripStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Station {
  id: string;
  routeId: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  status: TripStatus;
  currentStation: number;
  scheduledDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  bus?: {
    id: string;
    licensePlate: string;
  } | null;
  driver?: {
    id: string;
    fullName: string;
  } | null;
}

export interface Route {
  id: string;
  name: string;
  direction: Direction;
  shiftType: ShiftType;
  estimatedTime: string;
  singlePrice: number;
  monthlyPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations mapped from ID
  stations?: Station[];
  trips?: Trip[];
}

export interface GetRoutesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
}
