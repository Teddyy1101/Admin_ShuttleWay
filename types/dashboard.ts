// Interface cho dữ liệu thống kê Dashboard
export interface DashboardStats {
  activeStudents: number;
  activeBuses: number;
  todayTrips: number;
  totalRevenue: number;
}

// Interface cho dữ liệu biểu đồ doanh thu
export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

// Interface cho top tài xế
export interface TopDriver {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  tripCount: number;
}

// Interface cho thống kê trạng thái chuyến đi
export interface TripStat {
  status: string;
  count: number;
}

// Interface cho hoạt động gần đây
export interface Activity {
  id: string;
  type: 'TICKET' | 'SUPPORT';
  title: string;
  description: string;
  createdAt: string;
}

// Interface cho chuyến xe đang chạy
export interface LiveTrip {
  id: string;
  routeId: string;
  startTime: string;
  route?: { routeCode: string; name: string };
  driver?: { fullName: string };
  bus?: { licensePlate: string };
}

// Interface cho thông báo Admin
export interface AdminNotification {
  id: string;
  type: 'LEAVE_REQUEST' | 'PAYMENT_SUCCESS';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  payload?: any;
}
