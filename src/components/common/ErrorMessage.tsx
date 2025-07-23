// src/components/common/ErrorMessage.tsx
import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import '../../styles/components/ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="error-message-box">
    <FiAlertCircle size={24} className="error-icon" />
    <p>Ocorreu um erro: {message}</p>
    <button onClick={onRetry} className="retry-button">Tentar Novamente</button>
  </div>
);

export default ErrorMessage;