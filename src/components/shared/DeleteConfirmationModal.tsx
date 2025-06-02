// src/components/shared/DeleteConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import type { AdminClientUploadAreaDetail } from '../../types/api'; // Importe o tipo correto se necessário

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // Confirmar se vai receber algum parâmetro (como o checkbox)
  isDeleting: boolean;
  itemName: string;      // Ex: Nome do cliente
  folderName?: string;    // Ex: Nome da pasta no Google Drive
  ticketId?: string;      // Ticket ID associado à área
  // Adicione aqui a prop para o checkbox de exclusão em cascata se necessário
  // onCascadeDeleteChange?: (shouldCascade: boolean) => void;
  // shouldCascadeDelete?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
  folderName,
  ticketId,
  // onCascadeDeleteChange,
  // shouldCascadeDelete
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  // const [internalShouldCascade, setInternalShouldCascade] = useState(shouldCascadeDelete || false);


  // Limpa o input e o erro quando o modal é aberto ou o item a ser deletado muda
  useEffect(() => {
    if (isOpen) {
      console.log(`LOG DEBUG: [DeleteConfirmationModal] RENDERIZANDO. Props: isOpen=${isOpen}, itemName=${itemName}, ticketId=${ticketId}`);
      setTicketInput('');
      setInputError(null);
      // if (shouldCascadeDelete !== undefined) {
      //   setInternalShouldCascade(shouldCascadeDelete);
      // }
    }
  }, [isOpen, itemName, ticketId /*, shouldCascadeDelete */]);

  if (!isOpen) {
    console.log("LOG DEBUG: [DeleteConfirmationModal] RETORNANDO NULL porque !isOpen");
    return null;
  }
  
  // Se itemName (essencial para o modal) não estiver presente quando isOpen for true,
  // pode ser um sinal de que os dados da área ainda não foram totalmente carregados no estado pai.
  // No entanto, a lógica com useEffect na página pai deve mitigar isso.
  // Adicionamos um log para observar.
  if (!itemName && isOpen) {
      console.warn("LOG DEBUG WARN: [DeleteConfirmationModal] isOpen é true, mas itemName é nulo/vazio.");
  }


  const hasTicketId = ticketId && ticketId.trim() !== '';

  const handleConfirmClick = async () => {
    if (hasTicketId && ticketInput.trim() !== ticketId) {
      setInputError(`O Ticket ID digitado não corresponde ao da área ('${ticketId}').`);
      return;
    }
    
    setInputError(null);
    // Se onCascadeDeleteChange foi passado, significa que a lógica de cascata está ativa
    // if (onCascadeDeleteChange) {
    //   onCascadeDeleteChange(internalShouldCascade);
    // }
    await onConfirm();
  };

  const folderDisplayName = folderName || 'N/A';

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

        {hasTicketId && (
          <div className="ticket-confirmation" style={{ marginTop: '15px', marginBottom: '15px' }}>
            <p className="ticket-instruction" style={{ fontSize: '0.9em' }}>
              Esta área está associada ao Ticket ID: <strong>&quot;{ticketId}&quot;</strong>.
            </p>
            <p style={{ fontSize: '0.9em' }}>
              Para confirmar a <strong>EXCLUSÃO PERMANENTE</strong>, por favor, digite o Ticket ID novamente abaixo:
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

        <div style={{ fontSize: '0.9em', marginTop: hasTicketId ? '0px' : '15px' }}>
            <p>Esta ação irá:</p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li>Remover a pasta <strong>&quot;{folderDisplayName}&quot;</strong> do Google Drive.</li>
                <li>Excluir o registro desta área de upload do sistema.</li>
            </ul>
            <p><strong>Atenção:</strong> Backups já restaurados (.fdb) e seus aliases não serão removidos por esta ação. Eles devem ser descartados individualmente na tela "Bancos Restaurados".</p>
        </div>

        {/* // SEÇÃO PARA O CHECKBOX DE EXCLUSÃO EM CASCATA (a ser implementada depois)
          {onCascadeDeleteChange && (
            <div style={{ marginTop: '15px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-small)' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9em' }}>
                <input 
                  type="checkbox" 
                  checked={internalShouldCascade}
                  onChange={(e) => setInternalShouldCascade(e.target.checked)}
                  disabled={isDeleting}
                  style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                />
                Também descartar permanentemente todos os bancos de dados restaurados (FDBs e Aliases) associados a esta área.
              </label>
            </div>
          )}
        */}

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