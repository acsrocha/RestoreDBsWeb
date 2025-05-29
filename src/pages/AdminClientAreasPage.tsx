// src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchAdminClientUploadAreaDetails,
  updateClientUploadAreaStatus,
  updateClientUploadAreaNotes
} from '../services/api';
import type { AdminClientUploadAreaDetail } from '../types/api';
import { FiEdit, FiExternalLink, FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiFileText } from 'react-icons/fi';

import DriveCycleIndicator from '../components/common/DriveCycleIndicator';
import { useDriveCycle } from '../contexts/DriveCycleContext';

// Estilos do modal (mantidos como antes)
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
  opacity: 1,
  visibility: 'visible',
  transition: 'opacity 0.25s ease-in-out',
};

const modalHiddenOverlayStyle: React.CSSProperties = {
  ...modalOverlayStyle,
  opacity: 0,
  visibility: 'hidden',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--card-bg-color)',
  color: 'var(--text-color)',
  padding: '25px 30px',
  borderRadius: 'var(--border-radius-medium)',
  boxShadow: 'var(--shadow), 0 8px 30px rgba(0, 0, 0, 0.15)',
  width: '100%',
  maxWidth: '520px',
  position: 'relative',
  border: '1px solid var(--border-color)',
  transform: 'scale(1)',
  opacity: 1,
  transition: 'transform 0.25s ease-in-out, opacity 0.25s ease-in-out',
};

const modalHiddenContentStyle: React.CSSProperties = {
    ...modalContentStyle,
    transform: 'scale(0.95)',
    opacity: 0,
};

const statusOptions = [
  "Criada", "Aguardando Upload Cliente", "Upload Concluído pelo Cliente",
  "Download Concluído pelo Suporte", "Backup em Processamento",
  "Backup Processado - Sucesso", "Backup Processado - Falha",
  "Problema no Upload - Contatar Cliente", "Problema na Pasta", "Arquivado",
];


