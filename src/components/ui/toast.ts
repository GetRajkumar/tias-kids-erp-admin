import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function toast({ title, description, status = 'info', duration = 4000 }: ToastOptions) {
  switch (status) {
    case 'success':
      sonnerToast.success(title, { description, duration });
      break;
    case 'error':
      sonnerToast.error(title, { description, duration });
      break;
    case 'warning':
      sonnerToast.warning(title, { description, duration });
      break;
    default:
      sonnerToast.info(title, { description, duration });
  }
}
