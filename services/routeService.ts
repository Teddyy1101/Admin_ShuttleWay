import axiosClient from '@/lib/axiosClient';
import { ApiResponse, PaginatedData } from '@/types/api';
import { Route, GetRoutesParams } from '@/types/route';

export const routeService = {
  // Lấy danh sách tuyến đường có phân trang và lọc
  getRoutes: async (params?: GetRoutesParams): Promise<ApiResponse<PaginatedData<Route>>> => {
    const response = await axiosClient.get('/routes', { params });
    return response.data;
  },

  // Lấy chi tiết tuyến đường bao gồm trạm dừng và chuyến đi
  getRouteById: async (id: string): Promise<ApiResponse<Route>> => {
    const response = await axiosClient.get(`/routes/${id}`);
    return response.data;
  },
};
