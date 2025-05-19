// src/components/shared/DiscardConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import type { ProcessedDatabase } from '../../types/api'; // Ajuste o caminho se necessário

interface DiscardConfirmationModalProps {
  isOpen: boolean;
  dbToDiscard: ProcessedDatabase | null;
  onClose: () => void;
  onConfirm: (confirmationTicket?: string) => Promise<void>; // Tornar async para lidar com loading
  isDiscarding: boolean; // Para feedback de carregamento
}

const DiscardConfirmationModal: React.FC<DiscardConfirmationModalProps> = ({
  isOpen,
  dbToDiscard,
  onClose,
  onConfirm,
  isDiscarding,
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // LOG E: Verifica as props recebidas pelo modal toda vez que ele tenta renderizar
  // // console.log('[Modal Render] Props: isOpen:', isOpen, 'dbToDiscard:', dbToDiscard ? dbToDiscard.id : null, 'isDiscarding:', isDiscarding);

  useEffect(() => {
    // Limpar input e erro quando o modal é reaberto para um novo DB
    if (isOpen) {
      // console.log('[Modal useEffect] Modal aberto, limpando ticketInput e inputError.'); // Log adicional no useEffect
      setTicketInput('');
      setInputError(null);
    }
  }, [isOpen, dbToDiscard]);

  if (!isOpen || !dbToDiscard) {
    // LOG F: Indica por que o modal está retornando null (não renderizando sua UI)
    // console.log('[Modal Render] Retornando null. Causa: isOpen é', isOpen, 'E/OU dbToDiscard é', dbToDiscard ? 'válido' : 'null');
    return null;
  }

  const hasOriginalTicket = dbToDiscard.uploadedByTicketID && dbToDiscard.uploadedByTicketID.trim() !== '';

  const handleConfirmClick = async () => {
    // console.log('[Modal handleConfirmClick] Iniciado.'); // Log no início do clique de confirmação
    if (hasOriginalTicket && ticketInput.trim() === '') {
      setInputError(`Por favor, digite o Ticket ID ('${dbToDiscard.uploadedByTicketID}') para confirmar.`);
      // console.log('[Modal handleConfirmClick] Erro: Ticket ID necessário não fornecido.');
      return;
    }
    if (hasOriginalTicket && ticketInput.trim() !== dbToDiscard.uploadedByTicketID) {
        setInputError(`Ticket ID de confirmação ('${ticketInput.trim()}') não corresponde ao Ticket ID original ('${dbToDiscard.uploadedByTicketID}').`);
        // console.log('[Modal handleConfirmClick] Erro: Ticket ID não corresponde.');
        return;
    }
    setInputError(null);
    // console.log('[Modal handleConfirmClick] Chamando onConfirm com ticket:', hasOriginalTicket ? ticketInput.trim() : undefined);
    await onConfirm(hasOriginalTicket ? ticketInput.trim() : undefined);
    // console.log('[Modal handleConfirmClick] onConfirm finalizado.');
  };

  // LOG G: Se chegou aqui, o modal deveria estar renderizando sua UI
  // console.log('[Modal Render] Modal deveria estar visível agora. dbToDiscard.id:', dbToDiscard.id);


  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}> {/* Adicionada classe 'active' */}
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
                if (inputError) setInputError(null); // Limpa erro ao digitar
              }}
              placeholder={`Digite '${dbToDiscard.uploadedByTicketID}'`}
              disabled={isDiscarding}
              className={inputError ? 'input-error' : ''}
            />
            {inputError && <p className="error-text modal-input-error">{inputError}</p>}
          </div>
        )}
        <p className="warning-text">
          <strong>Atenção:</strong> Esta ação é irreversível.
        </p>
        {/* Espaço para mensagem de erro da API, se o onConfirm falhar e você quiser mostrar no modal */}
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