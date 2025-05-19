// src/components/monitoring/FailedRestoresList.tsx
import React, { useState } from 'react';
import type { FailedRestoreItem } from '../../types/api';
// import { escapeHTML } from '../../utils/helpers'; // React já escapa
import { FiAlertOctagon } from 'react-icons/fi';

interface FailedRestoresListProps {
  errors: FailedRestoreItem[];
  isLoading: boolean;
}

const FailedRestoresList: React.FC<FailedRestoresListProps> = ({ errors, isLoading }) => {
  const [visibleErrorDetail, setVisibleErrorDetail] = useState<string | null>(null); // Usar uma chave única, como fullFilePath ou id

  const toggleErrorDetail = (errorKey: string) => {
    setVisibleErrorDetail(visibleErrorDetail === errorKey ? null : errorKey);
  };

  if (isLoading) {
    return (
      <div className="list-card errors-list-card" id="failedRestoresSection">
        <h2><span className="icon"><FiAlertOctagon /></span>Detalhes das Falhas</h2>
        <ul id="failedRestoresList" aria-live="polite">
          <li className="empty-list"><em>Carregando falhas...</em></li>
        </ul>
      </div>
    );
  }

  return (
    <div className="list-card errors-list-card" id="failedRestoresSection">
      <h2><span className="icon"><FiAlertOctagon /></span>Detalhes das Falhas</h2>
      <ul id="failedRestoresList" aria-live="polite">
        {errors && errors.length > 0 ? (
          errors.map((errorItem, index) => { // Adicionado index para o caso de não haver chave melhor
            const errorKey = errorItem.fullFilePath || errorItem.fileName || `error-${index}`;
            const errorTimestamp = errorItem.timestamp ? 
                                   new Date(errorItem.timestamp).toLocaleString('pt-BR', {
                                      dateStyle: 'short',
                                      timeStyle: 'medium',
                                    }) : 'N/A';
            return (
              <li
                key={errorKey} 
                className="failed-restore-item"
                title={`Clique para ver detalhes. Arquivo: ${errorItem.fileName}`}
                onClick={() => toggleErrorDetail(errorKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleErrorDetail(errorKey);}}
              >
                <div className="error-summary">
                  <span className="error-filename">{errorItem.fileName}</span>
                  <span className="error-timestamp">{errorTimestamp}</span>
                </div>
                {visibleErrorDetail === errorKey && (
                  // ID deve ser único e válido para HTML
                  <div className="error-details visible" id={`error-detail-${errorKey.replace(/[^a-zA-Z0-9_-]/g, '')}`}> 
                    <strong>Arquivo Original:</strong> {errorItem.fileName}<br />
                    <strong>Caminho Completo:</strong> {errorItem.fullFilePath}<br />
                    <strong>Ocorrência:</strong> {errorTimestamp}<br />
                    <strong>Mensagem:</strong><br />
                    <pre>{errorItem.errorMessage}</pre>
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <li className="empty-list"><em>Nenhuma falha registrada</em></li>
        )}
      </ul>
    </div>
  );
};

export default FailedRestoresList;