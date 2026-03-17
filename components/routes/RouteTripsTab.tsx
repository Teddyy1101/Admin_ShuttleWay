'use client';

import { useState } from 'react';
import { Route, Trip } from '@/types/route';
import { Calendar as BigCalendar, dateFnsLocalizer, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarPlus, Clock, Truck, User as UserIcon } from 'lucide-react';
import BulkAssignModal from './BulkAssignModal';
import EditTripAssignmentModal from './EditTripAssignmentModal';
import { useSWRConfig } from 'swr';
import { useTrips } from '@/hooks/useTrips';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface RouteTripsTabProps {
  route: Route;
}

interface CustomEvent extends CalendarEvent {
  id: string;
  driverId?: string;
  busId?: string;
  driverName?: string;
  busPlate?: string;
  timeString: string;
  status: string;
}

const CustomEventRenderer = ({ event }: { event: CustomEvent }) => {
  let dotColor = 'bg-blue-500';
  if (event.status === 'COMPLETED') dotColor = 'bg-emerald-500';
  if (event.status === 'CANCELLED') dotColor = 'bg-red-500';
  if (event.status === 'IN_PROGRESS') dotColor = 'bg-amber-500';

  return (
    <div className="flex flex-col gap-0.5 px-1.5 py-1 text-xs text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors w-full border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center gap-1.5 font-medium">
        <span className={`w-2 h-2 rounded-full ${dotColor} shadow-sm shrink-0`}></span>
        <span className="truncate">{event.timeString}</span>
      </div>
      <div className="flex flex-col pl-3.5 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="truncate font-semibold text-gray-600 dark:text-gray-300">{event.driverName || 'Chưa phân công'}</span>
        <span className="truncate">{event.busPlate || 'Xe: --'}</span>
      </div>
    </div>
  );
};

