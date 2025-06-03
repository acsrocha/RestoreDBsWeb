// src/components/shared/DeleteConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2, FiInfo } from 'react-icons/fi'; // Adicionado FiInfo

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; 
  isDeleting: boolean;
  itemName: string;      
  folderName?: string;    
  ticketId?: string;      
  shouldCascadeDelete: boolean;
  onCascadeDeleteChange: (shouldCascade: boolean) => void;
  canCascadeDelete: boolean; // << NOVA PROP: Indica se a opção de cascata deve estar habilitada
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
  folderName,
  ticketId,
  shouldCascadeDelete,
  onCascadeDeleteChange,
  canCascadeDelete, // << NOVA PROP >>
}) => {
  console.log(
    `LOG DEBUG: [DeleteConfirmationModal] RENDERIZANDO. Props: isOpen=${isOpen}, itemName=${itemName}, canCascadeDelete=${canCascadeDelete}, shouldCascadeDelete=${shouldCascadeDelete}`
  );

  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTicketInput('');
      setInputError(null);
      // Se não puder cascatear, garante que o checkbox esteja desmarcado internamente no modal,
      // embora o controle principal seja da página pai.
      if (!canCascadeDelete && shouldCascadeDelete) {
        onCascadeDeleteChange(false);
      }
    }
  }, [isOpen, itemName, ticketId, canCascadeDelete, shouldCascadeDelete, onCascadeDeleteChange]);

  if (!isOpen) {
    return null;
  }
  
  if (!itemName && isOpen) { // Adicionado para depuração, caso o item não chegue
      console.warn(`LOG DEBUG WARN: [DeleteConfirmationModal] Props: isOpen=${isOpen}, MAS itemName é nulo ou vazio!`);
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
        
        <div className="modal-scrollable-content"> 
          <p style={{ marginBottom: '15px' }}>
            Excluir a área do cliente <strong>&quot;{itemName || 'Desconhecido'}&quot;</strong> removerá a pasta 
            <strong> &quot;{folderDisplayName}&quot;</strong> do Google Drive e o registro desta área no sistema.
          </p>

          {hasTicketId && (
            <div className="ticket-confirmation" style={{ marginTop: '0px', marginBottom: '20px' }}>
              <p className="ticket-instruction" style={{ fontSize: '0.9em', marginBottom: '8px' }}>
                Esta área está associada ao Ticket ID: <strong>&quot;{ticketId}&quot;</strong>. Para confirmar a exclusão, digite-o abaixo:
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
                autoFocus={!hasTicketId}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {inputError && <p className="error-text modal-input-error" style={{ fontSize: '0.85em', marginTop: '5px' }}>{inputError}</p>}
            </div>
          )}
          
          <div style={{ 
            padding: '12px', 
            border: `1px solid ${canCascadeDelete ? 'var(--border-color)' : 'rgba(var(--text-secondary-color-rgb), 0.3)'}`, // Borda mais sutil se desabilitado
            borderRadius: 'var(--border-radius-small)',
            backgroundColor: canCascadeDelete ? 'var(--bg-color)' : 'rgba(var(--text-secondary-color-rgb), 0.05)', // Fundo sutil se desabilitado
            marginTop: hasTicketId ? '0px' : '15px',
            marginBottom: '20px',
            opacity: canCascadeDelete ? 1 : 0.7, // Opacidade se desabilitado
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: canCascadeDelete ? 'pointer' : 'not-allowed', fontSize: '0.9em', userSelect: 'none', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={shouldCascadeDelete}
                onChange={(e) => onCascadeDeleteChange(e.target.checked)}
                disabled={isDeleting || !canCascadeDelete} // << DESABILITADO SE NÃO PUDER CASCATEAR >>
                style={{ marginTop: '3px', transform: 'scale(1.2)', cursor: canCascadeDelete ? 'pointer' : 'not-allowed', flexShrink: 0 }}
              />
              <div>
                <span style={{ fontWeight: 500, display: 'block', lineHeight: '1.3', color: canCascadeDelete ? 'var(--text-color)' : 'var(--text-secondary-color)' }}>
                  Descartar também todos os bancos de dados (FDBs e Aliases) desta área.
                </span>
                <p style={{fontSize: '0.82em', color: 'var(--text-secondary-color)', marginTop: '5px', lineHeight: '1.35' }}>
                  {canCascadeDelete ? (
                    <>
                      <strong>Atenção:</strong> Esta opção adicional é <strong style={{color: 'var(--error-color)'}}>altamente destrutiva</strong>. O Ticket ID da Área (<strong>{ticketId || 'N/A'}</strong>) será usado para confirmar cada descarte de banco.
                    </>
                  ) : (
                    <>
                      <FiInfo style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                      Nenhum banco de dados 'Ativo' encontrado associado a esta área para descarte em cascata.
                    </>
                  )}
                </p>
              </div>
            </label>
          </div>
          
          <div className='warning-text' style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.95em' }}>
            LEMBRE-SE: A EXCLUSÃO É IRREVERSÍVEL.
          </div>
        </div>

        <div className='modal-actions' style={{ marginTop: 'auto', paddingTop: '20px' }}>
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