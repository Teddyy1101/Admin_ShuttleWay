import useSWR from 'swr';
import { tripService } from '@/services/tripService';
import toast from 'react-hot-toast';

// SWR Hook lấy chi tiết 1 chuyến đi kèm danh sách điểm danh
export const useTripDetail = (tripId: string | null) => {
  const fetchKey = tripId ? `/trips/${tripId}/detail` : null;

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => tripService.getTripDetail(tripId!),
    {
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi tải chi tiết chuyến đi');
      },
    }
  );

  return {
    // TransformInterceptor bọc response: { statusCode, message, data: TripDetail }
    tripDetail: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
};
