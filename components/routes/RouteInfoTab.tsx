'use client';

import { Route } from '@/types/route';

interface RouteInfoTabProps {
  route: Route;
}

export default function RouteInfoTab({ route }: RouteInfoTabProps) {
  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'Chưa cập nhật';
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined) return '0 đ';
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const sortedStations = route.stations ? [...route.stations].sort((a,b) => a.orderIndex - b.orderIndex) : [];
  const routePath = sortedStations.length > 0 
    ? sortedStations.map(s => s.name).join(' - ') 
    : 'Chưa cập nhật lộ trình';

  const isActiveBadge = (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      route.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}>
      {route.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />}
      {!route.isActive && <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2" />}
      {route.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
    </span>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-l overflow-hidden">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Mã tuyến
        </div>
        <div className="p-4 text-sm font-semibold text-gray-900 dark:text-white md:border-r border-gray-200 dark:border-gray-800">
          {route.routeCode}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Tên tuyến
        </div>
        <div className="p-4 text-sm font-semibold text-gray-900 dark:text-white">
          {route.name}
        </div>
      </div>
      
      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Thời gian chuyến
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100 md:border-r border-gray-200 dark:border-gray-800">
          {formatTime(route.estimatedTime)}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Ca hoạt động
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100">
          {route.shiftType === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Giá vé lượt
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100 font-medium md:border-r border-gray-200 dark:border-gray-800">
          {formatPrice(route.singlePrice)}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Giá vé tháng
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
          {formatPrice(route.monthlyPrice)}
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-[25%_75%] border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Trạng thái
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100">
          {isActiveBadge}
        </div>
      </div>

      {/* Row 5 */}
      <div className="grid grid-cols-1 md:grid-cols-[25%_75%] border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Lộ trình đi qua
        </div>
        <div className="p-4 text-sm text-gray-900 dark:text-gray-100 leading-relaxed max-w-full">
          {routePath}
        </div>
      </div>
    </div>
  );
}
