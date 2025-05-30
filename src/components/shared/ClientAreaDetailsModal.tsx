// src/components/shared/ClientAreaDetailsModal.tsx
import React from 'react';
import type { AdminClientUploadAreaDetail } from '../../types/api';
import {
  FiX, FiUser, FiMail, FiHash, FiFolder, FiLink, FiCalendar, FiCheckSquare, FiFileText, FiBox, FiClock, FiList, FiAlertCircle
} from 'react-icons/fi';

// Reutiliza a mesma função da página principal para consistência de estilo
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
  area: AdminClientUploadAreaDetail | null;
}

const ClientAreaDetailsModal: React.FC<ClientAreaDetailsModalProps> = ({ isOpen, onClose, area }) => {
  if (!isOpen || !area) {
    return null;
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content modal-details" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button" title="Fechar Modal">
          <FiX />
        </button>

        <header className="modal-details-header">
          <FiUser size={24} />
          <h2>Detalhes da Área do Cliente</h2>
        </header>

        <div className="modal-details-body">
          {/* Seção de Informações do Cliente */}
          <section className="details-section">
            <h3>Informações do Cliente</h3>
            <div className="detail-item">
              <dt><FiUser /> Nome do Cliente:</dt>
              <dd>{area.client_name || 'N/A'}</dd>
            </div>
            <div className="detail-item">
              <dt><FiMail /> Email:</dt>
              <dd>{area.client_email || 'N/A'}</dd>
            </div>
            <div className="detail-item">
              <dt><FiHash /> Ticket ID:</dt>
              <dd>{area.ticket_id || 'N/A'}</dd>
            </div>
          </section>

          {/* Seção do Google Drive */}
          <section className="details-section">
            <h3>Detalhes da Área no Google Drive</h3>
            <div className="detail-item">
              <dt><FiFolder /> Nome da Pasta:</dt>
              <dd>{area.gdrive_folder_name || 'N/A'}</dd>
            </div>
            <div className="detail-item">
              <dt><FiLink /> URL da Pasta:</dt>
              <dd>
                {area.gdrive_folder_url ? (
                  <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer">
                    Abrir no Google Drive
                  </a>
                ) : 'N/A'}
              </dd>
            </div>
            <div className="detail-item">
              <dt><FiCalendar /> Data de Criação:</dt>
              <dd>{area.area_creation_date ? new Date(area.area_creation_date).toLocaleString('pt-BR') : 'N/A'}</dd>
            </div>
            <div className="detail-item">
              <dt><FiCheckSquare /> Status Atual:</dt>
              <dd>
                <span className={getStatusClassName(area.upload_area_status)}>
                  {area.upload_area_status || 'N/A'}
                </span>
              </dd>
            </div>
          </section>

          {/* Seção de Notas */}
          {area.upload_area_notes && (
            <section className="details-section">
              <h3><FiFileText /> Notas Internas da Área</h3>
              <div className="notes-box">
                {area.upload_area_notes}
              </div>
            </section>
          )}

          {/* Seção de Backups Processados */}
          <section className="details-section">
            <h3><FiList /> Backups Processados Associados</h3>
            {area.processed_backups && area.processed_backups.length > 0 ? (
              <ul className="processed-backups-list">
                {area.processed_backups.map(backup => (
                  <li key={backup.pb_id}>
                    <div className="backup-detail-item">
                      <dt><FiBox /> Alias Restaurado:</dt>
                      <dd>{backup.pb_restored_alias}</dd>
                    </div>
                    <div className="backup-detail-item">
                      <dt><FiClock /> Data da Restauração:</dt>
                      <dd>{backup.pb_restoration_date ? new Date(backup.pb_restoration_date).toLocaleString('pt-BR') : 'N/A'}</dd>
                    </div>
                     <div className="backup-detail-item">
                      <dt><FiFileText /> Nome Original:</dt>
                      <dd title={backup.pb_original_backup_filename}>{backup.pb_original_backup_filename}</dd>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data-message"><FiAlertCircle /> Nenhum backup processado associado a esta área.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientAreaDetailsModal;