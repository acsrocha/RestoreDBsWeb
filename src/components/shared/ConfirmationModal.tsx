// src/components/shared/ConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  onClose: () => void;
  onConfirm: (confirmationInput?: string) => Promise<void>;
  isProcessing: boolean;
  confirmationInputProps?: {
    required: boolean;
    expectedValue?: string;
    placeholder?: string;
    label?: string;
    errorMessage?: string;
  };
  children?: React.ReactNode;
  dangerMode?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText,
  cancelButtonText = 'Cancelar',
  onClose,
  onConfirm,
  isProcessing,
  confirmationInputProps,
  children,
  dangerMode = true,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      setInputError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirmClick = async () => {
    // Validar entrada de confirmação se necessário
    if (confirmationInputProps?.required) {
      if (confirmationInput.trim() === '') {
        setInputError(confirmationInputProps.errorMessage || 'Por favor, preencha o campo de confirmação.');
        return;
      }
      
      if (confirmationInputProps.expectedValue && confirmationInput.trim() !== confirmationInputProps.expectedValue) {
        setInputError(
          confirmationInputProps.errorMessage || 
          `O valor de confirmação '${confirmationInput.trim()}' não corresponde ao valor esperado '${confirmationInputProps.expectedValue}'.`
        );
        return;
      }
    }
    
    setInputError(null);
    await onConfirm(confirmationInputProps?.required ? confirmationInput.trim() : undefined);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close-button" 
          onClick={onClose} 
          disabled={isProcessing} 
          aria-label="Fechar"
        >
          &times;
        </button>
        
        <h2>
          {dangerMode && <FiAlertTriangle style={{ color: 'var(--error-color)', marginRight: '8px' }} />}
          {title}
        </h2>
        
        <div className="modal-scrollable-content">
          <p>{message}</p>
          
          {confirmationInputProps?.required && (
            <div className="confirmation-input-container">
              <p className="confirmation-input-label">
                {confirmationInputProps.label || 'Para confirmar, digite o valor de confirmação:'}
              </p>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => {
                  setConfirmationInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder={confirmationInputProps.placeholder || 'Digite o valor de confirmação'}
                disabled={isProcessing}
                className={inputError ? 'input-error' : ''}
                autoFocus
              />
              {inputError && <p className="error-text modal-input-error">{inputError}</p>}
            </div>
          )}
          
          {children}
          
          {dangerMode && (
            <p className="warning-text">
              <strong>Atenção:&nbsp;</strong> Esta ação é irreversível.
            </p>
          )}
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="button-secondary" 
            disabled={isProcessing}
          >
            {cancelButtonText}
          </button>
          <button 
            onClick={handleConfirmClick} 
            className={dangerMode ? "button-danger" : "button-primary"} 
            disabled={isProcessing || (confirmationInputProps?.required && confirmationInputProps?.expectedValue && confirmationInput.trim() !== confirmationInputProps.expectedValue)}
          >
            {isProcessing ? 'Processando...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;