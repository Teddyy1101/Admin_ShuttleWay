'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRouteDetail } from '@/hooks/useRoute';

import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Info, Map, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import RouteInfoTab from '@/components/routes/RouteInfoTab';
import RouteStationsTab from '@/components/routes/RouteStationsTab';
import RouteTripsTab from '@/components/routes/RouteTripsTab';

type TabId = 'INFO' | 'STATIONS' | 'TRIPS';

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { route, isLoading, isError, mutate } = useRouteDetail(id);
  const [activeTab, setActiveTab] = useState<TabId>('INFO');

  const tabs: { id: TabId; label: string; icon?: any }[] = [
    { id: 'INFO', label: 'Thông tin' },
    { id: 'STATIONS', label: 'Trạm dừng' },
    { id: 'TRIPS', label: 'Lịch trình' },
  ];

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Đang tải thông tin tuyến đường...</p>
        </div>
      </PageWrapper>
    );
  }

  if (isError || !route) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy tuyến đường</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Tuyến đường này không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Outer Page Header */}
      <div className="mb-6">
        <PageHeader
          title={`Chi tiết tuyến đường: ${route.name}`}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Quản lý tuyến', href: '/routes' },
            { label: route.name }
          ]}
        />
      </div>

      {/* Main Card */}
      <div className="min-h-[calc(100vh-180px)] bg-white dark:bg-gray-900 rounded-l border border-gray-200 dark:border-gray-800 overflow-hidden">

        {/* Inner Card Header */}
        <div className="flex items-center gap-4 py-5 px-6  border-gray-100 dark:border-gray-800">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0">
            Chi tiết tuyến {route.routeCode}
          </h1>
        </div>

        {/* Tabs */}
        <div className=" px-6 border-b border-gray-100 dark:border-gray-800 ">
          <div className="flex gap-8">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 pt-4 text-sm transition-all duration-200 relative whitespace-nowrap ${isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium'
                    }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicatorRoute"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'INFO' && <RouteInfoTab route={route} />}
              {activeTab === 'STATIONS' && <RouteStationsTab route={route} mutate={mutate} />}
              {activeTab === 'TRIPS' && <RouteTripsTab route={route} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}