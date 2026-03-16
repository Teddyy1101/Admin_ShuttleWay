// Component phân trang dùng chung cho các trang quản lý
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  limit: number;
  showingCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalItems, limit, showingCount, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
      <div>
        Hiển thị{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{showingCount}</span>{' '}
        / {totalItems} kết quả
      </div>
      <div className="flex gap-1">
        <button
          className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </button>
        <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
          {currentPage}
        </button>
        <button
          className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
