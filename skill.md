# Kỹ năng và Mẫu Code Chuẩn (Coding Patterns)

## 1. Mẫu khai báo Type/Interface (src/types/...)
Luôn định nghĩa type khớp với cấu trúc trả về từ Backend NestJS (có Pagination).
```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  total?: number; // Dành cho phân trang
}

// src/types/bus.ts
export interface Bus {
  id: string;
  licensePlate: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  driverId?: string;
}
2. Mẫu viết Service (src/services/busService.ts)
Chỉ thực hiện gọi Axios, trả về Promise chứa dữ liệu thuần.

TypeScript
import axiosClient from '@/lib/axiosClient';
import { ApiResponse } from '@/types/api';
import { Bus } from '@/types/bus';

export const busService = {
  getAll: async (page: number, limit: number): Promise<ApiResponse<Bus[]>> => {
    const response = await axiosClient.get(`/buses`, { params: { page, limit } });
    return response.data;
  },
  
  create: async (data: Partial<Bus>): Promise<ApiResponse<Bus>> => {
    const response = await axiosClient.post('/buses', data);
    return response.data;
  },
  
  // Các hàm update, delete tương tự...
};
3. Mẫu viết Custom Hook (src/hooks/useBus.ts)
Sử dụng SWR (hoặc React Query) để bọc Service lại, quản lý trạng thái loading và tự động re-fetch.

TypeScript
import useSWR from 'swr';
import { busService } from '@/services/busService';
import toast from 'react-hot-toast';

export const useBuses = (page: number, limit: number) => {
  const { data, error, mutate, isLoading } = useSWR(
    [`/buses`, page, limit], 
    () => busService.getAll(page, limit),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách xe buýt');
      }
    }
  );

  return {
    buses: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate // Hàm gọi lại API sau khi thêm/sửa/xóa
  };
};

export const useCreateBus = () => {
  const create = async (busData: any) => {
    try {
      await busService.create(busData);
      toast.success('Thêm xe buýt thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Thêm thất bại');
      throw error;
    }
  };
  return { create };
};
4. Mẫu Component sử dụng Hook (src/app/buses/page.tsx)
UI Component trở nên cực kỳ gọn gàng.

TypeScript
'use client';
import { useState } from 'react';
import { useBuses } from '@/hooks/useBus';
// Bỏ qua import các component UI khác cho gọn...

export default function BusManagementPage() {
  const [page, setPage] = useState(1);
  const { buses, total, isLoading, mutate } = useBuses(page, 10);

  if (isLoading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1>Quản lý Xe Buýt</h1>
      <table>
        {/* Render danh sách buses ở đây */}
      </table>
    </div>
  );
}