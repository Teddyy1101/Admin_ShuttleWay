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
