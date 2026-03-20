'use client';

import { useState } from 'react';
import { Route, ShiftType } from '@/types/route';
import { routeService } from '@/services/routeService';
import { Check, X, Pencil, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { KeyedMutator } from 'swr';
import type { ApiResponse } from '@/types/api';

interface RouteInfoTabProps {
  route: Route;
  mutate: KeyedMutator<ApiResponse<Route>>;
}

// Kiểu cho ô đang chỉnh sửa
type EditingField = 'name' | 'estimatedTime' | 'shiftType' | 'singlePrice' | 'monthlyPrice' | 'isActive' | null;

export default function RouteInfoTab({ route, mutate }: RouteInfoTabProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'Chưa cập nhật';
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
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

  const sortedStations = route.stations ? [...route.stations].sort((a, b) => a.orderIndex - b.orderIndex) : [];
  const routePath = sortedStations.length > 0
    ? sortedStations.map(s => s.name).join(' → ')
    : 'Chưa cập nhật lộ trình';

  // Bắt đầu chỉnh sửa một trường
  const startEditing = (field: EditingField) => {
    if (isSaving || !field) return;
    setEditingField(field);
    switch (field) {
      case 'name':
        setEditValue(route.name);
        break;
      case 'estimatedTime':
        // Chuyển ISO sang datetime-local format
        if (route.estimatedTime) {
          const date = new Date(route.estimatedTime);
          const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setEditValue(local);
        } else {
          setEditValue('');
        }
        break;
      case 'shiftType':
        setEditValue(route.shiftType);
        break;
      case 'singlePrice':
        setEditValue(String(route.singlePrice));
        break;
      case 'monthlyPrice':
        setEditValue(String(route.monthlyPrice));
        break;
      case 'isActive':
        setEditValue(String(route.isActive));
        break;
    }
  };

  // Hủy chỉnh sửa
  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Lưu giá trị đã chỉnh sửa
  const saveField = async () => {
    if (!editingField || isSaving) return;

    // Kiểm tra giá trị có thay đổi không
    let payload: Record<string, string | number | boolean> = {};
    switch (editingField) {
      case 'name':
        if (!editValue.trim()) {
          toast.error('Tên tuyến không được để trống!');
          return;
        }
        if (editValue === route.name) { cancelEditing(); return; }
        payload = { name: editValue.trim() };
        break;
      case 'estimatedTime':
        if (!editValue) { cancelEditing(); return; }
        payload = { estimatedTime: editValue };
        break;
      case 'shiftType':
        if (editValue === route.shiftType) { cancelEditing(); return; }
        payload = { shiftType: editValue };
        break;
      case 'singlePrice':
        if (Number(editValue) === route.singlePrice) { cancelEditing(); return; }
        payload = { singlePrice: Number(editValue) };
        break;
      case 'monthlyPrice':
        if (Number(editValue) === route.monthlyPrice) { cancelEditing(); return; }
        payload = { monthlyPrice: Number(editValue) };
        break;
      case 'isActive':
        if ((editValue === 'true') === route.isActive) { cancelEditing(); return; }
        payload = { isActive: editValue === 'true' };
        break;
    }

    setIsSaving(true);
    try {
      await routeService.updateRoute(route.routeCode, payload);
      toast.success('Cập nhật thành công!');
      mutate();
      cancelEditing();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý nhấn Enter để lưu, Escape để hủy
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveField();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Nút Lưu/Hủy nhỏ gọn
  const renderEditActions = () => (
    <div className="flex items-center gap-1 ml-2 shrink-0">
      <button
        onClick={saveField}
        disabled={isSaving}
        className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 dark:text-emerald-400 transition-colors disabled:opacity-50"
        title="Lưu (Enter)"
      >
        <Check size={14} />
      </button>
      <button
        onClick={cancelEditing}
        disabled={isSaving}
        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors disabled:opacity-50"
        title="Hủy (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  );

  // Style chung cho ô giá trị có thể chỉnh sửa
  const editableCellClass = "p-4 text-sm text-gray-900 dark:text-gray-100 cursor-pointer group/cell hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors";
  const editInputClass = "w-full px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";

  // Render ô có thể chỉnh sửa
  const renderEditableCell = (
    field: EditingField,
    displayValue: React.ReactNode,
    extraClass?: string
  ) => {
    if (editingField === field) {
      // Đang chỉnh sửa → hiển thị input
      switch (field) {
        case 'name':
          return (
            <div className={`p-3 ${extraClass || ''}`}>
              <div className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className={editInputClass}
                />
                {renderEditActions()}
              </div>
            </div>
          );
        case 'estimatedTime':
          return (
            <div className={`p-3 ${extraClass || ''}`}>
              <div className="flex items-center">
                <input
                  autoFocus
                  type="datetime-local"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className={editInputClass}
                />
                {renderEditActions()}
              </div>
            </div>
          );
        case 'shiftType':
          return (
            <div className={`p-3 ${extraClass || ''}`}>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <select
                    autoFocus
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`${editInputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value={ShiftType.MORNING}>Buổi sáng</option>
                    <option value={ShiftType.AFTERNOON}>Buổi chiều</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {renderEditActions()}
              </div>
            </div>
          );
        case 'singlePrice':
        case 'monthlyPrice':
          return (
            <div className={`p-3 ${extraClass || ''}`}>
              <div className="flex items-center">
                <input
                  autoFocus
                  type="number"
                  min={0}
                  step={1000}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className={editInputClass}
                />
                {renderEditActions()}
              </div>
            </div>
          );
        case 'isActive':
          return (
            <div className={`p-3 ${extraClass || ''}`}>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <select
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`${editInputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm ngưng</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {renderEditActions()}
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    // Chế độ hiển thị bình thường (click để sửa)
    return (
      <div
        className={`${editableCellClass} ${extraClass || ''}`}
        onClick={() => startEditing(field)}
        title="Nhấn để chỉnh sửa"
      >
        <div className="flex items-center justify-between">
          <span>{displayValue}</span>
          <Pencil size={14} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0 ml-2" />
        </div>
      </div>
    );
  };

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
      {/* Row 1: Mã tuyến (không sửa) + Tên tuyến (sửa được) */}
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
        {renderEditableCell('name', <span className="font-semibold">{route.name}</span>)}
      </div>

      {/* Row 2: Thời gian chuyến + Ca hoạt động */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Thời gian tạo
        </div>
        {renderEditableCell('estimatedTime', formatTime(route.estimatedTime), 'md:border-r border-gray-200 dark:border-gray-800')}
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Ca hoạt động
        </div>
        {renderEditableCell('shiftType', route.shiftType === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều')}
      </div>

      {/* Row 3: Giá vé lượt + Giá vé tháng */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Giá vé lượt
        </div>
        {renderEditableCell('singlePrice', <span className="font-medium">{formatPrice(route.singlePrice)}</span>, 'md:border-r border-gray-200 dark:border-gray-800')}
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Giá vé tháng
        </div>
        {renderEditableCell('monthlyPrice', <span className="font-medium">{formatPrice(route.monthlyPrice)}</span>)}
      </div>

      {/* Row 4: Trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-[25%_75%] border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400 md:border-r border-gray-200 dark:border-gray-800">
          Trạng thái
        </div>
        {renderEditableCell('isActive', isActiveBadge)}
      </div>

      {/* Row 5: Lộ trình (chỉ hiển thị, không sửa ở đây) */}
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
