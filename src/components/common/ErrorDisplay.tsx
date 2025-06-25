// src/components/common/ErrorDisplay.tsx
import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="error-display">
      <div className="error-icon">
        <FiAlertTriangle />
      </div>
      <div className="error-content">
        <h3>Erro ao carregar dados</h3>
        <p>{error}</p>
        {showRetry && onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button"
            aria-label="Tentar novamente"
          >
            <FiRefreshCw />
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;