const AdminClientAreasPage: React.FC = () => {
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // O hook useDriveCycle agora nos dá os valores diretos
  const {
    timeLeftSeconds,
    cycleDurationMinutes,
  } = useDriveCycle();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [currentAreaForStatusEdit, setCurrentAreaForStatusEdit] = useState<AdminClientUploadAreaDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);

  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [currentAreaForNotesEdit, setCurrentAreaForNotesEdit] = useState<AdminClientUploadAreaDetail | null>(null);
  const [newNotesContent, setNewNotesContent] = useState<string>('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState<boolean>(false);
  const [notesUpdateError, setNotesUpdateError] = useState<string | null>(null);
  const [notesUpdateSuccess, setNotesUpdateSuccess] = useState<string | null>(null);

  const updateTimestamp = () => {
    setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
  };

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const data = await fetchAdminClientUploadAreaDetails();
      setAreas(data);
      updateTimestamp();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      setError(errorMsg);
    } finally {
      if (!isManualRefresh) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    const pollInterval = 15 * 1000;
    const intervalId = setInterval(() => {
      if (!isStatusModalOpen && !isNotesModalOpen) {
          loadData(true);
      }
    }, pollInterval);
    return () => clearInterval(intervalId);
  }, [loadData, isStatusModalOpen, isNotesModalOpen]);


  const handleManualRefresh = () => {
    loadData(true);
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
    if (!currentAreaForStatusEdit || !newStatus.trim()) {
      setStatusUpdateError("Nenhuma área selecionada ou status inválido.");
      return;
    }
    setIsSubmittingStatus(true);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(null);
    try {
      const response = await updateClientUploadAreaStatus(currentAreaForStatusEdit.upload_area_id, newStatus);
      setStatusUpdateSuccess(response?.message || "Status atualizado com sucesso!");
      setAreas(prevAreas =>
        prevAreas.map(area =>
          area.upload_area_id === currentAreaForStatusEdit.upload_area_id
            ? { ...area, upload_area_status: newStatus }
            : area
        )
      );
      updateTimestamp();
      setTimeout(() => {
        handleCloseStatusModal();
      }, 2000);
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
    if (!currentAreaForNotesEdit) {
      setNotesUpdateError("Nenhuma área selecionada para edição de notas.");
      return;
    }
    setIsSubmittingNotes(true);
    setNotesUpdateError(null);
    setNotesUpdateSuccess(null);
    try {
      const response = await updateClientUploadAreaNotes(currentAreaForNotesEdit.upload_area_id, newNotesContent);
      setNotesUpdateSuccess(response?.message || "Notas atualizadas com sucesso!");
      setAreas(prevAreas =>
        prevAreas.map(area =>
          area.upload_area_id === currentAreaForNotesEdit.upload_area_id
            ? { ...area, upload_area_notes: newNotesContent }
            : area
        )
      );
      updateTimestamp();
      setTimeout(() => {
        handleCloseNotesModal();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar notas.';
      setNotesUpdateError(errorMsg);
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  if (isLoading && areas.length === 0) {
    return <div className="loading-message" style={{padding: '20px', textAlign: 'center'}}>Carregando dados das áreas de cliente...</div>;
  }

  if (error && areas.length === 0 && !isLoading && !isStatusModalOpen && !isNotesModalOpen) {
    return <div className="error-message">Erro ao carregar dados: {error} <button onClick={() => loadData(true)} className="button-secondary" style={{marginLeft: '10px'}}>Tentar Novamente</button></div>;
  }

  return (
    <>
      <div className="admin-client-areas-page list-card" style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '15px'
        }}>
          <h2>Gerenciamento de Áreas de Upload de Cliente</h2>
          <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
            
            {/* --- ALTERAÇÃO PRINCIPAL AQUI --- */}
            {/* O componente agora recebe o tempo restante diretamente do contexto */}
            <DriveCycleIndicator
                timeLeftSeconds={timeLeftSeconds}
                cycleDurationMinutes={cycleDurationMinutes}
            />
            
            <button onClick={handleManualRefresh} className="button-refresh" disabled={isLoading}>
              <FiRefreshCw size={14} style={{ marginRight: isLoading ? '8px' : '5px' }} className={isLoading ? 'spin-animation' : ''} />
              {isLoading ? 'Atualizando...' : 'Atualizar Grid'}
            </button>
          </div>
        </div>
        {lastUpdated && <p style={{ fontSize: '0.8em', color: 'var(--text-secondary-color)', textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Grid atualizada às: {lastUpdated}
        </p>}

        {error && !isLoading && (
             <div className="notification-banner notification-error" style={{marginBottom: '15px'}}>
                <p><FiAlertTriangle style={{ marginRight: '8px', verticalAlign: 'middle' }}/>Falha ao buscar atualizações da grid: {error}</p>
            </div>
        )}

        {areas.length === 0 && !isLoading && !error && (
            <div className="info-message empty-list" style={{textAlign: 'center', padding: '20px'}}>Nenhuma área de upload de cliente encontrada.</div>
        )}
        {areas.length > 0 && (
            <div className="table-wrapper" style={{flexGrow: 1, overflowY: 'auto'}}>
            <table className="data-table">
                <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Ticket ID</th>
                    <th>Pasta no Drive</th>
                    <th>Criação da Área</th>
                    <th>Status da Área</th>
                    <th>Notas da Área</th>
                    <th>Backups Processados</th>
                    <th>Ações</th>
                </tr>
                </thead>
                <tbody>
                {areas.map((area) => (
                    <tr key={area.upload_area_id}>
                    <td data-label="Cliente">{area.client_name || 'N/A'}</td>
                    <td data-label="Email">{area.client_email || 'N/A'}</td>
                    <td data-label="Ticket ID">{area.ticket_id || 'N/A'}</td>
                    <td data-label="Pasta no Drive">
                        {area.gdrive_folder_url ? (
                        <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer" title={area.gdrive_folder_name} className="link-icon-text">
                            <FiExternalLink style={{ marginRight: '5px', verticalAlign: 'middle' }} size={14}/>
                            {area.gdrive_folder_name || 'Abrir Pasta'}
                        </a>
                        ) : (
                        area.gdrive_folder_name || 'N/A'
                        )}
                    </td>
                    <td data-label="Criação da Área">{area.area_creation_date}</td>
                    <td data-label="Status da Área">{area.upload_area_status || 'N/A'}</td>
                    <td data-label="Notas da Área" title={area.upload_area_notes || undefined} style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {area.upload_area_notes || '-'}
                    </td>
                    <td data-label="Backups Processados">
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
                    <td data-label="Ações" style={{whiteSpace: 'nowrap'}}>
                        <button
                          onClick={() => handleOpenUpdateStatusModal(area)}
                          className="action-button"
                          title="Mudar Status da Área"
                          style={{fontSize: '0.85em', padding: '6px 10px', minWidth: '90px', marginRight: '5px'}}
                        >
                          <FiEdit size={14} style={{ marginRight: '5px' }} /> Status
                        </button>
                        <button
                          onClick={() => handleOpenEditNotesModal(area)}
                          className="button-secondary"
                          title="Editar Notas da Área"
                          style={{fontSize: '0.85em', padding: '6px 10px', minWidth: '90px'}}
                        >
                          <FiFileText size={14} style={{ marginRight: '5px' }} /> Notas
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {/* Modais (código completo omitido para brevidade, mas deve ser mantido como estava) */}
      {isStatusModalOpen && currentAreaForStatusEdit && ( <div style={isStatusModalOpen ? modalOverlayStyle : modalHiddenOverlayStyle} onClick={handleCloseStatusModal}><div style={isStatusModalOpen ? modalContentStyle : modalHiddenContentStyle} onClick={(e) => e.stopPropagation()}><button onClick={handleCloseStatusModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingStatus}>&times;</button><h2>Mudar Status da Área</h2><p><strong>Cliente:</strong> {currentAreaForStatusEdit.client_name}</p><p><strong>Pasta:</strong> {currentAreaForStatusEdit.gdrive_folder_name}</p><p style={{marginBottom: '20px'}}><strong>Status Atual:</strong> <span style={{fontWeight: 'bold'}}>{currentAreaForStatusEdit.upload_area_status}</span></p><div className="form-group"><label htmlFor="newStatusSelect" style={{marginBottom: '8px'}}>Novo Status:</label><select id="newStatusSelect" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={isSubmittingStatus} style={{width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)',borderRadius: 'var(--border-radius-small)', backgroundColor: 'var(--bg-color)',color: 'var(--text-color)', fontSize: '0.95em', boxSizing: 'border-box'}}>{statusOptions.map(option => ( <option key={option} value={option}>{option}</option> ))}</select></div>{statusUpdateError && <div className="notification-banner notification-error" style={{marginBottom: '15px'}}><p><FiAlertTriangle style={{ marginRight: '8px', verticalAlign: 'middle' }}/>{statusUpdateError}</p></div>}{statusUpdateSuccess && <div className="notification-banner notification-success" style={{marginBottom: '15px'}}><p><FiCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }}/>{statusUpdateSuccess}</p></div>}<div className="modal-actions"><button onClick={handleCloseStatusModal} className="button-secondary" disabled={isSubmittingStatus}>Cancelar</button><button onClick={handleSubmitStatusUpdate} className="button-primary" disabled={isSubmittingStatus}>{isSubmittingStatus ? 'Salvando...' : <><FiCheckCircle style={{ marginRight: '5px' }} /> Salvar Status</>}</button></div></div></div>)}
      {isNotesModalOpen && currentAreaForNotesEdit && ( <div style={isNotesModalOpen ? modalOverlayStyle : modalHiddenOverlayStyle} onClick={handleCloseNotesModal}><div style={isNotesModalOpen ? modalContentStyle : modalHiddenContentStyle} onClick={(e) => e.stopPropagation()}><button onClick={handleCloseNotesModal} className="modal-close-button" title="Fechar Modal" disabled={isSubmittingNotes}>&times;</button><h2>Editar Notas da Área</h2><p><strong>Cliente:</strong> {currentAreaForNotesEdit.client_name}</p><p style={{marginBottom: '20px'}}><strong>Pasta:</strong> {currentAreaForNotesEdit.gdrive_folder_name}</p><div className="form-group"><label htmlFor="newNotesTextarea" style={{marginBottom: '8px'}}>Notas:</label><textarea id="newNotesTextarea" value={newNotesContent} onChange={(e) => setNewNotesContent(e.target.value)} disabled={isSubmittingNotes} rows={5} style={{width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)',borderRadius: 'var(--border-radius-small)', backgroundColor: 'var(--bg-color)',color: 'var(--text-color)', fontSize: '0.95em', boxSizing: 'border-box', resize: 'vertical',fontFamily: 'inherit'}} placeholder="Digite as notas aqui..."/></div>{notesUpdateError && <div className="notification-banner notification-error" style={{marginBottom: '15px'}}><p><FiAlertTriangle style={{ marginRight: '8px', verticalAlign: 'middle' }}/>{notesUpdateError}</p></div>}{notesUpdateSuccess && <div className="notification-banner notification-success" style={{marginBottom: '15px'}}><p><FiCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }}/>{notesUpdateSuccess}</p></div>}<div className="modal-actions"><button onClick={handleCloseNotesModal} className="button-secondary" disabled={isSubmittingNotes}>Cancelar</button><button onClick={handleSubmitNotesUpdate} className="button-primary" disabled={isSubmittingNotes}>{isSubmittingNotes ? 'Salvando...' : <><FiCheckCircle style={{ marginRight: '5px' }} /> Salvar Notas</>}</button></div></div></div>)}
    </>
  );
};

export default AdminClientAreasPage;