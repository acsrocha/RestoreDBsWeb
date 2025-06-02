// src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'; // Adicionado useRef
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
  FiDownloadCloud, FiTrash2, FiUsers, FiSearch, FiSave
} from 'react-icons/fi';
import { isEqual } from 'lodash'; // Importar isEqual

import DriveCycleIndicator from '../components/common/DriveCycleIndicator';
import { useDriveCycle } from '../contexts/DriveCycleContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';
import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';

// Função para obter a classe CSS com base no status da área (sem alterações)
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
  
  // actionInProgress agora é um Set de IDs para melhor granularidade, ou um booleano simples se preferir
  const [actionInProgress, setActionInProgress] = useState<Set<string>>(new Set());
  
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

  // NOVO ESTADO PARA DESTAQUE
  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(new Set());
  const previousAreasRef = useRef<AdminClientUploadAreaDetail[]>([]); // Usar ref para previousAreas

  useEffect(() => {
    // Atualiza a referência para previousAreas sempre que 'areas' mudar
    previousAreasRef.current = areas;
  }, [areas]);


  const updateTimestamp = () => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  };

  const loadData = useCallback(async (isPollOrManualRefresh = false) => {
    if (!isPollOrManualRefresh) {
      setIsLoading(true); // Define o carregamento inicial apenas se não for um poll/refresh
    }
    // Não definimos setError(null) aqui para evitar piscar se for um erro de poll
    
    // Para um poll ou refresh manual, não queremos que a tela inteira mostre "Carregando..."
    // O botão de refresh já mostra seu próprio estado de carregamento.
    // Para poll, é uma atualização em segundo plano.

    try {
      const newData = await fetchAdminClientUploadAreaDetails();
      
      // Lógica de Destaque de Linhas Alteradas
      if (isPollOrManualRefresh && previousAreasRef.current.length > 0) {
        const currentPreviousAreas = previousAreasRef.current;
        const newHighlights = new Set<string>();
        
        newData.forEach(newArea => {
          const oldArea = currentPreviousAreas.find(pa => pa.upload_area_id === newArea.upload_area_id);
          if (oldArea) {
            // Compara o objeto antigo com o novo. Se forem diferentes, destaca.
            // isEqual da lodash faz uma comparação profunda.
            if (!isEqual(oldArea, newArea)) {
              newHighlights.add(newArea.upload_area_id);
            }
          } else {
            // Se a área é nova (não existia antes), destaca também.
            newHighlights.add(newArea.upload_area_id);
          }
        });

        if (newHighlights.size > 0) {
          setHighlightedRowIds(newHighlights);
          setTimeout(() => {
            setHighlightedRowIds(new Set()); // Limpa o destaque após 3 segundos
          }, 3000);
        }
      }
      
      setAreas(newData); // Atualiza as áreas principais
      updateTimestamp();
      if (error) setError(null); // Limpa o erro se a busca for bem-sucedida

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      setError(errorMsg); // Define o erro apenas se a busca falhar
      // Não limpamos 'areas' em caso de erro de poll para manter os dados antigos visíveis
    } finally {
      if (!isPollOrManualRefresh) {
        setIsLoading(false); // Limpa o carregamento inicial
      }
    }
  }, [error]); // Adicionado 'error' para limpar em caso de sucesso


  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (lowercasedQuery === '') {
      setFilteredAreas(areas);
    } else {
      const filteredData = areas.filter(area => {
        const ticketMatch = area.ticket_id?.toLowerCase().includes(lowercasedQuery);
        const emailMatch = area.client_email?.toLowerCase().includes(lowercasedQuery);
        const clientNameMatch = area.client_name?.toLowerCase().includes(lowercasedQuery);
        return ticketMatch || emailMatch || clientNameMatch;
      });
      setFilteredAreas(filteredData);
    }
  }, [searchQuery, areas]);

  // Efeito para carregamento inicial e polling
  useEffect(() => {
    loadData(); // Carregamento inicial
    // O polling de 15 segundos é definido aqui
    // Pode ser ajustado se necessário, ex: para 10000 (10s)
    const pollInterval = 15 * 1000; 
    const intervalId = setInterval(() => {
      // Só faz poll se nenhum modal estiver aberto e nenhuma ação principal estiver em progresso
      if (!isStatusModalOpen && !isNotesModalOpen && !isDetailsModalOpen && !isDeleteModalOpen && actionInProgress.size === 0) {
        loadData(true); // Passa true para indicar que é um poll/refresh
      }
    }, pollInterval);
    return () => clearInterval(intervalId);
  }, [loadData, isStatusModalOpen, isNotesModalOpen, isDetailsModalOpen, isDeleteModalOpen, actionInProgress.size]);


  // Efeito para notificações que desaparecem (sem alterações)
  useEffect(() => {
    if (deleteFeedback) {
      const timer = setTimeout(() => {
        setDeleteFeedback(null);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [deleteFeedback]);


  const handleManualRefresh = async () => {
    setIsLoading(true); // Mostra feedback no botão de refresh
    await loadData(true);
    setIsLoading(false);
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
      await loadData(true); // Recarrega os dados para refletir a mudança e o destaque
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
      await loadData(true); // Recarrega os dados para refletir a mudança e o destaque
      setTimeout(handleCloseNotesModal, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar notas.';
      setNotesUpdateError(errorMsg);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleDownload = async (areaId: string) => {
    setActionInProgress(prev => new Set(prev).add(`download_${areaId}`));
    setDeleteFeedback(null);
    try {
      const response = await downloadFromDrive(areaId);
      setDeleteFeedback({ type: 'success', message: response.message || "Solicitação de download enviada com sucesso!" });
      await loadData(true); // Recarrega os dados para refletir a mudança e o destaque
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao iniciar o download.';
      setDeleteFeedback({ type: 'error', message: errorMsg });
    } finally {
      setActionInProgress(prev => {
        const next = new Set(prev);
        next.delete(`download_${areaId}`);
        return next;
      });
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
    setActionInProgress(prev => new Set(prev).add(`delete_${areaToDelete.upload_area_id}`));
    setDeleteFeedback(null);
    try {
      await deleteClientUploadArea(areaToDelete.upload_area_id);
      setDeleteFeedback({ type: 'success', message: `Área "${areaToDelete.gdrive_folder_name}" (Cliente: ${areaToDelete.client_name}) excluída com sucesso.` });
      handleCloseDeleteModal();
      await loadData(true); // Recarrega os dados após a exclusão
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao excluir a área.';
      // Não fechar o modal de delete em caso de erro, para o usuário ver
      setDeleteFeedback({ type: 'error', message: errorMsg });
    } finally {
      setIsDeleting(false);
      setActionInProgress(prev => {
        const next = new Set(prev);
        // Verifique se areaToDelete ainda é válido, pois pode ser limpo por handleCloseDeleteModal
        if (areaToDelete) { 
            next.delete(`delete_${areaToDelete.upload_area_id}`);
        }
        return next;
      });
    }
  };


  if (isLoading && areas.length === 0) { // Exibe carregamento inicial
    return <div className="loading-message">Carregando dados das áreas de cliente...</div>;
  }

  // Mostra erro apenas se for um erro de carregamento inicial e não houver dados para mostrar
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
            <button onClick={handleManualRefresh} className="button-refresh" disabled={isLoading && areas.length > 0}>
              <FiRefreshCw size={14} className={(isLoading && areas.length > 0) ? 'spin-animation' : ''} />
              {(isLoading && areas.length > 0) ? 'Atualizando...' : 'Atualizar Grid'}
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
              placeholder="Digite o nome, ticket ou email do cliente..."
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

        {/* Mostra erro de poll de forma não obstrutiva se já houver dados na tela */}
        {error && areas.length > 0 && !deleteFeedback && (
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
                  <tr 
                    key={area.upload_area_id} 
                    onClick={() => handleOpenDetailsModal(area)} 
                    // ADICIONADA CLASSE PARA DESTAQUE
                    className={`clickable-row ${highlightedRowIds.has(area.upload_area_id) ? 'row-highlight-animation' : ''}`}
                  >
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
                        <button 
                            onClick={() => handleDownload(area.upload_area_id)} 
                            className="action-btn-icon download" 
                            title="Baixar arquivo do Drive para a fila" 
                            disabled={actionInProgress.has(`download_${area.upload_area_id}`)}
                        >
                          <FiDownloadCloud size={16} />
                        </button>
                        <button onClick={() => handleOpenUpdateStatusModal(area)} className="action-btn-icon edit" title="Mudar Status da Área">
                          <FiEdit size={16} />
                        </button>
                        <button onClick={() => handleOpenEditNotesModal(area)} className={`action-btn-icon notes ${area.upload_area_notes ? 'has-notes' : ''}`} title={area.upload_area_notes ? `Ver/Editar Notas` : "Adicionar Notas"}>
                            <FiFileText size={16} />
                        </button>
                        <button 
                            onClick={() => handleOpenDeleteModal(area)} 
                            className="action-btn-icon delete" 
                            title="Excluir Área Permanentemente" 
                            disabled={actionInProgress.has(`delete_${area.upload_area_id}`)}
                        >
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
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={areaToDelete?.client_name || ''} // Ajustado para mostrar nome do cliente
        customMessage={`Você tem certeza que deseja excluir permanentemente a área de upload do cliente "${areaToDelete?.client_name || 'Desconhecido'}" (Pasta: ${areaToDelete?.gdrive_folder_name || 'N/A'})? Esta ação também tentará excluir a pasta correspondente no Google Drive.`}
      />

      <ClientAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        area={currentAreaForDetails}
      />

      {isStatusModalOpen && currentAreaForStatusEdit && (
        <div className="modal-overlay active" onClick={handleCloseStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseStatusModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingStatus}>
              &times;
            </button>
            <h2>Alterar Status da Área</h2>
            <p>Cliente: <strong>{currentAreaForStatusEdit.client_name}</strong> (Ticket: {currentAreaForStatusEdit.ticket_id || 'N/A'})</p>
            
            <div className="form-group">
                <label htmlFor="status-select">Novo Status</label>
                <select 
                    id="status-select" 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={isSubmittingStatus}
                >
                    {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
            
            {statusUpdateError && <p className="modal-error-message">{statusUpdateError}</p>}
            {statusUpdateSuccess && <p className="modal-success-message">{statusUpdateSuccess}</p>}

            <div className="modal-actions">
              <button onClick={handleCloseStatusModal} className="button-secondary" disabled={isSubmittingStatus}>Cancelar</button>
              <button onClick={handleSubmitStatusUpdate} className="button-primary" disabled={isSubmittingStatus}>
                {isSubmittingStatus ? 'Salvando...' : <><FiSave /> Salvar Status</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isNotesModalOpen && currentAreaForNotesEdit && (
        <div className="modal-overlay active" onClick={handleCloseNotesModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseNotesModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingNotes}>
              &times;
            </button>
            <h2>Notas Internas da Área</h2>
            <p>Cliente: <strong>{currentAreaForNotesEdit.client_name}</strong> (Ticket: {currentAreaForNotesEdit.ticket_id || 'N/A'})</p>

            <div className="form-group">
                <label htmlFor="notes-textarea">Conteúdo das Notas</label>
                <textarea 
                    id="notes-textarea"
                    value={newNotesContent}
                    onChange={(e) => setNewNotesContent(e.target.value)}
                    rows={10} // Aumentado para mais espaço
                    placeholder='Digite aqui as notas internas para esta área...'
                    disabled={isSubmittingNotes}
                ></textarea>
            </div>

            {notesUpdateError && <p className="modal-error-message">{notesUpdateError}</p>}
            {notesUpdateSuccess && <p className="modal-success-message">{notesUpdateSuccess}</p>}

            <div className="modal-actions">
              <button onClick={handleCloseNotesModal} className="button-secondary" disabled={isSubmittingNotes}>Cancelar</button>
              <button onClick={handleSubmitNotesUpdate} className="button-primary" disabled={isSubmittingNotes}>
                {isSubmittingNotes ? 'Salvando...' : <><FiSave /> Salvar Notas</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminClientAreasPage;