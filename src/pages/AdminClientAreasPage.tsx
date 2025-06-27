// src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  fetchAdminClientUploadAreaDetails,
  updateClientUploadAreaNotes,
  downloadFromDrive,
  deleteClientUploadArea,
  markDatabaseForDiscard 
} from '../services/api';
import type { AdminClientUploadAreaDetail } from '../types/api';
import {
  FiAlertTriangle, FiRefreshCw, FiFileText,
  FiDownloadCloud, FiTrash2, FiUsers, FiSearch, FiSave, FiEye,
  FiLoader
} from 'react-icons/fi';
import { isEqual } from 'lodash';

import DriveCycleIndicator from '../components/common/DriveCycleIndicator';
import { useDriveCycle } from '../contexts/DriveCycleContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';
import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';
import { useLastUpdated } from '../contexts/LastUpdatedContext';

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

// << NOVO: Status que indicam que uma área está "ativa" ou em processamento e não deve ser excluída >>
const AREA_PROCESSING_STATUSES: string[] = [
  "backup em processamento",
  "download concluído pelo suporte", // Implica que está na fila ou prestes a ser processado
  "upload concluído pelo cliente"     // Aguardando download/processamento pelo suporte
];

const AdminClientAreasPage: React.FC = () => {
  console.log("LOG DEBUG: AdminClientAreasPage RENDERIZOU (UX Melhorias Delete)");
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const [actionInProgress, setActionInProgress] = useState<Set<string>>(new Set());
  
  const { timeLeftSeconds, cycleDurationMinutes } = useDriveCycle();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [currentAreaForDetails, setCurrentAreaForDetails] = useState<AdminClientUploadAreaDetail | null>(null);
  
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
  
  const [shouldCascadeDeleteDatabases, setShouldCascadeDeleteDatabases] = useState<boolean>(false);
  // << NOVO ESTADO: Para controlar se a opção de cascata DEVE estar habilitada >>
  const [canActuallyCascadeDelete, setCanActuallyCascadeDelete] = useState<boolean>(false);

  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(new Set());
  const previousAreasRef = useRef<AdminClientUploadAreaDetail[]>([]);
  const driveCycleUpdateDoneRef = useRef<boolean>(false);

  const { addActivity } = useLastUpdated();

  useEffect(() => {
    previousAreasRef.current = areas;
  }, [areas]);

  const updateTimestamp = () => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  };

  const loadData = useCallback(async (isPollOrManualRefresh = false) => {
    // ... (lógica do loadData permanece a mesma da sua versão estável)
    const isInitialLoad = !previousAreasRef.current.length && !isPollOrManualRefresh;
    if (isInitialLoad || (isPollOrManualRefresh && !isPollOrManualRefresh)) { setIsLoading(true); }
    const currentLoadingAction = isPollOrManualRefresh ? 'loading_poll' : 'loading_initial';
    setActionInProgress(prev => new Set(prev).add(currentLoadingAction));
    if (!isPollOrManualRefresh) setError(null);
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
      setPollingError(null); 
      if (!isPollOrManualRefresh) setError(null); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      if (!isPollOrManualRefresh) { setError(errorMsg); } 
      else { setPollingError(errorMsg); console.warn("Erro durante polling de áreas:", errorMsg); }
    } finally {
      if (isInitialLoad || (isPollOrManualRefresh && !isPollOrManualRefresh)) { setIsLoading(false); }
      setActionInProgress(prev => { const next = new Set(prev); next.delete(currentLoadingAction); return next; });
    }
  }, [addActivity]); // Removido 'error' e adicionado 'addActivity' se usado

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    const anyModalOpen = isNotesModalOpen || isDetailsModalOpen || isDeleteModalOpen;
    const mainLoadingInProgress = actionInProgress.has('loading_initial') || actionInProgress.has('loading_poll') || isLoading;
    const intervalId = setInterval(() => {
      if (!anyModalOpen && !mainLoadingInProgress && actionInProgress.size === 0) {
        loadData(true);
      }
    }, REFRESH_AREAS_INTERVAL);
    return () => clearInterval(intervalId);
  }, [loadData, isNotesModalOpen, isDetailsModalOpen, isDeleteModalOpen, isLoading, actionInProgress]); 

  useEffect(() => {
    if (timeLeftSeconds <= 0 && !driveCycleUpdateDoneRef.current) {
      loadData(true); 
      driveCycleUpdateDoneRef.current = true; 
    }
    else if (timeLeftSeconds > 0 && driveCycleUpdateDoneRef.current) {
      driveCycleUpdateDoneRef.current = false;
    }
  }, [timeLeftSeconds, loadData]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => { setFeedbackMessage(null); }, 7000); 
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
    setFeedbackMessage(null);
    setPollingError(null); 
    await loadData(false);
  };

  const handleOpenDetailsModal = (area: AdminClientUploadAreaDetail) => {
    setCurrentAreaForDetails(area);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setTimeout(() => setCurrentAreaForDetails(null), 300);
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
    // ... (lógica de handleSubmitNotesUpdate permanece a mesma)
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
    // ... (lógica de handleDownload permanece a mesma)
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
    
    // << NOVO: Determinar se a cascata é possível e se o checkbox deve ser habilitado >>
    const hasDiscardableBackups = area.processed_backups?.some(
        backup => backup.pb_status?.toLowerCase() === 'ativo'
    ) || false;
    setCanActuallyCascadeDelete(hasDiscardableBackups);
    
    // Se não puder cascatear, garante que o checkbox esteja desmarcado. Sempre começa desmarcado.
    setShouldCascadeDeleteDatabases(false); 
    
    setAreaToDelete(area); 
  };

  useEffect(() => {
    if (areaToDelete) {
      console.log("LOG DEBUG: [AdminClientAreasPage] useEffect detectou areaToDelete:", areaToDelete.upload_area_id, "ABRINDO MODAL DE EXCLUSÃO.");
      setIsDeleteModalOpen(true);
    }
  }, [areaToDelete]);

  const handleCloseDeleteModal = () => {
    console.log("LOG DEBUG: [AdminClientAreasPage] handleCloseDeleteModal ACIONADO");
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setAreaToDelete(null); 
  };

  const handleConfirmDelete = async () => { 
    if (!areaToDelete) return;
    
    const areaIdToDelete = areaToDelete.upload_area_id;
    const clientName = areaToDelete.client_name;
    const folderName = areaToDelete.gdrive_folder_name;
    const ticketIdForCascade = areaToDelete.ticket_id; 

    console.log(`LOG DEBUG: [AdminClientAreasPage] handleConfirmDelete para área ID: ${areaIdToDelete}. Cascata: ${shouldCascadeDeleteDatabases}`);
    setIsDeleting(true);
    const actionKey = `delete_${areaIdToDelete}`;
    setActionInProgress(prev => new Set(prev).add(actionKey));
    setFeedbackMessage(null);

    let cumulativeErrorMessages: string[] = [];
    let cumulativeSuccessMessages: string[] = [];

    try {
      await deleteClientUploadArea(areaIdToDelete);
      cumulativeSuccessMessages.push(`Área "${folderName}" (Cliente: ${clientName}) excluída.`);
      if (addActivity) addActivity(`Área de cliente "${clientName}" (ID: ${areaIdToDelete}) excluída.`);

      if (shouldCascadeDeleteDatabases && canActuallyCascadeDelete) { // Só tenta cascata se permitido e possível
        cumulativeSuccessMessages.push("Iniciando descarte em cascata dos bancos...");
        const backupsToDiscard = areaToDelete.processed_backups?.filter(b => b.pb_status?.toLowerCase() === 'ativo') || [];
        
        if (backupsToDiscard.length > 0) {
          if (!ticketIdForCascade) {
            cumulativeErrorMessages.push("AVISO Cascata: Ticket ID da área não encontrado para confirmar descarte dos bancos. Descarte-os manualmente.");
          } else {
            for (const backup of backupsToDiscard) {
              try {
                await markDatabaseForDiscard(backup.pb_id, ticketIdForCascade); 
                cumulativeSuccessMessages.push(`Banco "${backup.pb_restored_alias}" descartado.`);
                if (addActivity) addActivity(`Cascata: Banco "${backup.pb_restored_alias}" (Área: "${clientName}") descartado.`);
              } catch (discardErr) {
                const errMsg = discardErr instanceof Error ? discardErr.message : `Falha ao descartar banco ${backup.pb_restored_alias}.`;
                cumulativeErrorMessages.push(errMsg);
              }
            }
          }
        } else {
          cumulativeSuccessMessages.push("Nenhum banco 'Ativo' encontrado para descarte em cascata.");
        }
      }
      await loadData(true); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao excluir a área principal.';
      cumulativeErrorMessages.push(errorMessage);
    } finally {
      setIsDeleting(false);
      setActionInProgress(prev => { const next = new Set(prev); next.delete(actionKey); return next; });
      setIsDeleteModalOpen(false); 
      setAreaToDelete(null);     
      
      if (cumulativeErrorMessages.length > 0) {
        setFeedbackMessage({ type: 'error', message: `Concluído com erros: ${cumulativeErrorMessages.join('; ')}. Sucessos: ${cumulativeSuccessMessages.join('; ')}` });
      } else if (cumulativeSuccessMessages.length > 0) {
        setFeedbackMessage({ type: 'success', message: cumulativeSuccessMessages.join('; ') });
      }
    }
  };

  if (isLoading && areas.length === 0 && !error) { 
    return <div className="loading-message"><FiLoader className="spin-animation" /> Carregando dados das áreas de cliente...</div>;
  }

  if (error && areas.length === 0 && !isLoading && !feedbackMessage) {
    return <div className="error-message"><FiAlertTriangle /> Erro ao carregar dados: {error} <button onClick={() => loadData(false)} className="button-secondary">Tentar Novamente</button></div>;
  }

  return (
    <>
      {/* Header fixo */}
      <div className="admin-areas-fixed-header">
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
        {pollingError && !feedbackMessage && (
             <NotificationBanner type="error" message={`Falha ao buscar atualizações: ${pollingError}`} onDismiss={() => setPollingError(null)} />
        )}
      </div>

      {/* Container da tabela com scroll */}
      <div className="admin-areas-table-container">
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
              {filteredAreas.map((area) => {
                // << NOVO: Verifica se a área está em processamento para desabilitar o botão de excluir >>
                const isAreaCurrentlyProcessing = AREA_PROCESSING_STATUSES.includes(area.upload_area_status.toLowerCase());
                return (
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
                        {/* BOTÃO DE EDITAR STATUS FOI REMOVIDO */}
                        <button onClick={() => handleOpenEditNotesModal(area)} className={`action-btn-icon notes ${area.upload_area_notes ? 'has-notes' : ''}`} title={area.upload_area_notes ? `Ver/Editar Notas` : "Adicionar Notas"}><FiFileText size={16} /></button>
                        <button 
                            onClick={() => handleOpenDeleteModal(area)} 
                            className="action-btn-icon delete" 
                            title={isAreaCurrentlyProcessing ? `Não é possível excluir: área em "${area.upload_area_status}"` : "Excluir Área Permanentemente"}
                            disabled={actionInProgress.has(`delete_${area.upload_area_id}`) || isAreaCurrentlyProcessing} // << DESABILITA SE ESTIVER PROCESSANDO >>
                        > <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
        shouldCascadeDelete={shouldCascadeDeleteDatabases} // << NOVA PROP >>
        onCascadeDeleteChange={setShouldCascadeDeleteDatabases} // << NOVA PROP >>
        canCascadeDelete={canActuallyCascadeDelete} // << NOVA PROP >>
      />

      <ClientAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        area={currentAreaForDetails}
      />

      {/* Modal de Atualização de Status REMOVIDO */}

      {isNotesModalOpen && currentAreaForNotesEdit && (
        // ... (código do modal de notas permanece o mesmo)
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