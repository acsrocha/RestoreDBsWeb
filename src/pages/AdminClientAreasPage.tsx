// src/pages/AdminClientAreasPage.tsx (ou o nome correto do seu arquivo)
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  FiDownloadCloud, FiTrash2, FiUsers, FiSearch, FiSave, FiEye,
  FiLoader
} from 'react-icons/fi';
import { isEqual } from 'lodash';

import DriveCycleIndicator from '../components/common/DriveCycleIndicator'; // Presumindo que você tem este componente
import { useDriveCycle } from '../contexts/DriveCycleContext'; // Presumindo que você tem este contexto
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';
import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';
import { useLastUpdated } from '../contexts/LastUpdatedContext'; // Importação corrigida anteriormente

const getAreaStatusClassName = (status?: string): string => {
  if (!status) return 'status-badge status--desconhecido';
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('sucesso') || lowerStatus.includes('backup processado')) return 'status-badge status--success';
  if (lowerStatus.includes('falha') || lowerStatus.includes('problema')) return 'status-badge status--error';
  if (lowerStatus.includes('processamento') || lowerStatus.includes('download concluído')) return 'status-badge status--info';
  if (lowerStatus.includes('aguardando') || lowerStatus.includes('upload concluído') || lowerStatus === 'criada') return 'status-badge status--warning';
  if (lowerStatus.includes('arquivado')) return 'status-badge status--archived';
  return 'status-badge status--desconhecido';
};

const REFRESH_AREAS_INTERVAL = 15000;

