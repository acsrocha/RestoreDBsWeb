// src/components/monitoring/FailedRestoresList.tsx
import React, { memo } from 'react';
import type { FailedRestoreItem } from '../../types/api';
// import { escapeHTML } from '../../utils/helpers'; // React já escapa
import { FiAlertOctagon } from 'react-icons/fi';
import { ARIA_ROLES, ARIA_LABELS } from '../../hooks/useA11y';

interface FailedRestoresListProps {
  errors: FailedRestoreItem[];
  isLoading: boolean;
}

const FailedRestoresList: React.FC<FailedRestoresListProps> = ({ errors, isLoading }) => {
  const listId = 'failed-restores-list';
  const headerId = 'failed-restores-header';

  const renderError = (error: FailedRestoreItem, index: number) => {
    const fileName = error.fileName || 'Arquivo desconhecido';
    const formattedTimestamp = typeof error.timestamp === 'string' 
      ? error.timestamp 
      : new Date(error.timestamp).toLocaleString('pt-BR');
    const errorItemId = `error-${index}`;
    const detailsId = `details-${index}`;
    
    return (
      <li 
        key={error.fullFilePath || `error-${index}`} 
        className="error-item"
        role={ARIA_ROLES.ALERT}
        aria-labelledby={errorItemId}
      >
        <div 
          className="error-header"
          id={errorItemId}
        >
          <span 
            className="error-file" 
            title={error.fullFilePath}
            aria-label={`Arquivo com erro: ${fileName}`}
          >
            {fileName}
          </span>
          <span 
            className="error-time"
            aria-label={`Ocorrido em ${formattedTimestamp}`}
          >
            {formattedTimestamp}
          </span>
        </div>
        <div 
          className="error-message"
          aria-label="Mensagem de erro"
        >
          {error.errorMessage}
        </div>
        {error.details && (
          <div className="error-details">
            <details>
              <summary 
                id={detailsId}
                aria-expanded="false"
                role={ARIA_ROLES.BUTTON}
                tabIndex={0}
              >
                Detalhes adicionais
              </summary>
              <pre 
                aria-labelledby={detailsId}
                role="region"
              >
                {error.details}
              </pre>
            </details>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <h2 id={headerId}>
        <FiAlertOctagon className="section-icon" />
        Falhas na Restauração
        <span className="count-badge error">{errors.length}</span>
      </h2>
      <ul 
        id={listId}
        role={ARIA_ROLES.LIST}
        aria-busy={isLoading}
        aria-live="assertive"
      >
        {isLoading ? (
          <li 
            className="empty-list"
            role={ARIA_ROLES.LISTITEM}
            aria-label={ARIA_LABELS.LOADING}
          >
            <em>Carregando falhas...</em>
          </li>
        ) : errors.length > 0 ? (
          errors.filter(error => error && typeof error === 'object').map(renderError)
        ) : (
          <li 
            className="empty-list"
            role={ARIA_ROLES.LISTITEM}
            aria-label="Nenhuma falha registrada"
          >
            <em>Nenhuma falha registrada</em>
          </li>
        )}
      </ul>
    </>
  );
};

// Memoize o componente para evitar re-renderizações desnecessárias
export default memo(FailedRestoresList);