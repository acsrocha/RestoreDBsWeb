// src/components/processedDatabases/ProcessedDatabasesTable.tsx
import React from 'react';
import type { ProcessedDatabase } from '../../types/api';
import { escapeHTML } from '../../utils/helpers'; 

interface ProcessedDatabasesTableProps {
  databases: ProcessedDatabase[];
  isLoading: boolean;
  onMarkForDiscard: (dbId: string) => void;
}

const ProcessedDatabasesTable: React.FC<ProcessedDatabasesTableProps> = ({
  databases,
  isLoading,
  onMarkForDiscard,
}) => {
  // Contagem de colunas visíveis (após remover "Notas Upload")
  const columnCount = 7; 

  if (isLoading) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome Original do Backup</th>
              <th>Alias Restaurado</th>
              <th>Ticket ID Original</th>
              <th>Data Restauração</th>
              <th>Status</th>
              <th>Data Fim Custódia</th>
              {/* <th className="notes-column">Notas Upload</th> // Confirmado como comentado/removido */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* --- AJUSTADO colSpan --- */}
              <td colSpan={columnCount} className="empty-list"> 
                <em>Carregando bancos processados...</em>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table id="processedDatabasesTable" className="data-table">
        <thead>
          <tr>
            <th>Nome Original do Backup</th>
            <th>Alias Restaurado</th>
            <th>Ticket ID Original</th>
            <th>Data Restauração</th>
            <th>Status</th>
            <th>Data Fim Custódia</th>
            {/* <th className="notes-column">Notas Upload</th> // Confirmado como comentado/removido */}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="processedDatabasesList">
          {databases.length === 0 ? (
            <tr>
              {/* --- AJUSTADO colSpan --- */}
              <td colSpan={columnCount} className="empty-list"> 
                <em>Nenhum banco de dados processado.</em>
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
              const statusClass = db.status
                ? `status-${db.status.toLowerCase().replace(/\s+/g, '-')}`
                : 'status-desconhecido';
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
              // const notasUpload = db.uploadNotas || ''; // Variável não é mais necessária para exibição

              let actionsHtml;
              if (db.status && db.status.toLowerCase() === 'ativo') {
                actionsHtml = (
                  <button
                    className="action-button discard-button"
                    onClick={() => onMarkForDiscard(db.id)}
                    title="Marcar para Descarte"
                  >
                    Descartar
                  </button>
                );
              } else if (
                db.status &&
                (db.status.toLowerCase() === 'marcadoparadescarte' ||
                  db.status.toLowerCase() === 'descartado')
              ) {
                actionsHtml = (
                  <span
                    className={`status-marked ${statusClass}`}
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
                    title={`Original: ${escapeHTML(
                      db.originalBackupFileName || ''
                    )}\nInterno: ${escapeHTML(db.internalFileName || '')}`}
                  >
                    {escapeHTML(originalName)}
                  </td>
                  <td title={escapeHTML(alias)}>{escapeHTML(alias)}</td>
                  <td>{escapeHTML(originalTicketIdDisplay)}</td>
                  <td>{restorationDate}</td>
                  <td className={statusClass}>
                    {escapeHTML(db.status || 'Desconhecido')}
                  </td>
                  <td>{custodyEndDate}</td>
                  {/* --- REMOVIDA a célula <td> para Notas Upload --- */}
                  {/* <td className="notes-cell" title={notasUpload}>
                    <div className="notes-content">{notasUpload}</div>
                  </td> 
                  */}
                  <td>{actionsHtml}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessedDatabasesTable;