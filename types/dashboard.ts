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
