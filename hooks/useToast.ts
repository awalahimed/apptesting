import { toast } from 'sonner-native';

type ToastType = 'success' | 'error' | 'info';

interface ShowToastParams {
  type: ToastType;
  message: string;
  duration?: number;
}

export function showToast({ type, message, duration = 3000 }: ShowToastParams) {
  switch (type) {
    case 'success':
      toast.success(message, { duration });
      break;
    case 'error':
      toast.error(message, { duration });
      break;
    case 'info':
      toast.info(message, { duration });
      break;
  }
}

export { toast };
