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

  return {
    users: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    mutate,
  };
};