const AdminClientAreasPage: React.FC = () => {
  console.log("LOG DEBUG: AdminClientAreasPage RENDERIZOU (Versão Corrigida Loop)");
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Estado de erro principal
  const [pollingError, setPollingError] = useState<string | null>(null); // Estado de erro para polling
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const [actionInProgress, setActionInProgress] = useState<Set<string>>(new Set());
  
  const { timeLeftSeconds, cycleDurationMinutes } = useDriveCycle(); // Certifique-se que o provider está no App.tsx
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
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(new Set());
  const previousAreasRef = useRef<AdminClientUploadAreaDetail[]>([]);
  const driveCycleUpdateDoneRef = useRef<boolean>(false);

  // const { addActivity, signalUpdate } = useLastUpdated(); // Se você precisar do lastUpdatedGlobal, use-o. Por ora, a página tem seu próprio lastUpdated.
  // Para esta página, vamos usar o addActivity do useLastUpdated se ele for importado.
  // Se useLastUpdated não for usado para o timestamp 'lastUpdatedGlobal' aqui, remova signalUpdate da dependência de loadData.
  const { addActivity } = useLastUpdated(); // Para simplificar, apenas addActivity por enquanto.

  useEffect(() => {
    previousAreasRef.current = areas;
  }, [areas]);

  const updateTimestamp = () => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  };

  const loadData = useCallback(async (isPollOrManualRefresh = false) => {
    const isInitialLoad = !previousAreasRef.current.length && !isPollOrManualRefresh;
    
    if (isInitialLoad || (isPollOrManualRefresh && !isPollOrManualRefresh)) {
        setIsLoading(true); // Mostra loading principal para carga inicial ou refresh manual explícito
    } else if (isPollOrManualRefresh) {
        // Para polling, não ativamos o isLoading principal, mas podemos ter um sutil ou nenhum
        // A lógica de actionInProgress pode cobrir isso.
    }

    const currentLoadingAction = isPollOrManualRefresh ? 'loading_poll' : 'loading_initial';
    setActionInProgress(prev => new Set(prev).add(currentLoadingAction));
    if (!isPollOrManualRefresh) setError(null); // Limpa erro principal em carga inicial/manual

    try {
      const newData = await fetchAdminClientUploadAreaDetails();
      if (isPollOrManualRefresh && previousAreasRef.current.length > 0) {
        const currentPreviousAreas = previousAreasRef.current;
        const newHighlights = new Set<string>();
        newData.forEach(newArea => {
          const oldArea = currentPreviousAreas.find(pa => pa.upload_area_id === newArea.upload_area_id);
          if (oldArea) { if (!isEqual(oldArea, newArea)) { newHighlights.add(newArea.upload_area_id); } } 
          else { newHighlights.add(newArea.upload_area_id); }
        });
        if (newHighlights.size > 0) {
          setHighlightedRowIds(newHighlights);
          setTimeout(() => { setHighlightedRowIds(new Set()); }, 3000);
        }
      }
      setAreas(newData.sort((a,b) => new Date(b.area_creation_date).getTime() - new Date(a.area_creation_date).getTime()));
      updateTimestamp();
      setPollingError(null); // Limpa erro de polling em sucesso
      if (!isPollOrManualRefresh) setError(null); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      if (!isPollOrManualRefresh) {
        setError(errorMsg); // Define erro principal
      } else {
        setPollingError(errorMsg); // Define erro de polling
        console.warn("Erro durante polling de áreas:", errorMsg);
      }
    } finally {
      if (isInitialLoad || (isPollOrManualRefresh && !isPollOrManualRefresh)) {
        setIsLoading(false);
      }
      setActionInProgress(prev => { const next = new Set(prev); next.delete(currentLoadingAction); return next; });
    }
  // A dependência de `error` ou `pollingError` aqui pode causar problemas se loadData as modificar.
  // É melhor que `loadData` seja estável ou que suas dependências não sejam modificadas por ela mesma.
  // Por ora, vamos manter `addActivity` se for usado, ou um array vazio se não.
  }, [addActivity]); // Se addActivity não for usado, pode ser []


  // Efeito para carga inicial de dados
  useEffect(() => {
    loadData(false); // Carga inicial
  }, [loadData]); // Executa apenas uma vez na montagem, pois loadData é estável

  // Efeito para polling
  useEffect(() => {
    const anyModalOpen = isStatusModalOpen || isNotesModalOpen || isDetailsModalOpen || isDeleteModalOpen;
    const mainLoadingInProgress = actionInProgress.has('loading_initial') || actionInProgress.has('loading_poll') || isLoading;

    const intervalId = setInterval(() => {
      if (!anyModalOpen && !mainLoadingInProgress && actionInProgress.size === 0) {
        console.log("LOG DEBUG: [AdminClientAreasPage] Polling - chamando loadData(true)");
        loadData(true);
      } else {
        console.log("LOG DEBUG: [AdminClientAreasPage] Polling - SKIPPED. Modal aberto ou ação em progresso.", {anyModalOpen, mainLoadingInProgress, actionInProgressSize: actionInProgress.size});
      }
    }, REFRESH_AREAS_INTERVAL);
    return () => clearInterval(intervalId);
  // --- ALTERAÇÃO AQUI: Removido actionInProgress da lista de dependências ---
  // loadData agora tem dependências mais estáveis.
  }, [loadData, isStatusModalOpen, isNotesModalOpen, isDetailsModalOpen, isDeleteModalOpen, isLoading, actionInProgress]); 
  // Adicionado isLoading e actionInProgress para reavaliar o intervalo se esses estados mudarem.

  useEffect(() => {
    if (timeLeftSeconds <= 0 && !driveCycleUpdateDoneRef.current) {
      console.log('AdminClientAreasPage: Fim do ciclo do Drive, atualizando dados...');
      loadData(true); 
      driveCycleUpdateDoneRef.current = true; 
    }
    else if (timeLeftSeconds > 0 && driveCycleUpdateDoneRef.current) {
      driveCycleUpdateDoneRef.current = false;
    }
  }, [timeLeftSeconds, loadData]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => { setFeedbackMessage(null); }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (lowercasedQuery === '') {
      setFilteredAreas(areas);
    } else {
      const filteredData = areas.filter(area => 
        area.client_name?.toLowerCase().includes(lowercasedQuery) ||
        area.ticket_id?.toLowerCase().includes(lowercasedQuery) ||
        area.client_email?.toLowerCase().includes(lowercasedQuery) ||
        area.gdrive_folder_name?.toLowerCase().includes(lowercasedQuery) ||
        area.upload_area_status?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredAreas(filteredData);
    }
  }, [searchQuery, areas]);

  const handleManualRefresh = async () => {
    setFeedbackMessage(null); // Limpa feedback ao atualizar manualmente
    setPollingError(null);  // Limpa erro de polling também
    await loadData(false); // Trata como uma carga principal
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
    setStatusUpdateError(null); setStatusUpdateSuccess(null); setIsStatusModalOpen(true);
  };
  const handleCloseStatusModal = () => {
    if (isSubmittingStatus) return;
    setIsStatusModalOpen(false);
    setTimeout(() => { setCurrentAreaForStatusEdit(null); setNewStatus(''); setStatusUpdateError(null); setStatusUpdateSuccess(null);}, 300);
  };
  const handleSubmitStatusUpdate = async () => {
    if (!currentAreaForStatusEdit) return;
    setIsSubmittingStatus(true); setStatusUpdateError(null); setStatusUpdateSuccess(null);
    const actionKey = `status_${currentAreaForStatusEdit.upload_area_id}`;
    setActionInProgress(prev => new Set(prev).add(actionKey));
    try {
      const response = await updateClientUploadAreaStatus(currentAreaForStatusEdit.upload_area_id, newStatus);
      setStatusUpdateSuccess(response?.message || "Status atualizado!");
      await loadData(true); setTimeout(handleCloseStatusModal, 2000);
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : 'Falha ao atualizar status.');
    } finally {
      setIsSubmittingStatus(false);
      setActionInProgress(prev => { const next = new Set(prev); next.delete(actionKey); return next; });
    }
  };

  const handleOpenEditNotesModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaForNotesEdit(area);
    setNewNotesContent(area.upload_area_notes || '');
    setNotesUpdateError(null); setNotesUpdateSuccess(null); setIsNotesModalOpen(true);
  };
  const handleCloseNotesModal = () => {
    if (isSubmittingNotes) return;
    setIsNotesModalOpen(false);
    setTimeout(() => { setCurrentAreaForNotesEdit(null); setNewNotesContent(''); setNotesUpdateError(null); setNotesUpdateSuccess(null);}, 300);
  };
  const handleSubmitNotesUpdate = async () => {
    if (!currentAreaForNotesEdit) return;
    setIsSubmittingNotes(true); setNotesUpdateError(null); setNotesUpdateSuccess(null);
    const actionKey = `notes_${currentAreaForNotesEdit.upload_area_id}`;
    setActionInProgress(prev => new Set(prev).add(actionKey));
    try {
      const response = await updateClientUploadAreaNotes(currentAreaForNotesEdit.upload_area_id, newNotesContent);
      setNotesUpdateSuccess(response?.message || "Notas atualizadas!");
      await loadData(true); setTimeout(handleCloseNotesModal, 2000);
    } catch (err) {
      setNotesUpdateError(err instanceof Error ? err.message : 'Falha ao atualizar notas.');
    } finally {
      setIsSubmittingNotes(false);
      setActionInProgress(prev => { const next = new Set(prev); next.delete(actionKey); return next; });
    }
  };

  const handleDownload = async (areaId: string, clientName: string) => {
    const actionKey = `download_${areaId}`;
    setActionInProgress(prev => new Set(prev).add(actionKey));
    setFeedbackMessage({type: 'info', message: `Iniciando download para ${clientName}...`});
    try {
        const response = await downloadFromDrive(areaId);
        setFeedbackMessage({ type: 'success', message: response.message || `Solicitação de download para ${clientName} enviada!` });
        await loadData(true); 
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Falha ao iniciar download.';
        setFeedbackMessage({type: 'error', message: `Erro no download para ${clientName}: ${errorMessage}`});
    } finally {
      setActionInProgress(prev => { const next = new Set(prev); next.delete(actionKey); return next; });
    }
  };

  const handleOpenDeleteModal = (area: AdminClientUploadAreaDetail) => {
    console.log(`LOG DEBUG: [AdminClientAreasPage] handleOpenDeleteModal INICIADO para area ID: ${area.upload_area_id}`);
    setFeedbackMessage(null); 
    setAreaToDelete(area); 
  };

  useEffect(() => {
    if (areaToDelete) {
      console.log("LOG DEBUG: [AdminClientAreasPage] useEffect detectou areaToDelete:", areaToDelete.upload_area_id, "ABRINDO MODAL DE EXCLUSÃO.");
      setIsDeleteModalOpen(true);
    } else {
      // Garante que o modal feche se areaToDelete for definido como null externamente
      // Embora handleCloseDeleteModal já faça isso, é uma segurança adicional.
      // No entanto, isso pode causar um loop se handleCloseDeleteModal não limpar areaToDelete
      // Corrigido: handleCloseDeleteModal agora limpa areaToDelete, então esta parte do else é menos crítica.
      // Mas vamos manter o setIsDeleteModalOpen(false) para garantir.
       if (isDeleteModalOpen) { // Apenas se estiver aberto
          console.log("LOG DEBUG: [AdminClientAreasPage] useEffect detectou areaToDelete como null, FECHANDO MODAL DE EXCLUSÃO (se aberto).");
          setIsDeleteModalOpen(false);
       }
    }
  }, [areaToDelete, isDeleteModalOpen]); // Adicionado isDeleteModalOpen para evitar setar se já estiver fechado

  const handleCloseDeleteModal = () => {
    console.log("LOG DEBUG: [AdminClientAreasPage] handleCloseDeleteModal ACIONADO");
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setAreaToDelete(null); 
  };

  const handleConfirmDelete = async () => { 
    if (!areaToDelete) return;
    
    console.log(`LOG DEBUG: [AdminClientAreasPage] handleConfirmDelete para área ID: ${areaToDelete.upload_area_id}`);
    setIsDeleting(true);
    const actionKey = `delete_${areaToDelete.upload_area_id}`;
    setActionInProgress(prev => new Set(prev).add(actionKey));
    setFeedbackMessage(null);

    try {
      await deleteClientUploadArea(areaToDelete.upload_area_id);
      setFeedbackMessage({ type: 'success', message: `Área "${areaToDelete.gdrive_folder_name}" (Cliente: ${areaToDelete.client_name}) excluída com sucesso.` });
      if (addActivity) addActivity(`Área de cliente "${areaToDelete.client_name}" (ID: ${areaToDelete.upload_area_id}) excluída.`);
      await loadData(true); 
    } catch (err) {
      setFeedbackMessage({ type: 'error', message: (err instanceof Error ? err.message : 'Falha ao excluir a área.') });
    } finally {
      setIsDeleting(false);
      setActionInProgress(prev => { const next = new Set(prev); next.delete(actionKey); return next; });
      setIsDeleteModalOpen(false); 
      setAreaToDelete(null);     
    }
  };

  if (isLoading && areas.length === 0 && !error) { 
    return <div className="loading-message"><FiLoader className="spin-animation" /> Carregando dados das áreas de cliente...</div>;
  }

  if (error && areas.length === 0 && !isLoading && !feedbackMessage) {
    return <div className="error-message"><FiAlertTriangle /> Erro ao carregar dados: {error} <button onClick={() => loadData(false)} className="button-secondary">Tentar Novamente</button></div>;
  }

  console.log("LOG DEBUG: [AdminClientAreasPage] Estado de isDeleteModalOpen ANTES DO RETURN:", isDeleteModalOpen);
  console.log("LOG DEBUG: [AdminClientAreasPage] Estado de areaToDelete ANTES DO RETURN:", areaToDelete ? areaToDelete.upload_area_id : null);

  return (
    <>
      <div className="admin-client-areas-page list-card">
        <div className="admin-areas-header">
          <h2><FiUsers /> Gerenciamento de Áreas de Upload de Cliente</h2>
          <div className="admin-areas-header-actions">
            <DriveCycleIndicator timeLeftSeconds={timeLeftSeconds} cycleDurationMinutes={cycleDurationMinutes} />
            <button onClick={handleManualRefresh} className="button-refresh" disabled={actionInProgress.has('loading_main') || isLoading}>
              <FiRefreshCw size={14} className={(actionInProgress.has('loading_main') || isLoading) ? 'spin-animation' : ''} />
              {(actionInProgress.has('loading_main') || isLoading) ? 'Atualizando...' : 'Atualizar Grid'}
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
              placeholder="Digite o nome, ticket, email, pasta ou status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {feedbackMessage && (
          <NotificationBanner
            type={feedbackMessage.type}
            message={feedbackMessage.message}
            onDismiss={() => setFeedbackMessage(null)}
          />
        )}
        {pollingError && !feedbackMessage && ( // Mostra erro de polling se não houver outro feedback ativo
             <NotificationBanner type="error" message={`Falha ao buscar atualizações: ${pollingError}`} onDismiss={() => setPollingError(null)} />
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
                    className={`clickable-row ${highlightedRowIds.has(area.upload_area_id) ? 'row-highlight-animation' : ''}`}
                  >
                    <td data-label="Cliente" className="client-name-cell" onClick={() => handleOpenDetailsModal(area)}>{area.client_name || 'N/A'}</td>
                    <td data-label="Ticket ID" onClick={() => handleOpenDetailsModal(area)}>{area.ticket_id || 'N/A'}</td>
                    <td data-label="Pasta no Drive" className="drive-folder-cell truncate" title={area.gdrive_folder_name} onClick={() => handleOpenDetailsModal(area)}>
                      {area.gdrive_folder_url ? (
                        <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          {area.gdrive_folder_name}
                        </a>
                      ) : (
                        <span>{area.gdrive_folder_name || 'N/A'}</span>
                      )}
                    </td>
                    <td data-label="Status da Área" className="status-cell" onClick={() => handleOpenDetailsModal(area)}>
                        <span className={getAreaStatusClassName(area.upload_area_status)}>
                          {area.upload_area_status || 'N/A'}
                        </span>
                    </td>
                    <td data-label="Data Criação" onClick={() => handleOpenDetailsModal(area)}>{new Date(area.area_creation_date).toLocaleString('pt-BR')}</td>
                    <td data-label="Ações" className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-container">
                        <button onClick={() => handleOpenDetailsModal(area)} className="action-btn-icon" title="Ver Detalhes"><FiEye size={16} /></button>
                        <button 
                            onClick={() => handleDownload(area.upload_area_id, area.client_name)} 
                            className="action-btn-icon download" 
                            title="Baixar arquivo do Drive para a fila" 
                            disabled={actionInProgress.has(`download_${area.upload_area_id}`)}
                        > <FiDownloadCloud size={16} />
                        </button>
                        <button onClick={() => handleOpenUpdateStatusModal(area)} className="action-btn-icon edit" title="Mudar Status da Área"><FiEdit size={16} /></button>
                        <button onClick={() => handleOpenEditNotesModal(area)} className={`action-btn-icon notes ${area.upload_area_notes ? 'has-notes' : ''}`} title={area.upload_area_notes ? `Ver/Editar Notas` : "Adicionar Notas"}><FiFileText size={16} /></button>
                        <button 
                            onClick={() => handleOpenDeleteModal(area)} 
                            className="action-btn-icon delete" 
                            title="Excluir Área Permanentemente" 
                            disabled={actionInProgress.has(`delete_${area.upload_area_id}`)}
                        > <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-list">
              {isLoading && !error ? '' : (searchQuery ? `Nenhum resultado encontrado para "${searchQuery}".` : 'Nenhuma área de upload de cliente encontrada.')}
            </div>
          )}
        </div>
      </div>
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={areaToDelete?.client_name || ''} 
        folderName={areaToDelete?.gdrive_folder_name}
        ticketId={areaToDelete?.ticket_id}
      />

      <ClientAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        area={currentAreaForDetails}
      />

      {isStatusModalOpen && currentAreaForStatusEdit && (
         <div className="modal-overlay active" onClick={handleCloseStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseStatusModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingStatus}>&times;</button>
            <h2>Alterar Status da Área</h2>
            <p>Cliente: <strong>{currentAreaForStatusEdit.client_name}</strong> (Pasta: {currentAreaForStatusEdit.gdrive_folder_name})</p>
            <div className="form-group">
                <label htmlFor="status-select">Novo Status:</label>
                <select id="status-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={isSubmittingStatus}>
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>            
            </div>
            {statusUpdateError && <p className="modal-input-error" style={{color: 'var(--error-color)'}}>{statusUpdateError}</p>}
            {statusUpdateSuccess && <p className="modal-success-message" style={{color: 'var(--success-color)'}}>{statusUpdateSuccess}</p>}
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
            <button onClick={handleCloseNotesModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingNotes}>&times;</button>
            <h2>Notas Internas da Área</h2>
            <p>Cliente: <strong>{currentAreaForNotesEdit.client_name}</strong> (Ticket: {currentAreaForNotesEdit.ticket_id || 'N/A'})</p>
            <div className="form-group">
                <label htmlFor="notes-textarea">Conteúdo das Notas</label>
                <textarea id="notes-textarea" value={newNotesContent} onChange={(e) => setNewNotesContent(e.target.value)} rows={10} placeholder='Digite aqui as notas internas para esta área...' disabled={isSubmittingNotes}></textarea>
            </div>
            {notesUpdateError && <p className="modal-input-error" style={{color: 'var(--error-color)'}}>{notesUpdateError}</p>}
            {notesUpdateSuccess && <p className="modal-success-message" style={{color: 'var(--success-color)'}}>{notesUpdateSuccess}</p>}
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