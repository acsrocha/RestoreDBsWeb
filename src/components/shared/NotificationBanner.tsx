// src/components/shared/NotificationBanner.tsx
import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

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

  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheckCircle size={20} />;
      case 'error': return <FiXCircle size={20} />;
      case 'warning': return <FiAlertTriangle size={20} />;
      case 'info': return <FiInfo size={20} />;
      default: return <FiInfo size={20} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warning': return 'Atenção';
      case 'info': return 'Informação';
      default: return 'Notificação';
    }
  };

  return (
    <div className={`notification-banner notification-${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">{getTitle()}</div>
          <div className="notification-message">{message}</div>
        </div>
      </div>
      <button onClick={onDismiss} className="notification-dismiss-button" aria-label="Fechar Notificação">
        <FiX size={18} />
      </button>
    </div>
  );
};

export default NotificationBanner;