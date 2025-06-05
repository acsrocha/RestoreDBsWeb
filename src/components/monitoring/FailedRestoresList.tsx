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
    const fileName = error.filePath.split(/[\\/]/).pop();
    const errorItemId = `error-${index}`;
    const detailsId = `details-${index}`;
    
    return (
      <li 
        key={error.filePath} 
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
            title={error.filePath}
            aria-label={`Arquivo com erro: ${fileName}`}
          >
            {fileName}
          </span>
          <span 
            className="error-time"
            aria-label={`Ocorrido em ${error.timestamp}`}
          >
            {error.timestamp}
          </span>
        </div>
        <div 
          className="error-message"
          aria-label="Mensagem de erro"
        >
          {error.error}
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
    <div 
      className="list-card error-list" 
      role={ARIA_ROLES.REGION}
      aria-labelledby={headerId}
    >
      <h2 id={headerId}>
        <span className="icon" aria-hidden="true">
          <FiAlertOctagon />
        </span>
        Falhas na Restauração
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
          errors.map(renderError)
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
    </div>
  );
};

// Memoize o componente para evitar re-renderizações desnecessárias
export default memo(FailedRestoresList);