// Trạng thái đơn xin nghỉ
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Thông tin tuyến xe trong vé active
export interface StudentRoute {
  route: {
    id: string;
    name: string;
    routeCode: string;
  };
}

// Đơn xin nghỉ
export interface LeaveRequest {
  id: string;
  studentId: string;
  parentId: string;
  fromDate: string;
  toDate: string;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    studentTickets: StudentRoute[];
  };
  parent: {
    id: string;
    fullName: string;
    phone: string | null;
  };
}

// Tham số lọc danh sách đơn xin nghỉ
export interface GetLeaveRequestsParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
