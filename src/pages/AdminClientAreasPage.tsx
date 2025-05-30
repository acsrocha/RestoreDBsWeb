// src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchAdminClientUploadAreaDetails,
  updateClientUploadAreaStatus,
  updateClientUploadAreaNotes,
  downloadFromDrive,
  deleteClientUploadArea,
} from '../services/api';
import type { AdminClientUploadAreaDetail } from '../types/api';
import {
  FiEdit, FiAlertTriangle, FiRefreshCw, FiFileText,
  FiDownloadCloud, FiTrash2, FiUsers, FiSearch
} from 'react-icons/fi';

import DriveCycleIndicator from '../components/common/DriveCycleIndicator';
import { useDriveCycle } from '../contexts/DriveCycleContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';
// NOVO: Importação do modal de detalhes
import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';

// Função para obter a classe CSS com base no status da área
const getStatusClassName = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('sucesso')) return 'status-badge status--success';
  if (lowerStatus.includes('falha') || lowerStatus.includes('problema')) return 'status-badge status--error';
  if (lowerStatus.includes('processamento') || lowerStatus.includes('download concluído')) return 'status-badge status--info';
  if (lowerStatus.includes('aguardando') || lowerStatus.includes('upload concluído')) return 'status-badge status--warning';
  if (lowerStatus.includes('arquivado')) return 'status-badge status--archived';
  return 'status-badge';
};

const AdminClientAreasPage: React.FC = () => {
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  const { timeLeftSeconds, cycleDurationMinutes } = useDriveCycle();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [currentAreaForDetails, setCurrentAreaForDetails] = useState<AdminClientUploadAreaDetail | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [currentAreaForStatusEdit, setCurrentAreaForStatusEdit] = useState<AdminClientUploadAreaDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const statusOptions = [
    "Criada", "Aguardando Upload Cliente", "Upload Concluído pelo Cliente",
    "Download Concluído pelo Suporte", "Backup em Processamento",
    "Backup Processado - Sucesso", "Backup Processado - Falha",
    "Problema no Upload - Contatar Cliente", "Problema na Pasta", "Arquivado",
  ];
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [currentAreaForNotesEdit, setCurrentAreaForNotesEdit] = useState<AdminClientUploadAreaDetail | null>(null);
  const [newNotesContent, setNewNotesContent] = useState<string>('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState<boolean>(false);
  const [notesUpdateError, setNotesUpdateError] = useState<string | null>(null);
  const [notesUpdateSuccess, setNotesUpdateSuccess] = useState<string | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AdminClientUploadAreaDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Efeito para fazer a notificação desaparecer sozinha
  useEffect(() => {
    if (deleteFeedback) {
      const timer = setTimeout(() => {
        setDeleteFeedback(null);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [deleteFeedback]);

  const updateTimestamp = () => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  };

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminClientUploadAreaDetails();
      setAreas(data);
      updateTimestamp();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      setError(errorMsg);
    } finally {
      if (!isManualRefresh) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (lowercasedQuery === '') {
      setFilteredAreas(areas);
    } else {
      const filteredData = areas.filter(area => {
        const ticketMatch = area.ticket_id?.toLowerCase().includes(lowercasedQuery);
        const emailMatch = area.client_email?.toLowerCase().includes(lowercasedQuery);
        return ticketMatch || emailMatch;
      });
      setFilteredAreas(filteredData);
    }
  }, [searchQuery, areas]);

  useEffect(() => {
    loadData();
    const pollInterval = 15 * 1000;
    const intervalId = setInterval(() => {
      if (!isStatusModalOpen && !isNotesModalOpen && !isDetailsModalOpen && !isDeleteModalOpen) {
        loadData(true);
      }
    }, pollInterval);
    return () => clearInterval(intervalId);
  }, [loadData, isStatusModalOpen, isNotesModalOpen, isDetailsModalOpen, isDeleteModalOpen]);

  const handleManualRefresh = () => {
    loadData(true);
  };

  const handleOpenDetailsModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaForDetails(area);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setTimeout(() => setCurrentAreaForDetails(null), 300);
  };

  const handleOpenUpdateStatusModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaForStatusEdit(area);
    setNewStatus(area.upload_area_status);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(null);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    if (isSubmittingStatus) return;
    setIsStatusModalOpen(false);
    setTimeout(() => {
        setCurrentAreaForStatusEdit(null);
        setNewStatus('');
        setStatusUpdateError(null);
        setStatusUpdateSuccess(null);
    }, 300);
  };

  const handleSubmitStatusUpdate = async () => {
    if (!currentAreaForStatusEdit) return;
    setIsSubmittingStatus(true);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(null);
    try {
      const response = await updateClientUploadAreaStatus(currentAreaForStatusEdit.upload_area_id, newStatus);
      setStatusUpdateSuccess(response?.message || "Status atualizado com sucesso!");
      loadData(true);
      setTimeout(handleCloseStatusModal, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar status.';
      setStatusUpdateError(errorMsg);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleOpenEditNotesModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaForNotesEdit(area);
    setNewNotesContent(area.upload_area_notes || '');
    setNotesUpdateError(null);
    setNotesUpdateSuccess(null);
    setIsNotesModalOpen(true);
  };

  const handleCloseNotesModal = () => {
    if (isSubmittingNotes) return;
    setIsNotesModalOpen(false);
    setTimeout(() => {
        setCurrentAreaForNotesEdit(null);
        setNewNotesContent('');
        setNotesUpdateError(null);
        setNotesUpdateSuccess(null);
    }, 300);
  };

  const handleSubmitNotesUpdate = async () => {
    if (!currentAreaForNotesEdit) return;
    setIsSubmittingNotes(true);
    setNotesUpdateError(null);
    setNotesUpdateSuccess(null);
    try {
      const response = await updateClientUploadAreaNotes(currentAreaForNotesEdit.upload_area_id, newNotesContent);
      setNotesUpdateSuccess(response?.message || "Notas atualizadas com sucesso!");
      loadData(true);
      setTimeout(handleCloseNotesModal, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar notas.';
      setNotesUpdateError(errorMsg);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleDownload = async (areaId: string) => {
    setActionInProgress(prev => ({ ...prev, [`download_${areaId}`]: true }));
    try {
      const response = await downloadFromDrive(areaId);
      setDeleteFeedback({ type: 'success', message: response.message || "Solicitação de download enviada com sucesso!" });
      loadData(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao iniciar o download.';
      setDeleteFeedback({ type: 'error', message: errorMsg });
    } finally {
      setActionInProgress(prev => ({ ...prev, [`download_${areaId}`]: false }));
    }
  };

  const handleOpenDeleteModal = (area: AdminClientUploadAreaDetail) => {
    setAreaToDelete(area);
    setIsDeleteModalOpen(true);
    setDeleteFeedback(null); 
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setTimeout(() => {
      setAreaToDelete(null);
    }, 300);
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    
    setIsDeleting(true);
    setDeleteFeedback(null);
    try {
      await deleteClientUploadArea(areaToDelete.upload_area_id);
      setDeleteFeedback({ type: 'success', message: `Área do cliente "${areaToDelete.client_name}" excluída com sucesso.` });
      handleCloseDeleteModal();
      loadData(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao excluir a área.';
      handleCloseDeleteModal();
      setDeleteFeedback({ type: 'error', message: errorMsg });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading && areas.length === 0) {
    return <div className="loading-message">Carregando dados das áreas de cliente...</div>;
  }

  if (error && areas.length === 0 && !isLoading) {
    return <div className="error-message">Erro ao carregar dados: {error} <button onClick={() => loadData(false)} className="button-secondary">Tentar Novamente</button></div>;
  }

  return (
    <>
      <div className="admin-client-areas-page list-card">
        <div className="admin-areas-header">
          <h2><FiUsers /> Gerenciamento de Áreas de Upload de Cliente</h2>
          <div className="admin-areas-header-actions">
            <DriveCycleIndicator timeLeftSeconds={timeLeftSeconds} cycleDurationMinutes={cycleDurationMinutes} />
            <button onClick={handleManualRefresh} className="button-refresh" disabled={isLoading}>
              <FiRefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
              {isLoading ? 'Atualizando...' : 'Atualizar Grid'}
            </button>
          </div>
        </div>
        {lastUpdated && <p className="grid-last-updated">Grid atualizada às: {lastUpdated}</p>}

        <div className="table-filter-bar">
          <div className="form-group search-form-group">
            <label htmlFor="area-search"><FiSearch /> Pesquisar</label>
            <input
              type="search"
              id="area-search"
              placeholder="Digite o Ticket ID ou Email do cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {deleteFeedback && (
          <NotificationBanner
            type={deleteFeedback.type}
            message={deleteFeedback.message}
            onDismiss={() => setDeleteFeedback(null)}
          />
        )}

        {error && !isLoading && !deleteFeedback && (
             <div className="notification-banner notification-error">
                <p><FiAlertTriangle />Falha ao buscar atualizações da grid: {error}</p>
            </div>
        )}

        <div className="table-wrapper">
          {filteredAreas.length > 0 ? (
            <table className="data-table">
              <thead>
              <tr>
                  <th>Cliente</th>
                  <th>Ticket ID</th>
                  <th>Pasta no Drive</th>
                  <th>Status da Área</th>
                  <th>Data Criação</th>
                  <th>Ações</th>
              </tr>
              </thead>
              <tbody>
              {filteredAreas.map((area) => (
                  <tr key={area.upload_area_id} onClick={() => handleOpenDetailsModal(area)} className="clickable-row">
                    <td data-label="Cliente" className="client-name-cell">{area.client_name || 'N/A'}</td>
                    <td data-label="Ticket ID">{area.ticket_id || 'N/A'}</td>
                    <td data-label="Pasta no Drive" className="drive-folder-cell">
                      {area.gdrive_folder_url ? (
                        <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          {area.gdrive_folder_name}
                        </a>
                      ) : (
                        <span>{area.gdrive_folder_name || 'N/A'}</span>
                      )}
                    </td>
                    <td data-label="Status da Área" className="status-cell">
                        <span className={getStatusClassName(area.upload_area_status)}>
                          {area.upload_area_status || 'N/A'}
                        </span>
                    </td>
                    <td data-label="Data Criação">{new Date(area.area_creation_date).toLocaleString('pt-BR')}</td>
                    <td data-label="Ações" className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-container">
                        <button onClick={() => handleDownload(area.upload_area_id)} className="action-btn-icon download" title="Baixar arquivo do Drive para a fila" disabled={actionInProgress[`download_${area.upload_area_id}`]}>
                          <FiDownloadCloud size={16} />
                        </button>
                        <button onClick={() => handleOpenUpdateStatusModal(area)} className="action-btn-icon edit" title="Mudar Status da Área">
                          <FiEdit size={16} />
                        </button>
                          <button onClick={() => handleOpenEditNotesModal(area)} className={`action-btn-icon notes ${area.upload_area_notes ? 'has-notes' : ''}`} title={area.upload_area_notes ? `Ver/Editar Notas` : "Adicionar Notas"}>
                            <FiFileText size={16} />
                          </button>
                        <button onClick={() => handleOpenDeleteModal(area)} className="action-btn-icon delete" title="Excluir Área Permanentemente" disabled={actionInProgress[`delete_${area.upload_area_id}`]}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-list">
              {searchQuery ? `Nenhum resultado encontrado para "${searchQuery}".` : 'Nenhuma área de upload de cliente encontrada.'}
            </div>
          )}
        </div>
      </div>
      
      {/* --- MODAIS --- */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={areaToDelete?.client_name || ''}
        folderName={areaToDelete?.gdrive_folder_name || ''}
        ticketId={areaToDelete?.ticket_id || ''}
      />

      {/* NOVO: Utilização do modal de detalhes */}
      <ClientAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        area={currentAreaForDetails}
      />

      {/* ... (outros modais que você possa ter) */}
    </>
  );
};

export default AdminClientAreasPage;