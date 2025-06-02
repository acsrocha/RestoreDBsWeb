// src/components/shared/DiscardConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import type { ProcessedDatabase } from '../../types/api'; 

interface DiscardConfirmationModalProps {
  isOpen: boolean;
  dbToDiscard: ProcessedDatabase | null;
  onClose: () => void;
  onConfirm: (confirmationTicket?: string) => Promise<void>; 
  isDiscarding: boolean; 
}

const DiscardConfirmationModal: React.FC<DiscardConfirmationModalProps> = ({
  isOpen,
  dbToDiscard,
  onClose,
  onConfirm,
  isDiscarding,
}) => {
  // PONTO DE LOG A
  console.log(
    `LOG DEBUG: [DiscardConfirmationModal] RENDERIZANDO. Props recebidas: isOpen=${isOpen}, dbToDiscard ID=${dbToDiscard?.id}, dbToDiscard Alias=${dbToDiscard?.restoredDbAlias}, isDiscarding=${isDiscarding}`
  );

  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && dbToDiscard) { 
      // PONTO DE LOG B
      console.log(
        "LOG DEBUG: [DiscardConfirmationModal] useEffect EXECUTADO porque isOpen é true E dbToDiscard existe. Limpando ticketInput e inputError."
      );
      setTicketInput('');
      setInputError(null);
    }
  }, [isOpen, dbToDiscard]);

  if (!isOpen) {
    // PONTO DE LOG C.1
    console.log(
      `LOG DEBUG: [DiscardConfirmationModal] RETORNANDO NULL porque !isOpen (${!isOpen})`
    );
    return null;
  }
  
  if (!dbToDiscard) {
    // PONTO DE LOG C.2
    console.log(
      `LOG DEBUG: [DiscardConfirmationModal] RETORNANDO NULL (ou loader) porque isOpen é true, MAS !dbToDiscard (${!dbToDiscard})`
    );
    // Mantendo a lógica de retornar um overlay com "Carregando..." se dbToDiscard for null mas isOpen for true
    return (
        <div className={`modal-overlay active`}> 
            <div className="modal-content discard-modal">
                <p>Carregando dados do banco...</p> 
            </div>
        </div>
    );
  }
  
  // PONTO DE LOG D
  console.log(
    "LOG DEBUG: [DiscardConfirmationModal] PASSOU DAS CONDIÇÕES DE SAÍDA. Modal deveria ser montado no DOM e visível. dbToDiscard.id:", 
    dbToDiscard.id
  );

  const hasOriginalTicket = dbToDiscard.uploadedByTicketID && dbToDiscard.uploadedByTicketID.trim() !== '';

  const handleConfirmClick = async () => {
    if (hasOriginalTicket && ticketInput.trim() === '') {
      setInputError(`Por favor, digite o Ticket ID ('${dbToDiscard.uploadedByTicketID}') para confirmar.`);
      return;
    }
    // Corrigido para usar dbToDiscard.uploadedByTicketID na segunda condição também
    if (hasOriginalTicket && ticketInput.trim() !== dbToDiscard.uploadedByTicketID) { 
        setInputError(`Ticket ID de confirmação ('${ticketInput.trim()}') não corresponde ao Ticket ID original ('${dbToDiscard.uploadedByTicketID}').`);
        return;
    }
    setInputError(null);
    await onConfirm(hasOriginalTicket ? ticketInput.trim() : undefined);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}> 
      <div className="modal-content discard-modal">
        <button className="modal-close-button" onClick={onClose} disabled={isDiscarding} aria-label="Fechar">
          &times;
        </button>
        <h2>Confirmar Descarte</h2>
        <p>
          Você está prestes a marcar o banco de dados{' '}
          <strong>"{dbToDiscard.restoredDbAlias}"</strong> (ID: {dbToDiscard.id}) para descarte.
        </p>
        {hasOriginalTicket && (
          <div className="ticket-confirmation">
            <p className="ticket-instruction">
              Este banco está associado ao Ticket ID original:{' '}
              <strong>"{dbToDiscard.uploadedByTicketID}"</strong>.
            </p>
            <p>
              Para confirmar o <strong>DESCARTE PERMANENTE</strong>, por favor, digite o Ticket ID
              original novamente abaixo:
            </p>
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => {
                setTicketInput(e.target.value);
                if (inputError) setInputError(null); 
              }}
              placeholder={`Digite '${dbToDiscard.uploadedByTicketID}'`}
              disabled={isDiscarding}
              className={inputError ? 'input-error' : ''}
              autoFocus
            />
            {inputError && <p className="error-text modal-input-error">{inputError}</p>}
          </div>
        )}
        <p className="warning-text">
          <strong>Atenção:&nbsp;</strong> Esta ação é irreversível.
        </p>
        <div className="modal-actions">
          <button onClick={onClose} className="button-secondary" disabled={isDiscarding}>
            Cancelar
          </button>
          <button onClick={handleConfirmClick} className="button-danger" disabled={isDiscarding}>
            {isDiscarding ? 'Descartando...' : 'Confirmar Descarte'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscardConfirmationModal;