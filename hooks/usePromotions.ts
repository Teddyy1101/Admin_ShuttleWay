
'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { promotionService } from '@/services/promotionService';
import { GetPromotionsParams, Promotion, PromotionPayload } from '@/types/promotion';
import toast from 'react-hot-toast';

export const usePromotions = (initialParams?: GetPromotionsParams) => {
  const [params, setParams] = useState<GetPromotionsParams>(initialParams || { page: 1, limit: 10 });

  const fetchKey = ['/promotions', JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => promotionService.getPromotions(params),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách khuyến mãi');
      },
      keepPreviousData: true,
    }
  );

  const updateFilters = useCallback((newParams: Partial<GetPromotionsParams>) => {
    setParams(prev => ({ ...prev, ...newParams, page: newParams.page || 1 }));
  }, []);

  const changePage = useCallback((newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  const createPromotion = async (payload: PromotionPayload) => {
    try {
      await promotionService.createPromotion(payload);
      toast.success('Thêm mã khuyến mãi thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm mã khuyến mãi');
      throw error;
    }
  };

  const updatePromotion = async (id: string, payload: PromotionPayload) => {
    try {
      await promotionService.updatePromotion(id, payload);
      toast.success('Cập nhật mã khuyến mãi thành công');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật mã khuyến mãi');
      throw error;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await promotionService.deletePromotion(id);
      toast.success('Đã xóa mã khuyến mãi');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa mã khuyến mãi');
      throw error;
    }
  };

  const toggleStatus = async (promo: Promotion) => {
    try {
      await promotionService.togglePromotionStatus(promo.id);
      toast.success(promo.isActive ? 'Đã tạm dừng mã khuyến mãi' : 'Đã kích hoạt mã khuyến mãi');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thay đổi trạng thái');
      throw error;
    }
  };

  return {
    promotions: data?.data?.data || [],
    total: data?.data?.meta?.total || 0,
    page: data?.data?.meta?.page || 1,
    limit: data?.data?.meta?.limit || 10,
    isLoading,
    isError: !!error,
    params,
    updateFilters,
    changePage,
    createPromotion,
    updatePromotion,
    deletePromotion,
    toggleStatus,
    mutate,
  };
};