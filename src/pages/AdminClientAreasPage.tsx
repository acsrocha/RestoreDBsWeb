// src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { fetchAdminClientUploadAreaDetails, updateClientUploadAreaStatus } from '../services/api'; // Ajuste o caminho
import type { AdminClientUploadAreaDetail } from '../types/api'; // Ajuste o caminho
import { FiEdit, FiExternalLink, FiXCircle, FiCheckCircle } from 'react-icons/fi'; // Ícones

// Estilos básicos para o modal (podem ser movidos para um arquivo CSS)
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--card-bg-color)', // Usando variável do seu global.css
  color: 'var(--text-color)', // Usando variável
  padding: '25px 30px',
  borderRadius: 'var(--border-radius-medium)', // Usando variável
  boxShadow: 'var(--shadow), 0 8px 30px rgba(0, 0, 0, 0.15)', // Usando variável
  width: '100%',
  maxWidth: '450px',
  position: 'relative',
  border: '1px solid var(--border-color)', // Usando variável
};

const statusOptions = [
  "Aguardando Upload Cliente",
  "Upload Concluído pelo Cliente",
  "Backup Recebido - Pendente Download",
  "Download Concluído pelo Suporte",
  "Backup em Processamento",
  "Backup Processado - Sucesso",
  "Backup Processado - Falha",
  "Problema no Upload - Contatar Cliente",
  "Arquivado",
];


const AdminClientAreasPage: React.FC = () => {
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o modal de atualização de status
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentAreaToEdit, setCurrentAreaToEdit] = useState<AdminClientUploadAreaDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminClientUploadAreaDetails();
      setAreas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.');
      console.error("Erro ao buscar dados das áreas de cliente:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenUpdateStatusModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaToEdit(area);
    setNewStatus(area.upload_area_status); // Pré-popula com o status atual
    setUpdateError(null);
    setUpdateSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAreaToEdit(null);
    setNewStatus('');
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleSubmitStatusUpdate = async () => {
    if (!currentAreaToEdit || !newStatus.trim()) {
      setUpdateError("Nenhuma área selecionada ou status inválido.");
      return;
    }
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const responseMessage = await updateClientUploadAreaStatus(currentAreaToEdit.upload_area_id, newStatus);
      setUpdateSuccess(responseMessage?.message || "Status atualizado com sucesso!");
      // Atualizar a lista localmente ou recarregar
      setAreas(prevAreas =>
        prevAreas.map(area =>
          area.upload_area_id === currentAreaToEdit.upload_area_id
            ? { ...area, upload_area_status: newStatus }
            : area
        )
      );
      setTimeout(() => { // Fecha o modal e limpa a mensagem após um tempo
        handleCloseModal();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar status.';
      setUpdateError(errorMsg);
      console.error("Erro ao atualizar status:", err);
    }
  };


  if (isLoading) {
    return <div className="loading-message">Carregando dados das áreas de cliente...</div>;
  }

  if (error && !isModalOpen) { // Não mostra erro de carregamento se o modal estiver aberto
    return <div className="error-message">Erro ao carregar dados: {error}</div>;
  }

  return (
    <>
      <div className="admin-client-areas-page list-card">
        <h2>Gerenciamento de Áreas de Upload de Cliente</h2>
        {areas.length === 0 && !isLoading && !error && (
            <div className="info-message empty-list">Nenhuma área de upload de cliente encontrada.</div>
        )}
        {areas.length > 0 && (
            <div className="table-wrapper">
            <table className="data-table">
                <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Ticket ID</th>
                    <th>Pasta no Drive</th>
                    {/* <th>URL da Pasta</th> */}
                    <th>Criação da Área</th>
                    <th>Status da Área</th>
                    <th>Backups Processados</th>
                    <th>Ações</th>
                </tr>
                </thead>
                <tbody>
                {areas.map((area) => (
                    <tr key={area.upload_area_id}>
                    <td>{area.client_name || 'N/A'}</td>
                    <td>{area.client_email || 'N/A'}</td>
                    <td>{area.ticket_id || 'N/A'}</td>
                    <td>
                        {area.gdrive_folder_url ? (
                        <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer" title={area.gdrive_folder_name}>
                            {area.gdrive_folder_name || 'Abrir Pasta'} <FiExternalLink style={{ marginLeft: '4px', verticalAlign: 'middle' }} size={14}/>
                        </a>
                        ) : (
                        area.gdrive_folder_name || 'N/A'
                        )}
                    </td>
                    {/* <td>
                        {area.gdrive_folder_url ? (
                        <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer" title={area.gdrive_folder_url}>
                            Abrir <FiExternalLink style={{ verticalAlign: 'middle' }} size={14}/>
                        </a>
                        ) : (
                        'N/A'
                        )}
                    </td> */}
                    <td>{area.area_creation_date}</td>
                    <td>{area.upload_area_status || 'N/A'}</td>
                    <td>
                        {area.processed_backups.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'disc' }}>
                            {area.processed_backups.map((backup) => (
                            <li key={backup.pb_id} style={{ fontSize: '0.9em', marginBottom: '2px' }}>
                                {backup.pb_original_backup_filename}
                                {backup.pb_restored_alias && ` (${backup.pb_restored_alias})`}
                            </li>
                            ))}
                        </ul>
                        ) : (
                        'Nenhum'
                        )}
                    </td>
                    <td>
                        <button
                        onClick={() => handleOpenUpdateStatusModal(area)}
                        className="action-button" // Use uma classe do seu global.css ou crie uma nova
                        title="Mudar Status da Área"
                        style={{fontSize: '0.85em', padding: '6px 10px'}}
                        >
                        <FiEdit size={14} style={{ marginRight: '5px' }} /> Status
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {isModalOpen && currentAreaToEdit && (
        <div style={modalOverlayStyle} onClick={handleCloseModal}> {/* Fecha ao clicar fora */}
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Impede propagação do clique */}
            <button onClick={handleCloseModal} className="modal-close-button" title="Fechar Modal">&times;</button>
            <h2>Mudar Status da Área</h2>
            <p><strong>Cliente:</strong> {currentAreaToEdit.client_name}</p>
            <p><strong>Pasta:</strong> {currentAreaToEdit.gdrive_folder_name}</p>
            <p><strong>Status Atual:</strong> {currentAreaToEdit.upload_area_status}</p>

            <div className="form-group">
              <label htmlFor="newStatusSelect">Novo Status:</label>
              <select
                id="newStatusSelect"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize:'0.95em' }} // Estilo básico
              >
                {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {updateError && <div className="error-message" style={{marginBottom: '15px'}}>{updateError}</div>}
            {updateSuccess && <div className="upload-status-message success" style={{marginBottom: '15px'}}>{updateSuccess}</div>}


            <div className="modal-actions">
              <button onClick={handleCloseModal} className="button-secondary">
                Cancelar
              </button>
              <button onClick={handleSubmitStatusUpdate} className="button-primary">
                <FiCheckCircle style={{ marginRight: '5px' }} /> Salvar Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminClientAreasPage;