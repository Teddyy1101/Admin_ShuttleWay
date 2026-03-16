'use client';

import { Route } from '@/types/route';
import { Calendar, User as UserIcon, Truck, CheckCircle2, Clock, XCircle, PlayCircle } from 'lucide-react';

interface RouteTripsTabProps {
  route: Route;
}

export default function RouteTripsTab({ route }: RouteTripsTabProps) {
  const trips = route.trips || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chuẩn bị', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'Đang chạy', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: PlayCircle };
      case 'COMPLETED':
        return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: Clock };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (trips.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
        <Calendar size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p>Tuyến đường này chưa có chuyến đi nào được lên lịch.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {trips.map((trip) => {
        const StatusStruct = getStatusConfig(trip.status);
        const StatusIcon = StatusStruct.icon;
        
        return (
          <div key={trip.id} className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ngày chạy</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatDate(trip.scheduledDate)}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${StatusStruct.color}`}>
                <StatusIcon size={12} />
                {StatusStruct.label}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Clock size={14} /> Giờ chạy
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(trip.startTime)} {trip.endTime ? `- ${formatTime(trip.endTime)}` : ''}
                </span>
              </div>
              
              <div className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Truck size={14} /> Xe bus
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {trip.bus?.licensePlate || 'Chưa xếp xe'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <UserIcon size={14} /> Tài xế
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {trip.driver?.fullName || 'Chưa phân công'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
