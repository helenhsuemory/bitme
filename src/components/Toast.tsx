import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts } = useAppState();

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  const colorMap = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-semibold text-sm shadow-2xl ${colorMap[toast.type]}`}
          >
            <span className="material-symbols-outlined text-[20px]">{iconMap[toast.type]}</span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
