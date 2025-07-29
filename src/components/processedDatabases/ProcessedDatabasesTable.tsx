// src/components/processedDatabases/ProcessedDatabasesTable.tsx
import React from 'react';
import type { ProcessedDatabase } from '../../types/api';
import { escapeHTML } from '../../utils/helpers'; 
import { FiTrash2 } from 'react-icons/fi';

interface ProcessedDatabasesTableProps {
  databases: ProcessedDatabase[];
  isLoading: boolean;
  onMarkForDiscard: (dbId: string) => void;
  getStatusClassName: (status?: string) => string;
}

const ProcessedDatabasesTable: React.FC<ProcessedDatabasesTableProps> = ({
  databases,
  isLoading,
  onMarkForDiscard,
  getStatusClassName,
}) => {
  const columnCount = 7; 

  if (isLoading) { 
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome Original do Backup</th>
            <th>Alias Restaurado</th>
            <th>Ticket ID Original</th>
            <th>Data Restauração</th>
            <th>Status</th>
            <th>Data Fim Custódia</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columnCount} className="empty-list loading-text">
              <em>Carregando...</em>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table id="processedDatabasesTable" className="data-table">
      <thead>
        <tr>
          <th>Nome Original do Backup</th>
          <th>Alias Restaurado</th>
          <th>Ticket ID Original</th>
          <th>Data Restauração</th>
          <th>Status</th>
          <th>Data Fim Custódia</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="processedDatabasesList">
        {databases.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className="empty-list">
              <em>Nenhum banco de dados para exibir.</em>
            </td>
          </tr>
        ) : (
          databases.map((db) => {
            const restorationDate = db.restorationTimestamp
              ? new Date(db.restorationTimestamp).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : 'N/A';
            const custodyEndDate = db.custodyEndDate
              ? new Date(db.custodyEndDate).toLocaleDateString('pt-BR')
              : 'N/A';
            
            const statusDisplayClasses = getStatusClassName(db.status);

            // Verificar se foi processado via arquivo .bt
            const isBTFile = db.notes && db.notes.includes('Processado via arquivo .bt');
            const originalName =
              db.originalBackupFileName ||
              (db.internalFileName
                ? `(Interno: ${
                    db.internalFileName.split('_').slice(1).join('_') ||
                    db.internalFileName
                  })`
                : 'N/A');
            const alias = db.restoredDbAlias || 'N/A';
            const originalTicketIdDisplay = db.uploadedByTicketID || '-';

            let actionsHtml;
            if (db.status && db.status.toLowerCase() === 'ativo') {
              actionsHtml = (
                <button
                  className="action-btn-icon delete" 
                  style={{ // Estilos inline temporários para garantir que seja clicável durante o debug
                    padding: '8px', 
                    cursor: 'pointer',
                    border: '1px solid transparent', // Borda transparente (ou remova se não precisar de borda visível)
                    display: 'inline-flex', 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    // Delete icon clicked
                    onMarkForDiscard(db.id); 
                  }}
                  title="Marcar para Descarte"
                >
                  <FiTrash2 size={16} />
                </button>
              );
            } else if (
              db.status &&
              (db.status.toLowerCase() === 'marcadoparadescarte' ||
                db.status.toLowerCase() === 'descartado')
            ) {
              actionsHtml = (
                <span
                  className={statusDisplayClasses}
                  title={`Este banco está ${db.status.toLowerCase()}.`}
                >
                  {escapeHTML(db.status)}
                </span>
              );
            } else {
              actionsHtml = <span>-</span>;
            }

            return (
              <tr key={db.id}>
                <td
                  className="truncate" 
                  title={`Original: ${escapeHTML(db.originalBackupFileName || '')}\nInterno: ${escapeHTML(db.internalFileName || '')}${isBTFile ? '\nProcessado via arquivo .bt' : ''}`}
                >
                  {escapeHTML(originalName)}
                  {isBTFile && <span className="bt-indicator" title="Processado via arquivo .bt"> 🔧</span>}
                </td>
                <td className="truncate" title={escapeHTML(alias)}>{escapeHTML(alias)}</td>
                <td>{escapeHTML(originalTicketIdDisplay)}</td>
                <td>{restorationDate}</td>
                <td className="status-cell">
                  <span className={statusDisplayClasses}>
                    {escapeHTML(db.status || 'Desconhecido')}
                  </span>
                </td>
                <td>{custodyEndDate}</td>
                <td className="actions-cell">
                   {actionsHtml}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export default ProcessedDatabasesTable;