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

// Trạm dừng — dữ liệu Master Data độc lập (không còn routeId, orderIndex)
export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Bảng trung gian Route ↔ Station (chứa thứ tự trạm trên tuyến)
export interface RouteStation {
  orderIndex: number;
  station: Station;
}

// Item gửi kèm khi tạo/cập nhật tuyến đường (mảng stations trong payload)
export interface RouteStationItem {
  stationId: string;
  orderIndex: number;
}

export interface Trip {
  id: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  direction?: Direction;
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
  routeCode: string;
  name: string;
  shiftType: ShiftType;
  estimatedTime: string;
  singlePrice: number;
  monthlyPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Quan hệ M:N qua bảng trung gian RouteStation
  routeStations?: RouteStation[];
  trips?: Trip[];
}

export interface GetRoutesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
}

// Payload gửi lên API khi tạo trạm dừng mới (Master Data độc lập)
export interface CreateStationPayload {
  name: string;
  latitude: number;
  longitude: number;
  routeId?: string;
  orderIndex?: number;
}

// Payload gửi lên API khi cập nhật trạm dừng
export interface UpdateStationPayload {
  name?: string;
  latitude?: number;
  longitude?: number;
}

// Tham số query khi lấy danh sách trạm dừng
export interface GetStationsParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Payload gửi lên API khi cập nhật tuyến đường
export interface UpdateRoutePayload {
  name?: string;
  shiftType?: ShiftType;
  estimatedTime?: string;
  singlePrice?: number;
  monthlyPrice?: number;
  isActive?: boolean;
  stations?: RouteStationItem[];
}

// Payload gửi lên API khi tạo tuyến đường mới
export interface CreateRoutePayload {
  name: string;
  shiftType: ShiftType;
  estimatedTime: string;
  singlePrice: number;
  monthlyPrice: number;
  stations?: RouteStationItem[];
}