export default function RouteTripsTab({ route }: RouteTripsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Dùng hook, route.id phải tồn tại
  const { trips, isLoading, mutate: mutateTrips } = useTrips({
    routeId: route?.id || '',
    limit: 1000, 
  });
  
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<CustomEvent | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const handleSuccess = () => {
    // Re-fetch the route detail
    mutate(`/routes/${route.id}`); 
    mutateTrips(); // mutate ds trips
    
    if (route.routeCode) {
      mutate(`/routes/${route.routeCode}`);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedMonth(val);
    if (val) {
      const [year, month] = val.split('-');
      setCalendarDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    }
  };

  const handleSelectEvent = (event: object) => {
    setSelectedTrip(event as CustomEvent);
    setIsEditOpen(true);
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Convert Route Trips to Calendar Events
  const calendarEvents: CustomEvent[] = trips.map((trip: Trip) => {
    const startDate = new Date(trip.scheduledDate);
    if (trip.startTime) {
      const timeDate = new Date(trip.startTime);
      startDate.setHours(timeDate.getHours(), timeDate.getMinutes());
    }
    
    let endDate = new Date(startDate);
    if (trip.endTime) {
      const timeDate = new Date(trip.endTime);
      endDate.setHours(timeDate.getHours(), timeDate.getMinutes());
    } else {
      endDate.setHours(startDate.getHours() + 2); // Default 2 hours if no end time
    }

    return {
      id: trip.id,
      title: formatTime(trip.startTime),
      start: startDate,
      end: endDate,
      driverId: trip.driverId || undefined,
      busId: trip.busId || undefined,
      driverName: trip.driver?.fullName,
      busPlate: trip.bus?.licensePlate,
      timeString: formatTime(trip.startTime),
      status: trip.status
    };
  });

  // Tạo danh sách mẫu cho bảng tóm tắt (dựa trên các chuyến đi hiện có, nhóm theo giờ khởi hành)
  // Lấy ra các giờ khởi hành ngẫu nhiên làm mẫu (hiển thị tối đa 5 khung giờ)
  const summaryTemplates = Array.from(new Set(calendarEvents.map(e => e.timeString)))
    .slice(0, 5) 
    .map(time => {
      const associatedTrip = trips.find((t: Trip) => formatTime(t.startTime) === time);
      return {
        time,
        driver: associatedTrip?.driver?.fullName || 'Chưa phân công',
        bus: associatedTrip?.bus?.licensePlate || 'Chưa phân công',
        altDriver: '--', // Không được hỗ trợ trong DB hiện tại
        altBus: '--',
      };
    });

  if (!route?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu tuyến đường...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nửa trên (Kế hoạch & Cấu hình) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        {/* Thanh công cụ */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <CalendarPlus size={18} />
              Phân công tháng
            </button>
          </div>
        </div>

        {/* Bảng (Table) Tóm tắt */}
        <div className="p-0 sm:p-5 sm:pt-0 overflow-x-auto relative min-h-[150px]">
          {isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
               <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : null}
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-xl break-keep">Thời gian (Mẫu)</th>
                <th className="px-4 py-3 font-medium">Tài xế chính</th>
                <th className="px-4 py-3 font-medium">Xe chính</th>
                <th className="px-4 py-3 font-medium">Tài xế dự phòng</th>
                <th className="px-4 py-3 font-medium rounded-tr-xl">Xe dự phòng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {summaryTemplates.length > 0 ? (
                summaryTemplates.map((config, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <span className="flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {config.time}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <span className="flex items-center gap-2"><UserIcon size={14} className="text-gray-400"/> {config.driver}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <span className="flex items-center gap-2"><Truck size={14} className="text-gray-400"/> {config.bus}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{config.altDriver}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{config.altBus}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
                    Chưa có lịch trình phân công mẫu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nửa dưới (Lịch thực tế) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 h-[650px] route-calendar-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .route-calendar-wrapper .rbc-calendar {
            border: none;
            font-family: inherit;
          }
          .route-calendar-wrapper .rbc-month-view {
            border: 1px solid var(--fallback-bc, oklch(var(--b3)/0.2));
            border-radius: 0.75rem;
            overflow: hidden;
            border-color: #f3f4f6;
          }
          .dark .route-calendar-wrapper .rbc-month-view {
            border-color: #374151;
          }
          .route-calendar-wrapper .rbc-header {
            padding: 0.75rem 0.5rem;
            font-weight: 600;
            text-transform: capitalize;
            border-bottom: 1px solid #f3f4f6;
            color: #6b7280;
          }
          .dark .route-calendar-wrapper .rbc-header {
            border-bottom-color: #374151;
            color: #9ca3af;
          }
          .route-calendar-wrapper .rbc-header + .rbc-header {
            border-left: 1px solid #f3f4f6;
          }
          .dark .route-calendar-wrapper .rbc-header + .rbc-header {
            border-left-color: #374151;
          }
          .route-calendar-wrapper .rbc-day-bg + .rbc-day-bg {
            border-left: 1px solid #f3f4f6;
          }
          .dark .route-calendar-wrapper .rbc-day-bg + .rbc-day-bg {
            border-left-color: #374151;
          }
          .route-calendar-wrapper .rbc-month-row + .rbc-month-row {
            border-top: 1px solid #f3f4f6;
          }
          .dark .route-calendar-wrapper .rbc-month-row + .rbc-month-row {
            border-top-color: #374151;
          }
          .route-calendar-wrapper .rbc-event {
            background-color: transparent !important;
            padding: 0;
            border: none;
            margin-bottom: 2px;
          }
          .route-calendar-wrapper .rbc-event:focus {
            outline: none;
          }
          .route-calendar-wrapper .rbc-date-cell {
            padding: 0.5rem;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .route-calendar-wrapper .rbc-date-cell.rbc-now {
            color: #2563eb;
            font-weight: 700;
          }
          .dark .route-calendar-wrapper .rbc-date-cell.rbc-now {
            color: #60a5fa;
          }
          .route-calendar-wrapper .rbc-off-range-bg {
            background: #f9fafb;
          }
          .dark .route-calendar-wrapper .rbc-off-range-bg {
            background: #1f2937;
            opacity: 0.4;
          }
          .route-calendar-wrapper .rbc-today {
            background-color: #eff6ff;
          }
          .dark .route-calendar-wrapper .rbc-today {
            background-color: rgba(37, 99, 235, 0.1);
          }
        `}} />
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          date={calendarDate}
          onNavigate={(newDate) => setCalendarDate(newDate)}
          views={['month']}
          defaultView="month"
          toolbar={false}
          components={{
            event: CustomEventRenderer,
          }}
          onSelectEvent={handleSelectEvent}
          className="h-full"
          messages={{
            today: 'Hôm nay',
            previous: 'Trở lại',
            next: 'Tiếp theo',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            agenda: 'Lịch trình',
            date: 'Ngày',
            time: 'Thời gian',
            event: 'Sự kiện',
            noEventsInRange: 'Không có sự kiện nào trong khoảng thời gian này.',
          }}
        />
      </div>

      {/* Modals */}
      <BulkAssignModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        routeId={route.id}
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
