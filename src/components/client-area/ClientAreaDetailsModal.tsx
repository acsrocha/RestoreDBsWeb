import React from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { ARIA_ROLES } from '../../hooks/useA11y';
import './ClientAreaDetailsModal.css';

interface ClientAreaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    ticketId: string;
    drivePath: string;
    status: string;
    date: string;
    notes: Array<{
      timestamp: string;
      message: string;
      source: string;
    }>;
  };
}

const ClientAreaDetailsModal: React.FC<ClientAreaDetailsModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase().includes('sucesso')) {
      return <FiCheckCircle className="status-icon success" />;
    }
    return <FiAlertCircle className="status-icon warning" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return timestamp.replace('T', ' ').split('.')[0];
  };

  // Fecha o modal quando pressiona ESC
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Previne o scroll do body quando o modal está aberto
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="modal-content"
        role={ARIA_ROLES.DIALOG}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onClick={e => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modal-title">Detalhes da Área do Cliente</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <FiX />
          </button>
        </header>

        <div className="modal-body" id="modal-description">
          <section className="status-section" aria-label="Status Atual">
            <h3>STATUS ATUAL:</h3>
            <div className="status-badge">
              {getStatusIcon(data.status)}
              <span>{data.status}</span>
            </div>
          </section>

          <section className="details-section" aria-label="Informações da Área">
            <div className="detail-row">
              <span className="label">Ticket ID:</span>
              <span className="value">{data.ticketId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Pasta no Drive:</span>
              <span className="value">{data.drivePath}</span>
            </div>
            <div className="detail-row">
              <span className="label">Data Criação:</span>
              <span className="value">{data.date}</span>
            </div>
          </section>

          <section className="notes-section" aria-label="Notas Internas">
            <h3>Notas Internas da Área</h3>
            <div className="notes-list">
              {data.notes.map((note, index) => (
                <div 
                  key={`${note.timestamp}-${index}`}
                  className="note-item"
                >
                  <div className="note-header">
                    <span className="note-timestamp">
                      {formatTimestamp(note.timestamp)}
                    </span>
                    <span className="note-source">
                      ({note.source})
                    </span>
                  </div>
                  <p className="note-message">{note.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientAreaDetailsModal; 