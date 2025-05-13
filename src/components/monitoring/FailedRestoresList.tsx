// src/components/monitoring/FailedRestoresList.tsx
import React, { useState } from 'react';
import type { FailedRestoreItem } from '../../types/api'; // Ou FailedRestore, conforme seu tipo
import { escapeHTML } from '../../utils/helpers';
import { FiAlertOctagon } from 'react-icons/fi'; // <<< Adicionar importação do ícone

interface FailedRestoresListProps {
  errors: FailedRestoreItem[]; // Ou FailedRestore
  isLoading: boolean;
}

const FailedRestoresList: React.FC<FailedRestoresListProps> = ({ errors, isLoading }) => {
  const [visibleErrorDetail, setVisibleErrorDetail] = useState<number | null>(null);

  const toggleErrorDetail = (index: number) => {
    setVisibleErrorDetail(visibleErrorDetail === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="list-card errors-list-card" id="failedRestoresSection">
        <h2><span className="icon"><FiAlertOctagon /></span>Detalhes das Falhas</h2> {/* Ícone adicionado */}
        <ul id="failedRestoresList" aria-live="polite">
          <li className="empty-list"><em>Carregando falhas...</em></li>
        </ul>
      </div>
    );
  }

  return (
    <div className="list-card errors-list-card" id="failedRestoresSection">
      <h2><span className="icon"><FiAlertOctagon /></span>Detalhes das Falhas</h2> {/* Ícone adicionado */}
      <ul id="failedRestoresList" aria-live="polite">
        {errors.length > 0 ? (
          errors.map((errorItem, index) => {
            const errorTimestamp = new Date(errorItem.timestamp).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'medium',
            });
            return (
              <li
                key={errorItem.fullFilePath || index} // Usar uma chave mais estável se possível
                className="failed-restore-item"
                title={`Clique para ver detalhes. Arquivo: ${escapeHTML(errorItem.fileName)}`}
                onClick={() => toggleErrorDetail(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleErrorDetail(index);}}
              >
                <div className="error-summary">
                  <span className="error-filename">{escapeHTML(errorItem.fileName)}</span>
                  <span className="error-timestamp">{errorTimestamp}</span>
                </div>
                {visibleErrorDetail === index && (
                  <div className="error-details visible" id={`error-detail-${index}`}>
                    <strong>Arquivo Original:</strong> {escapeHTML(errorItem.fileName)}<br />
                    <strong>Caminho Completo:</strong> {escapeHTML(errorItem.fullFilePath)}<br />
                    <strong>Ocorrência:</strong> {errorTimestamp}<br />
                    <strong>Mensagem:</strong><br />
                    <pre>{escapeHTML(errorItem.errorMessage)}</pre>
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