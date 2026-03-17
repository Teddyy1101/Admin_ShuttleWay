import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Promotion, GetPromotionsParams, PromotionPayload } from '@/types/promotion';

export const promotionService = {
  // Lấy danh sách khuyến mãi có phân trang
  getPromotions: async (params?: GetPromotionsParams): Promise<ApiResponse<PaginatedData<Promotion>>> => {
    const response = await axiosClient.get('/promotions', { params });
    return response.data;
  },

  // Lấy chi tiết khuyến mãi
  getPromotionById: async (id: string): Promise<ApiResponse<Promotion>> => {
    const response = await axiosClient.get(`/promotions/${id}`);
    return response.data;
  },

  // Tạo mới khuyến mãi
  createPromotion: async (data: PromotionPayload): Promise<ApiResponse<Promotion>> => {
    const response = await axiosClient.post('/promotions', data);
    return response.data;
  },

  // Cập nhật khuyến mãi
  updatePromotion: async (id: string, data: PromotionPayload): Promise<ApiResponse<Promotion>> => {
    const response = await axiosClient.patch(`/promotions/${id}`, data);
    return response.data;
  },

  // Xóa khuyến mãi
  deletePromotion: async (id: string): Promise<ApiResponse<boolean>> => {
    const response = await axiosClient.delete(`/promotions/${id}`);
    return response.data;
  },

  // Khóa / Mở khóa khuyến mãi
  togglePromotionStatus: async (id: string): Promise<ApiResponse<Promotion>> => {
    const response = await axiosClient.patch(`/promotions/${id}/toggle-active`);
    return response.data;
  },
};