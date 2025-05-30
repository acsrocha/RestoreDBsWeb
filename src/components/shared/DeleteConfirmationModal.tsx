// src/components/shared/DeleteConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // A assinatura pode ser simplificada, já que a validação é interna
  isDeleting: boolean;
  itemName: string;
  folderName: string;
  ticketId: string; // NOVO: Prop para receber o Ticket ID para verificação
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
  folderName,
  ticketId,
}) => {
  // NOVO: Estados para controlar o input e o erro de validação
  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Efeito para limpar o estado do input sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setTicketInput('');
      setInputError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const hasTicketId = ticketId && ticketId.trim() !== '';

  // NOVO: Lógica de confirmação que valida o input antes de chamar onConfirm
  const handleConfirmClick = async () => {
    if (hasTicketId && ticketInput.trim() === '') {
      setInputError(`Por favor, digite o Ticket ID ('${ticketId}') para confirmar.`);
      return;
    }
    if (hasTicketId && ticketInput.trim() !== ticketId) {
        setInputError(`O Ticket ID digitado não corresponde.`);
        return;
    }
    
    // Se a validação passar (ou não for necessária), chama a função de confirmação
    setInputError(null);
    await onConfirm();
  };

  return (
    <div className='modal-overlay active' onClick={onClose}>
      <div
        className='modal-content discard-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className='modal-close-button'
          title='Fechar Modal'
          disabled={isDeleting}
        >
          &times;
        </button>
        <h2>
          <FiAlertTriangle style={{ color: 'var(--error-color)' }} /> Excluir
          Área do Cliente
        </h2>
        <p>
          Você tem certeza que deseja excluir permanentemente a área do cliente{' '}
          <strong>&quot;{itemName}&quot;</strong>?
        </p>

        {/* NOVO: Seção de confirmação do Ticket ID, baseada no DiscardConfirmationModal */}
        {hasTicketId && (
          <div className="ticket-confirmation">
            <p className="ticket-instruction">
              Para confirmar o <strong>DESCARTE PERMANENTE</strong> desta área e de sua respectiva pasta no Google Drive, digite o Ticket ID <strong>({ticketId})</strong> abaixo:
            </p>
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => {
                setTicketInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder={`Digite '${ticketId}'`}
              disabled={isDeleting}
              className={inputError ? 'input-error' : ''}
              autoFocus
            />
            {inputError && <p className="modal-input-error">{inputError}</p>}
          </div>
        )}

        <p>
          Esta ação removerá a pasta{' '}
          <strong>&quot;{folderName}&quot;</strong> do Google Drive e todos os
          seus registros associados no sistema.
        </p>
        <div className='modal-content warning-text' style={{ marginTop: '15px' }}>
          <strong>ESTA AÇÃO NÃO PODE SER DESFEITA.</strong>
        </div>

        <div className='modal-actions'>
          <button
            onClick={onClose}
            className='button-secondary'
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmClick} // Alterado para a nova função com validação
            className='button-danger'
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : <><FiTrash2 /> Excluir Permanentemente</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;