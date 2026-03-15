import useSWR from 'swr';
import { userService } from '@/services/userService';
import { GetUsersParams, User } from '@/types/user';
import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';

export const useUsers = (initialParams?: GetUsersParams): {
  users: User[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  params: GetUsersParams;
  updateFilters: (newParams: Partial<GetUsersParams>) => void;
  changePage: (newPage: number) => void;
  toggleStatus: (user: User) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  createUser: (data: FormData) => Promise<void>;
  updateUser: (id: string, data: FormData) => Promise<void>;
  mutate: any;
} => {
  const [params, setParams] = useState<GetUsersParams>(initialParams || { page: 1, limit: 10 });

  // fetch key: stringify params để cache được chính xác khi query thay đổi
  const fetchKey = ['/users', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => userService.getUsers(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
      },
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetUsersParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  const toggleStatus = async (user: User) => {
    try {
      // Optimistic update
      mutate(
        (currentData: any) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            data: {
              ...currentData.data,
              data: currentData.data.data.map((u: User) =>
                u.id === user.id ? { ...u, isActive: !user.isActive } : u
              ),
            },
          };
        },
        { revalidate: false }
      );
      
      await userService.updateUserStatus(user.id, !user.isActive);
      toast.success(user.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      // Revert optimism if failed
      mutate();
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await userService.deleteUser(id);
      toast.success('Đã xóa tài khoản');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const createUser = async (data: FormData) => {
    try {
      await userService.createUser(data);
      toast.success('Thêm tài khoản thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm tài khoản');
      throw error;
    }
  };

  const updateUser = async (id: string, data: FormData) => {
    try {
      await userService.updateUser(id, data);
      toast.success('Cập nhật tài khoản thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật tài khoản');
      throw error;
    }
  };

  return {
    users: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    toggleStatus,
    deleteAccount,
    createUser,
    updateUser,
    mutate,
  };
};
