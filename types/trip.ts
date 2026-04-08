// Enum trạng thái chuyến đi
export enum TripStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Enum trạng thái điểm danh
export enum AttendanceStatus {
  PENDING = 'PENDING',
  BOARDED = 'BOARDED',
  ALIGHTED = 'ALIGHTED',
  ABSENT = 'ABSENT',
}

// Enum hướng di chuyển
export enum Direction {
  PICK_UP = 'PICK_UP',
  DROP_OFF = 'DROP_OFF',
}

// Thông tin user rút gọn (tài xế / học sinh)
export interface UserBrief {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string;
  avatarUrl?: string | null;
}

// Thông tin xe buýt rút gọn
export interface BusBrief {
  id: string;
  licensePlate: string;
  seatCapacity?: number;
}

// Thông tin tuyến đường rút gọn
export interface RouteBrief {
  id: string;
  routeCode: string;
  name: string;
  shiftType: string;
}

// Thông tin trạm dừng
export interface StationBrief {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
}

// Tuyến đường kèm trạm (dùng cho chi tiết chuyến)
export interface RouteWithStations extends RouteBrief {
  stations: StationBrief[];
}

// Một item điểm danh trong danh sách
export interface TripAttendanceItem {
  id: string;
  tripId: string;
  studentId: string;
  status: AttendanceStatus;
  boardedAt?: string | null;
  alightedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  student: UserBrief;
}

// Chuyến đi trong bảng danh sách (kèm _count)
export interface TripListItem {
  id: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  direction: Direction;
  status: TripStatus;
  currentStation: number;
  scheduledDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  route: RouteBrief;
  bus?: BusBrief | null;
  driver?: UserBrief | null;
  _count: {
    attendances: number;
  };
  attendances: { status: AttendanceStatus }[];
}

// Chi tiết chuyến đi kèm danh sách điểm danh đầy đủ
export interface TripDetail {
  id: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  direction: Direction;
  status: TripStatus;
  currentStation: number;
  scheduledDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  route: RouteWithStations;
  bus?: BusBrief | null;
  driver?: UserBrief | null;
  attendances: TripAttendanceItem[];
}

// Tham số query danh sách chuyến đi
export interface GetTripsParams {
  page?: number;
  limit?: number;
  status?: TripStatus | string;
  scheduledDate?: string;
  routeId?: string;
}

// Payload điểm danh thủ công
export interface AdminAttendancePayload {
  studentId: string;
  status: AttendanceStatus;
}

// Item học sinh tại trạm (dùng cho API lấy danh sách đón/trả)
export interface StationStudentItem {
  attendanceId: string;
  status: AttendanceStatus;
  boardedAt?: string | null;
  student: UserBrief;
}

// Response API lấy danh sách học sinh tại trạm
export interface StationStudentsResponse {
  station: {
    id: string;
    name: string;
    orderIndex: number;
  };
  studentsToPickUp: StationStudentItem[];
  studentsToDropOff: StationStudentItem[];
}
