// src/components/processedDatabases/ProcessedDatabasesTable.tsx
import React from 'react';
import type { ProcessedDatabase } from '../../types/api'; // Certifique-se que este tipo inclui uploadedByTicketID
import { escapeHTML } from '../../utils/helpers'; // Assumindo que você tem esta função auxiliar

interface ProcessedDatabasesTableProps {
  databases: ProcessedDatabase[];
  isLoading: boolean;
  // Atualizada para receber o originalTicketId (pode ser undefined ou string vazia)
  onMarkForDiscard: (dbId: string) => void;
}

const ProcessedDatabasesTable: React.FC<ProcessedDatabasesTableProps> = ({
  databases,
  isLoading,
  onMarkForDiscard,
}) => {
  if (isLoading) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome Original do Backup</th>
              <th>Alias Restaurado</th>
              <th>Ticket ID Original</th> {/* Nova coluna */}
              <th>Data Restauração</th>
              <th>Status</th>
              <th>Data Fim Custódia</th>
              <th className="notes-column">Notas Upload</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="empty-list"> {/* Ajustado colSpan */}
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
            <th>Ticket ID Original</th> {/* Nova coluna */}
            <th>Data Restauração</th>
            <th>Status</th>
            <th>Data Fim Custódia</th>
            <th className="notes-column">Notas Upload</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="processedDatabasesList">
          {databases.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-list"> {/* Ajustado colSpan */}
                <em>Nenhum banco de dados processado.</em>
              </td>
            </tr>
          ) : (
            databases.map((db) => { // Adicionado parênteses ao redor de db para clareza
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
              const originalTicketIdDisplay = db.uploadedByTicketID || '-'; // Para exibição na tabela
              const notasUpload = db.uploadNotas || ''; // Notas do upload original

              let actionsHtml;
              if (db.status && db.status.toLowerCase() === 'ativo') {
                actionsHtml = (
                  <button
                    className="action-button discard-button"
                    onClick={() => onMarkForDiscard(db.id)} // Passa o ticket original
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
                    {db.status}
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
                  <td>{escapeHTML(originalTicketIdDisplay)}</td> {/* Exibe o Ticket ID */}
                  <td>{restorationDate}</td>
                  <td className={statusClass}>
                    {escapeHTML(db.status || 'Desconhecido')}
                  </td>
                  <td>{custodyEndDate}</td>
                  <td className="notes-cell" title={notasUpload}>
                    <div className="notes-content">{notasUpload}</div>
                  </td>
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