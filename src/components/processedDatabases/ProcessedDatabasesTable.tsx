import React from 'react';
import type { ProcessedDatabase } from '../../types/api';
import { escapeHTML } from '../../utils/helpers';

interface ProcessedDatabasesTableProps {
  databases: ProcessedDatabase[];
  isLoading: boolean;
  onMarkForDiscard: (dbId: string) => void;
}

const ProcessedDatabasesTable: React.FC<ProcessedDatabasesTableProps> = ({ databases, isLoading, onMarkForDiscard }) => {
  if (isLoading) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome Original do Backup</th>
              <th>Alias Restaurado</th>
              <th>Data Restauração</th>
              <th>Status</th>
              <th>Data Fim Custódia</th>
              <th className="notes-column">Notas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={7} className="empty-list"><em>Carregando bancos processados...</em></td></tr>
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
            <th>Data Restauração</th>
            <th>Status</th>
            <th>Data Fim Custódia</th>
            <th className="notes-column">Notas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="processedDatabasesList">
          {databases.length === 0 ? (
            <tr><td colSpan={7} className="empty-list"><em>Nenhum banco de dados processado.</em></td></tr>
          ) : (
            databases.map(db => {
              const restorationDate = db.restorationTimestamp ? new Date(db.restorationTimestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
              const custodyEndDate = db.custodyEndDate ? new Date(db.custodyEndDate).toLocaleDateString('pt-BR') : 'N/A';
              const statusClass = db.status ? `status-${db.status.toLowerCase().replace(/\s+/g, '-')}` : 'status-desconhecido';
              const originalName = db.originalBackupFileName || (db.internalFileName ? `(Interno: ${db.internalFileName.split('_').slice(1).join('_') || db.internalFileName})` : 'N/A');
              const alias = db.restoredDbAlias || 'N/A';
              const notas = db.notasTecnico || ''; // Usando notasTecnico como no JS

              let actionsHtml;
              if (db.status && db.status.toLowerCase() === 'ativo') {
                actionsHtml = <button className="action-button discard-button" onClick={() => onMarkForDiscard(db.id)} title="Marcar para Descarte">Descartar</button>;
              } else if (db.status && db.status.toLowerCase() === 'marcadoparadescarte') { // Assumindo que este é o status usado
                actionsHtml = <span className="status-marked" title="Este banco já foi marcado para descarte futuro.">Marcado</span>;
              } else {
                actionsHtml = <span>-</span>;
              }

              return (
                <tr key={db.id}>
                  <td title={`Original: ${escapeHTML(db.originalBackupFileName)}\nInterno: ${escapeHTML(db.internalFileName || '')}`}>{escapeHTML(originalName)}</td>
                  <td title={escapeHTML(alias)}>{escapeHTML(alias)}</td>
                  <td>{restorationDate}</td>
                  <td className={statusClass}>{escapeHTML(db.status || 'Desconhecido')}</td>
                  <td>{custodyEndDate}</td>
                  <td className="notes-cell" title={escapeHTML(notas)}><div className="notes-content">{escapeHTML(notas)}</div></td>
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