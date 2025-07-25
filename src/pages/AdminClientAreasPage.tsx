import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiDownload, FiTrash2, FiEdit2, FiExternalLink } from 'react-icons/fi';
import { 
  fetchAdminClientUploadAreaDetails, 
  downloadFromDrive, 
  deleteClientUploadArea,
  updateClientUploadAreaStatus,
  updateClientUploadAreaNotes
} from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';
import type { AdminClientUploadAreaDetail } from '../types/api';
import '../styles/components/AdminClientAreas.css';

const AdminClientAreasPage: React.FC = () => {
  const [clientAreas, setClientAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado centralizado para o modal de exclusão
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    area: null as AdminClientUploadAreaDetail | null,
    shouldCascade: false,
    canCascade: false
  });
  
  // Estado para o modal de detalhes
  const [detailsModalState, setDetailsModalState] = useState({
    isOpen: false,
    area: null as AdminClientUploadAreaDetail | null
  });
  
  const { showSuccess, showError, showInfo } = useNotification();
  const { refreshTrigger, triggerRefresh } = useGlobalRefresh();

  // Função para buscar as áreas de cliente
  const fetchClientAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminClientUploadAreaDetails();
      setClientAreas(data);
    } catch (err) {
      console.error('Erro ao buscar áreas de cliente:', err);
      setError(err.message || 'Erro ao buscar áreas de cliente');
      showError('Falha ao carregar áreas de cliente: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Carregar dados iniciais e quando o refreshTrigger mudar
  useEffect(() => {
    fetchClientAreas();
  }, [fetchClientAreas, refreshTrigger]);

  // Função para iniciar o download de um arquivo do Drive
  const handleDownloadFromDrive = async (areaId: string, clientName: string) => {
    try {
      showInfo(`Iniciando download para a área de ${clientName}...`);
      await downloadFromDrive(areaId);
      showSuccess(`Download iniciado com sucesso para a área de ${clientName}`);
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao iniciar download:', err);
      showError('Falha ao iniciar download: ' + (err.message || 'Erro desconhecido'));
    }
  };

  // Função para abrir o modal de exclusão
  const handleOpenDeleteModal = (area: AdminClientUploadAreaDetail) => {
    const hasDatabases = area.processed_backups && area.processed_backups.length > 0;
    
    setDeleteModalState({
      isOpen: true,
      area: area,
      shouldCascade: false,
      canCascade: hasDatabases
    });
  };

  // Função para fechar o modal de exclusão
  const handleCloseDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      area: null,
      shouldCascade: false,
      canCascade: false
    });
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    const { area, shouldCascade } = deleteModalState;
    
    if (!area) return;
    
    try {
      showInfo(`Excluindo área de ${area.client_name}...`);
      await deleteClientUploadArea(area.upload_area_id);
      showSuccess(`Área de ${area.client_name} excluída com sucesso`);
      
      // Se tiver bancos de dados associados e shouldCascade for true,
      // aqui seria o lugar para excluir os bancos de dados também
      if (shouldCascade && area.processed_backups.length > 0) {
        // Implementação futura para exclusão em cascata dos bancos
        showInfo(`Nota: A exclusão em cascata dos bancos de dados ainda não está implementada.`);
      }
      
      // Fechar o modal e atualizar a lista
      handleCloseDeleteModal();
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao excluir área:', err);
      showError('Falha ao excluir área: ' + (err.message || 'Erro desconhecido'));
    }
  };

  // Função para abrir o modal de detalhes
  const handleOpenDetailsModal = (area: AdminClientUploadAreaDetail) => {
    setDetailsModalState({
      isOpen: true,
      area: area
    });
  };

  // Função para fechar o modal de detalhes
  const handleCloseDetailsModal = () => {
    setDetailsModalState({
      isOpen: false,
      area: null
    });
  };

  // Função para atualizar o status de uma área
  const handleUpdateStatus = async (areaId: string, newStatus: string) => {
    try {
      await updateClientUploadAreaStatus(areaId, newStatus);
      showSuccess(`Status atualizado para: ${newStatus}`);
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      showError('Falha ao atualizar status: ' + (err.message || 'Erro desconhecido'));
    }
  };

  // Função para atualizar as notas de uma área
  const handleUpdateNotes = async (areaId: string, newNotes: string) => {
    try {
      await updateClientUploadAreaNotes(areaId, newNotes);
      showSuccess('Notas atualizadas com sucesso');
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao atualizar notas:', err);
      showError('Falha ao atualizar notas: ' + (err.message || 'Erro desconhecido'));
    }
  };

  return (
    <div className="admin-client-areas-page">
      <div className="page-header">
        <h1>Áreas de Upload de Clientes</h1>
        <Link to="/create-client-area" className="create-button">
          <FiPlus />
          Nova Área
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando áreas de cliente...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchClientAreas} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      ) : clientAreas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma área de cliente cadastrada.</p>
          <Link to="/create-client-area" className="create-button">
            <FiPlus />
            Criar Primeira Área
          </Link>
        </div>
      ) : (
        <div className="client-areas-grid">
          {clientAreas.map(area => (
            <div key={area.upload_area_id} className="client-area-card">
              <div className="card-header">
                <h2>{area.client_name}</h2>
                <span className={`status-badge ${area.upload_area_status.toLowerCase()}`}>
                  {area.upload_area_status}
                </span>
              </div>
              
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{area.client_email}</span>
                </div>
                
                {area.ticket_id && (
                  <div className="info-row">
                    <span className="info-label">Ticket:</span>
                    <span className="info-value">{area.ticket_id}</span>
                  </div>
                )}
                
                <div className="info-row">
                  <span className="info-label">Pasta:</span>
                  <span className="info-value">{area.gdrive_folder_name}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Criação:</span>
                  <span className="info-value">{area.area_creation_date}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Backups:</span>
                  <span className="info-value">{area.processed_backups.length}</span>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="action-button details"
                  onClick={() => handleOpenDetailsModal(area)}
                  title="Ver detalhes"
                >
                  <FiEdit2 />
                </button>
                
                <button 
                  className="action-button download"
                  onClick={() => handleDownloadFromDrive(area.upload_area_id, area.client_name)}
                  title="Baixar do Drive"
                >
                  <FiDownload />
                </button>
                
                {area.gdrive_folder_url && (
                  <a 
                    href={area.gdrive_folder_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button external"
                    title="Abrir no Google Drive"
                  >
                    <FiExternalLink />
                  </a>
                )}
                
                <button 
                  className="action-button delete"
                  onClick={() => handleOpenDeleteModal(area)}
                  title="Excluir área"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de exclusão */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={`Excluir Área de ${deleteModalState.area?.client_name || 'Cliente'}`}
        message={`Tem certeza que deseja excluir a área de upload de ${deleteModalState.area?.client_name || 'cliente'}? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir Área"
        showCascadeOption={deleteModalState.canCascade}
        cascadeOptionLabel={`Excluir também os ${deleteModalState.area?.processed_backups.length || 0} bancos de dados associados`}
        cascadeOptionChecked={deleteModalState.shouldCascade}
        onCascadeOptionChange={(checked) => setDeleteModalState(prev => ({...prev, shouldCascade: checked}))}
      />

      {/* Modal de detalhes */}
      {detailsModalState.isOpen && detailsModalState.area && (
        <ClientAreaDetailsModal
          isOpen={detailsModalState.isOpen}
          onClose={handleCloseDetailsModal}
          clientArea={detailsModalState.area}
          onStatusUpdate={handleUpdateStatus}
          onNotesUpdate={handleUpdateNotes}
        />
      )}
    </div>
  );
};

export default AdminClientAreasPage;