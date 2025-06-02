// src/components/shared/DeleteConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  itemName: string;
  folderName?: string;
  ticketId?: string;
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
  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Reset state when the modal is opened or the item changes
  useEffect(() => {
    if (isOpen) {
      setTicketInput('');
      setInputError(null);
    }
  }, [isOpen, itemName, ticketId]);

  if (!isOpen) {
    return null;
  }

  const hasTicketId = ticketId && ticketId.trim() !== '';
  const folderDisplayName = folderName || 'N/A';

  const handleConfirmClick = async () => {
    if (hasTicketId && ticketInput.trim() !== ticketId) {
      setInputError(`O Ticket ID digitado não corresponde ao da área ('${ticketId}').`);
      return;
    }
    
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
          <FiAlertTriangle style={{ color: 'var(--error-color)', marginRight: '8px' }} />
           Excluir Área do Cliente
        </h2>
        <p>
          Você tem certeza que deseja excluir permanentemente a área do cliente{' '}
          <strong>&quot;{itemName || 'Desconhecido'}&quot;</strong>?
        </p>

        {/* Section for Ticket ID confirmation */}
        {hasTicketId && (
          <div className="ticket-confirmation" style={{ marginTop: '15px', marginBottom: '15px' }}>
            <p className="ticket-instruction" style={{ fontSize: '0.9em' }}>
              Para confirmar a <strong>EXCLUSÃO PERMANENTE</strong>, por favor, digite o Ticket ID associado a esta área: <strong>&quot;{ticketId}&quot;</strong>
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
              className={`input-field ${inputError ? 'input-error' : ''}`}
              autoFocus
              style={{ marginTop: '5px', marginBottom: '5px', width: '100%', boxSizing: 'border-box' }}
            />
            {inputError && <p className="error-text modal-input-error" style={{ fontSize: '0.85em', marginTop: '5px' }}>{inputError}</p>}
          </div>
        )}
        
        {/* Updated and more accurate description of the action */}
        <div style={{ fontSize: '0.9em', marginTop: '15px', lineHeight: '1.5' }}>
            <p>Esta ação irá:</p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li>Remover a pasta <strong>&quot;{folderDisplayName}&quot;</strong> do Google Drive.</li>
                <li>Excluir o registro desta área de upload do sistema.</li>
            </ul>
            <p><strong>Atenção:</strong> Backups já restaurados (.fdb) e seus aliases não serão removidos por esta ação. Eles devem ser descartados individualmente na tela "Bancos Restaurados".</p>
        </div>

        <div className='warning-text' style={{ marginTop: '15px', fontWeight: 'bold' }}>
          ESTA AÇÃO NÃO PODE SER DESFEITA.
        </div>

        <div className='modal-actions' style={{ marginTop: '25px' }}>
          <button
            onClick={onClose}
            className='button-secondary'
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmClick}
            className='button-danger'
            disabled={isDeleting || (hasTicketId && ticketInput.trim() !== ticketId) }
          >
            {isDeleting ? 'Excluindo...' : <><FiTrash2 style={{ marginRight: '5px' }} /> Excluir Permanentemente</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;