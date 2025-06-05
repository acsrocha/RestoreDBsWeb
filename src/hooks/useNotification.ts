import toast from 'react-hot-toast';

interface NotificationOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export const useNotification = () => {
  const showSuccess = (message: string, options?: NotificationOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
    });
  };

  const showError = (message: string, options?: NotificationOptions) => {
    toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
    });
  };

  const showInfo = (message: string, options?: NotificationOptions) => {
    toast(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  };

  const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismissToast,
  };
}; 