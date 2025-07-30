// src/components/shared/ClientAreaDetailsModal.tsx

import React from 'react';
import type { AdminClientUploadAreaDetail, ParsedNoteEntry } from '../../types/api';
import { parseNotesString } from '../../utils/helpers';
import {
  FiX, FiUser, FiMail, FiHash, FiFolder, FiLink, FiCalendar, 
  FiCheckSquare, FiFileText, FiBox, FiClock, FiList, FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { ARIA_ROLES } from '../../hooks/useA11y';
import './ClientAreaDetailsModal.css';

// Função para obter a classe do status (sem alterações)
const getStatusClassName = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('sucesso')) return 'status-badge status--success';
  if (lowerStatus.includes('falha') || lowerStatus.includes('problema')) return 'status-badge status--error';
  if (lowerStatus.includes('processamento') || lowerStatus.includes('download concluído')) return 'status-badge status--info';
  if (lowerStatus.includes('aguardando') || lowerStatus.includes('upload concluído')) return 'status-badge status--warning';
  if (lowerStatus.includes('arquivado')) return 'status-badge status--archived';
  return 'status-badge';
};

interface ClientAreaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientArea: AdminClientUploadAreaDetail | null;
}

const ClientAreaDetailsModal: React.FC<ClientAreaDetailsModalProps> = ({ isOpen, onClose, clientArea }) => {
  if (!isOpen || !clientArea) {
    return null;
  }
  
  const area = clientArea;

  const parsedNotes: ParsedNoteEntry[] = parseNotesString(area.upload_area_notes);

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



  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('sucesso')) {
      return <FiCheckCircle className="status-icon success" />;
    }
    return <FiAlertCircle className="status-icon warning" />;
  };

  return (
    <div 
      className="modal-overlay active" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="modal-content modal-details" 
        onClick={(e) => e.stopPropagation()}
        role={ARIA_ROLES.DIALOG}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <button 
          onClick={onClose} 
          className="modal-close-button" 
          title="Fechar Modal"
          aria-label="Fechar detalhes"
        >
          <FiX />
        </button>

        <header className="modal-details-header">
          <FiUser size={24} />
          <h2 id="modal-title">Detalhes da Área do Cliente</h2>
        </header>

        <div className="modal-body" id="modal-description">
          {/* Seção de Status */}
          <section className="details-section" aria-label="Status Atual">
            <h3><FiCheckSquare /> Status Atual</h3>
            <div className={getStatusClassName(area.upload_area_status)}>
              {getStatusIcon(area.upload_area_status)}
              <span>{area.upload_area_status}</span>
            </div>
          </section>

          {/* Seção de Informações do Cliente */}
          {(area.client_name || area.client_email || area.ticket_id) && (
            <section className="details-section" aria-label="Informações do Cliente">
              <h3><FiUser /> Informações do Cliente</h3>
              <dl className="details-grid-2col">
                {area.client_name && (
                  <div className="detail-item">
                    <dt><FiUser /> Nome do Cliente:</dt>
                    <dd>{area.client_name}</dd>
                  </div>
                )}
                {area.client_email && (
                  <div className="detail-item">
                    <dt><FiMail /> Email:</dt>
                    <dd>{area.client_email}</dd>
                  </div>
                )}
                {area.ticket_id && (
                  <div className="detail-item">
                    <dt><FiHash /> Ticket ID:</dt>
                    <dd>{area.ticket_id}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Seção do Google Drive */}
          <section className="details-section" aria-label="Detalhes da Área no Google Drive">
            <h3><FiFolder /> Detalhes da Área no Google Drive</h3>
            <dl className="details-grid-2col">
              {area.gdrive_folder_name && (
                <div className="detail-item">
                  <dt><FiFolder /> Nome da Pasta:</dt>
                  <dd>{area.gdrive_folder_name}</dd>
                </div>
              )}
              {area.gdrive_folder_url && (
                <div className="detail-item">
                  <dt><FiLink /> URL da Pasta:</dt>
                  <dd>
                    <a 
                      href={area.gdrive_folder_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="drive-link"
                    >
                      Abrir no Google Drive <FiLink />
                    </a>
                  </dd>
                </div>
              )}
              {area.area_creation_date && (
                <div className="detail-item">
                  <dt><FiCalendar /> Data de Criação:</dt>
                  <dd>{new Date(area.area_creation_date).toLocaleString('pt-BR')}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Seção de Notas */}
          <section className="details-section notes-section" aria-label="Notas Internas">
            <h3><FiFileText /> Notas Internas da Área</h3>
            {parsedNotes.length > 0 ? (
              <ul className="styled-notes-list">
                {parsedNotes.map((note, index) => (
                  <li key={`${note.timestamp}-${index}`} className="note-entry">
                    <div className="note-header">
                      <span className="note-timestamp" title={note.timestamp}>
                        {note.timestamp}
                      </span>
                      {note.source && (
                        <span className="note-source">({note.source})</span>
                      )}
                    </div>
                    <p className="note-message">{note.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data-message">
                <FiAlertCircle /> Nenhuma nota interna registrada.
              </p>
            )}
          </section>

          {/* Seção de Backups */}
          <section className="details-section" aria-label="Backups Processados">
            <h3><FiList /> Backups Processados Associados</h3>
            {area.processed_backups && area.processed_backups.length > 0 ? (
              <ul className="processed-backups-list">
                {area.processed_backups.map(backup => (
                  <li key={backup.pb_id} className="backup-item">
                    <div className="backup-detail-item">
                      <dt><FiBox /> Alias Restaurado:</dt>
                      <dd title={backup.pb_restored_alias}>{backup.pb_restored_alias}</dd>
                    </div>
                    <div className="backup-detail-item">
                      <dt><FiClock /> Data da Restauração:</dt>
                      <dd>
                        {backup.pb_restoration_date 
                          ? new Date(backup.pb_restoration_date).toLocaleString('pt-BR') 
                          : 'N/A'
                        }
                      </dd>
                    </div>
                    <div className="backup-detail-item">
                      <dt><FiFileText /> Nome Original:</dt>
                      <dd title={backup.pb_original_backup_filename}>
                        {backup.pb_original_backup_filename}
                      </dd>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data-message">
                <FiAlertCircle /> Nenhum backup processado associado a esta área.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientAreaDetailsModal;