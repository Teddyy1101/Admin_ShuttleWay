'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bus, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();

  // Kiểm tra auth khi mới mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Nếu đã authenticated (có token trong localStorage) -> redirect về trang chủ
  // Đồng thời sync lại cookie để middleware hoạt động đúng
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setCookie('accessToken', token, { maxAge: 60 * 60 * 24 });
      }
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      toast.success('Đăng nhập thành công');
      router.push('/');
    } catch (error: any) {
      // Ưu tiên hiển thị lỗi từ hook kiểm tra quyền, sau đó mới tới lỗi API
      const errorMsg = error?.message && !error?.response
        ? error.message
        : error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return null; // Tránh flash content khi đang redirect

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden relative">
      {/* Background decorations - Glassmorphism & Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/30 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md p-8 m-4 rounded-[2rem] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl relative z-10 box-border"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6"
          >
            <Bus className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2 text-center tracking-tight">Chào mừng trở lại</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm font-medium">Đăng nhập vào bảng điều khiển quản trị</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none shadow-sm"
                placeholder="admin@schoolbus.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mật khẩu</label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-4 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-lg shadow-zinc-900/20 dark:shadow-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </motion.button>
        </form>
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  );
}
