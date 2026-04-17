import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Transaction, GetTransactionsParams, TransactionStats } from '@/types/transaction';

export const transactionService = {
  // Lấy danh sách giao dịch có phân trang, lọc theo trạng thái, phương thức, tìm kiếm...
  getTransactions: async (params?: GetTransactionsParams): Promise<ApiResponse<PaginatedData<Transaction>>> => {
    const response = await axiosClient.get('/transactions', { params });
    return response.data;
  },

  // Lấy thống kê dòng tiền (tổng doanh thu, công nợ, cơ cấu)
  getStats: async (): Promise<ApiResponse<TransactionStats>> => {
    const response = await axiosClient.get('/transactions/stats');
    return response.data;
  },

  // Xác nhận thanh toán (cập nhật trạng thái giao dịch thành SUCCESS)
  confirmPayment: async (id: string): Promise<ApiResponse<Transaction>> => {
    const response = await axiosClient.patch(`/transactions/${id}/status`, { status: 'SUCCESS' });
    return response.data;
  },

  // Lấy tất cả giao dịch theo bộ lọc (dùng cho xuất báo cáo Excel)
  exportTransactions: async (params?: GetTransactionsParams): Promise<ApiResponse<PaginatedData<Transaction>>> => {
    const response = await axiosClient.get('/transactions', {
      params: { ...params, page: 1, limit: 99999 },
    });
    return response.data;
  },
};
