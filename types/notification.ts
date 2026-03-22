import { Role } from '@/types/user';

// Thông báo từ Admin history API
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    avatarUrl?: string | null;
  };
}

// Payload gửi broadcast thông báo
export interface BroadcastPayload {
  title: string;
  body: string;
  targetRole?: Role;
  routeId?: string;
  tripId?: string;
}

// Tham số query lịch sử thông báo admin
export interface GetNotificationHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Thông báo gom nhóm theo chiến dịch (Admin)
export interface GroupedNotification {
  title: string;
  body: string;
  totalRecipients: number;
  readCount: number;
  targetRoles: string[];
  latestSentAt: string;
}

// Tham số query lịch sử gom nhóm
export interface GetGroupedNotificationParams {
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
