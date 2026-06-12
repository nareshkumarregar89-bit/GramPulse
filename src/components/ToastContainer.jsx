import { X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { darkMode } = useData();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in
            ${toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }
          `}
        >
          <span className="flex-1 font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
