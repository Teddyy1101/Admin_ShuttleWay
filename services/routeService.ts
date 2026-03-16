import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Route, GetRoutesParams, UpdateRoutePayload } from '@/types/route';

export const routeService = {
  // Lấy danh sách tuyến đường có phân trang và lọc
  getRoutes: async (params?: GetRoutesParams): Promise<ApiResponse<PaginatedData<Route>>> => {
    const response = await axiosClient.get('/routes', { params });
    return response.data;
  },

  // Lấy chi tiết tuyến đường theo mã tuyến (routeCode)
  getRouteByCode: async (routeCode: string): Promise<ApiResponse<Route>> => {
    const response = await axiosClient.get('/routes/' + routeCode);
    return response.data;
  },

  // Cập nhật thông tin tuyến đường
  updateRoute: async (routeCode: string, data: UpdateRoutePayload): Promise<ApiResponse<Route>> => {
    const response = await axiosClient.patch(`/routes/${routeCode}`, data);
    return response.data;
  },
};
