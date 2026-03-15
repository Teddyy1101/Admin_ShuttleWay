import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy bỏ',
  icon: Icon = Trash2,
  variant = 'danger'
}: ConfirmModalProps) {
  
  const colors = {
    danger: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      btn: 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
    }
  };

  const currentColors = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${currentColors.bg}`}>
                <Icon className={`w-6 h-6 ${currentColors.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                {description}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors shadow-sm ${currentColors.btn}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
