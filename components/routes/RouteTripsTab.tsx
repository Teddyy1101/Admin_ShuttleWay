'use client';

import { useState, useMemo } from 'react';
import { Route, Trip } from '@/types/route';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { CalendarPlus, User as UserIcon, ChevronLeft, ChevronRight, Edit, X } from 'lucide-react';
import BulkAssignModal from './BulkAssignModal';
import EditTripAssignmentModal from './EditTripAssignmentModal';
import { useSWRConfig } from 'swr';
import { useTrips } from '@/hooks/useTrips';

interface RouteTripsTabProps {
  route: Route;
}

export default function RouteTripsTab({ route }: RouteTripsTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'custom'>('month');
  
  // Modals
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<(Trip & { start: Date; timeString: string }) | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  
  const { mutate } = useSWRConfig();

  const currentMonthStr = format(currentDate, 'yyyy-MM');

  // Fetch dữ liệu chuyến đi
  const { trips, isLoading, mutate: mutateTrips } = useTrips({
    routeId: route?.id || '',
    limit: 1000, 
    // Trong thực tế bạn có thể truyền thêm startTime/endTime của tháng hiện tại để tối ưu API
  });

  const handleSuccess = () => {
    mutate(`/routes/${route.id}`); 
    mutateTrips(); 
    if (route.routeCode) mutate(`/routes/${route.routeCode}`);
  };

  // Trích xuất giờ:phút từ trường start_time, dùng getUTCHours để tránh lệch múi giờ
  const formatTime = (timeString?: string | null): string => {
    if (!timeString) return '--:--';
    const date = parseISO(timeString);
    if (isNaN(date.getTime())) return timeString;
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };


  // Tạo mảng các ngày để render Calendar Grid (Từ thứ 2 đến Chủ nhật)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Tuần bắt đầu từ T2
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Lọc chuyến đi cho ngày đang được chọn (phần dưới Calendar)
  const selectedDayTrips = useMemo(() => {
    if (!selectedDate) return [];
    return trips.filter((trip: Trip) => isSameDay(new Date(trip.scheduledDate), selectedDate));
  }, [selectedDate, trips]);
  
  if (!route?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Đang tải dữ liệu tuyến đường...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
            {['week', 'month', 'custom'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'week' ? 'Tuần' : tab === 'month' ? 'Tháng' : 'Tùy chọn'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <input
                type="month"
                value={currentMonthStr}
                onChange={(e) => {
                  if (e.target.value) setCurrentDate(new Date(e.target.value + '-01'));
                }}
                className="bg-transparent border-none px-2 py-2 text-sm font-semibold text-center outline-none w-[142px] cursor-pointer"
              />
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <CalendarPlus size={18} />
              Phân lịch
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-l overflow-hidden relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-bold text-gray-600 dark:text-gray-300">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-700 gap-[1px]">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const dayTrips = trips.filter((t: Trip) => isSameDay(new Date(t.scheduledDate), day));

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                    // Mở modal chi tiết ngày khi click vào ô có chuyến
                    const hasDayTrips = trips.filter((t: Trip) => isSameDay(new Date(t.scheduledDate), day)).length > 0;
                    if (hasDayTrips) setIsDayDetailOpen(true);
                  }}
                  className={`min-h-[100px] p-2 bg-white dark:bg-gray-800 cursor-pointer transition-colors relative
                    ${!isCurrentMonth ? 'opacity-40 bg-gray-50 dark:bg-gray-900' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/20'}
                    ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30' : ''}
                  `}
                >
                  <div className={`text-right text-sm font-semibold mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Chấm màu + giờ: xanh lá = Chiều đi, cam = Chiều về */}
                  <div className="flex flex-col gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                    {dayTrips
                      .sort((a: Trip, b: Trip) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())
                      .slice(0, 4)
                      .map((trip: Trip) => (
                          <div key={trip.id} className="flex items-center gap-1.5">
                            {/* Chấm tròn nhỏ: xanh lá = Chiều đi, cam = Chiều về */}
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              trip.direction === 'PICK_UP'
                                ? 'bg-emerald-500' 
                                : 'bg-amber-500'
                            }`} />
                            {/* Giờ khởi hành */}
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                              {formatTime(trip.startTime)}
                            </span>
                          </div>
                      ))}
                    {dayTrips.length > 4 && (
                      <div className="text-[10px] text-gray-500 font-medium px-1">
                        +{dayTrips.length - 4} chuyến
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal chi tiết phân công ngày */}
      {isDayDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDayDetailOpen(false)}
          />
          {/* Nội dung Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Lịch ngày {format(selectedDate, 'dd-MM-yyyy')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Lộ trình hiện tại: <span className="font-medium text-gray-700 dark:text-gray-300">{route.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsDayDetailOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Bảng phân công */}
            <div className="flex-1 overflow-auto p-5">
              {selectedDayTrips.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  Không có chuyến đi nào được lên lịch vào ngày này.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Giờ</th>
                        <th className="px-4 py-3 font-semibold">Hướng</th>
                        <th className="px-4 py-3 font-semibold">Tài xế</th>
                        <th className="px-4 py-3 font-semibold">Xe</th>
                        <th className="px-4 py-3 font-semibold">Người thay thế</th>
                        <th className="px-4 py-3 font-semibold">Xe thay thế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {selectedDayTrips
                        .sort((a: Trip, b: Trip) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())
                        .map((trip: Trip) => (
                          <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                            {/* Giờ khởi hành */}
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {formatTime(trip.startTime)}
                            </td>
                            {/* Hướng: Chiều đi / Chiều về */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                trip.direction === 'PICK_UP'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {trip.direction === 'PICK_UP' ? 'Chiều đi' : 'Chiều về'}
                              </span>
                            </td>
                            {/* Tên tài xế */}
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {trip.driver?.fullName || 'Chưa phân công'}
                            </td>
                            {/* Biển số xe */}
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {trip.bus?.licensePlate || 'Chưa gán xe'}
                            </td>
                            {/* Người thay thế */}
                            <td className="px-4 py-3 text-gray-400">--</td>
                            {/* Xe thay thế */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">--</span>
                                {/* Nút chỉnh sửa chuyến */}
                                <button
                                  onClick={() => {
                                    setSelectedTrip({
                                      ...trip,
                                      start: new Date(trip.scheduledDate),
                                      timeString: formatTime(trip.startTime)
                                    });
                                    setIsEditOpen(true);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Edit size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BulkAssignModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        route={route}
        onSuccess={handleSuccess}
      />

      <EditTripAssignmentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tripData={selectedTrip}
        onSuccess={handleSuccess}
      />
    </div>
  );
}