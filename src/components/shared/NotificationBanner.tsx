// src/components/shared/NotificationBanner.tsx
import React, { useEffect } from 'react';

interface NotificationBannerProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onDismiss: () => void;
  duration?: number; // Duração em ms antes de auto-fechar
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  message,
  onDismiss,
  duration = 7000, // Padrão para 7 segundos
}) => {
  useEffect(() => {
    if (duration > 0 && message) { // Adiciona verificação para message
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]); // Recria o timer se a mensagem ou duração mudar

  if (!message) return null;

  return (
    <div className={`notification-banner notification-${type}`}>
      <p>{message}</p>
      <button onClick={onDismiss} className="notification-dismiss-button" aria-label="Fechar Notificação">
        &times;
      </button>
    </div>
  );
};

export default NotificationBanner;