import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiSearch, FiEye, FiDownload, FiTrash2, FiUsers, FiCheckCircle, FiDatabase, FiAlertTriangle, FiEdit2, FiSettings, FiArchive, FiCpu, FiClock, FiEdit } from 'react-icons/fi';
import { fetchAdminClientUploadAreaDetails, downloadFromDrive, deleteClientUploadArea } from '../services/clientAreaApi';
import { useNotification } from '../hooks/useNotification';
import { useDriveCycle } from '../contexts/DriveCycleContext';
import DriveCycleIndicator from '../components/common/DriveCycleIndicator';
import { useUnifiedTracking } from '../contexts/UnifiedTrackingContext';

import ClientAreaDetailsModal from '../components/shared/ClientAreaDetailsModal';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import CreateClientAreaModal from '../components/shared/CreateClientAreaModal';
import type { AdminClientUploadAreaDetail } from '../types/api';
import '../styles/components/AdminClientAreas.css';

const AdminClientAreasPage: React.FC = () => {
  const [clientAreas, setClientAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modais
  const [selectedArea, setSelectedArea] = useState<AdminClientUploadAreaDetail | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldCascadeDelete, setShouldCascadeDelete] = useState(false);
  
  const { showError, showSuccess, showInfo } = useNotification();
  const { startDownload, updateProgress, completeItem, failItem } = useUnifiedTracking();
  const { 
    timeLeftSeconds, 
    cycleDurationMinutes, 
    forceSync,
    lastSuccessfulSyncTime,
    isSyncing
  } = useDriveCycle();

  const [isFetching, setIsFetching] = useState(false);
  const [downloadingAreas, setDownloadingAreas] = useState<Map<string, {clientName: string, startTime: Date, progress: number}>>(new Map());
  const [statsLoading, setStatsLoading] = useState(false);
  const [prevStats, setPrevStats] = useState({ total: 0, active: 0, waiting: 0, processed: 0 });

  const fetchClientAreas = async () => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      setIsLoading(true);
      setStatsLoading(true);
      setError(null);
      
      const data = await fetchAdminClientUploadAreaDetails();
      const newData = Array.isArray(data) ? data : [];
      
      // Calcular novas estatísticas
      const newStats = {
        total: newData.length,
        active: newData.filter(area => area.upload_area_status?.toLowerCase().includes('ativo')).length,
        waiting: newData.filter(area => area.upload_area_status?.toLowerCase().includes('aguardando')).length,
        processed: newData.reduce((sum, area) => sum + (area.processed_backups?.length || 0), 0)
      };
      
      // Animar transição dos números
      setTimeout(() => {
        setPrevStats(newStats);
        setClientAreas(newData);
        setStatsLoading(false);
      }, 300);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar áreas de cliente';
      setError(errorMessage);
      showError('Falha ao carregar áreas de cliente: ' + errorMessage);
      setStatsLoading(false);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchClientAreas();
  }, []);

  const filteredAreas = clientAreas.filter(area => 
    !searchTerm || 
    area.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.gdrive_folder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.upload_area_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers para ações
  const handleViewDetails = (area: AdminClientUploadAreaDetail) => {
    setSelectedArea(area);
    setShowDetailsModal(true);
  };

  const handleDownload = async (area: AdminClientUploadAreaDetail) => {
    try {
      // Iniciar tracking unificado
      const trackingId = startDownload(area.gdrive_folder_name || 'Pasta do Drive', 'drive');
      
      setDownloadingAreas(prev => new Map(prev).set(area.upload_area_id, {
        clientName: area.client_name || 'Cliente',
        startTime: new Date(),
        progress: 0
      }));
      
      // Simular progresso de download (em produção viria da API)
      const progressInterval = setInterval(() => {
        setDownloadingAreas(current => {
          const updated = new Map(current);
          const download = updated.get(area.upload_area_id);
          if (download && download.progress < 95) {
            const newProgress = Math.min(95, download.progress + Math.random() * 8 + 2);
            updated.set(area.upload_area_id, {
              ...download,
              progress: newProgress
            });
            // Atualizar progresso no tracking unificado
            updateProgress(trackingId, 'downloading', newProgress);
            return updated;
          }
          return current;
        });
      }, 800);
      
      // Executar download real
      await downloadFromDrive(area.upload_area_id);
      
      // Limpar intervalo
      clearInterval(progressInterval);
      
      // Simular fluxo completo: download -> extração -> validação -> fila
      updateProgress(trackingId, 'extracting', 100);
      setTimeout(() => updateProgress(trackingId, 'validating', 100), 1000);
      setTimeout(() => updateProgress(trackingId, 'queued', 0), 2000);
      
      // Completar progresso local
      setDownloadingAreas(current => {
        const updated = new Map(current);
        const download = updated.get(area.upload_area_id);
        if (download) {
          updated.set(area.upload_area_id, {
            ...download,
            progress: 100
          });
        }
        return updated;
      });
      
      fetchClientAreas();
      showSuccess('Download iniciado com sucesso!');
      
    } catch (error: any) {
      showError('Erro ao iniciar download: ' + (error?.message || 'Erro desconhecido'));
      // Marcar como falhado no tracking
      if (trackingId) {
        failItem(trackingId, error?.message || 'Erro no download');
      }
    } finally {
      // Remover da lista local após 3 segundos
      setTimeout(() => {
        setDownloadingAreas(prev => {
          const newMap = new Map(prev);
          newMap.delete(area.upload_area_id);
          return newMap;
        });
      }, 3000);
    }
  };

  const handleDelete = (area: AdminClientUploadAreaDetail) => {
    setSelectedArea(area);
    setShouldCascadeDelete(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedArea) return;
    
    try {
      setIsDeleting(true);
      await deleteClientUploadArea(selectedArea.upload_area_id);
      showSuccess('Área de cliente excluída com sucesso!');
      setShowDeleteModal(false);
      setSelectedArea(null);
      fetchClientAreas();
    } catch (error: any) {
      showError('Erro ao excluir área: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowDeleteModal(false);
    setShowCreateModal(false);
    setSelectedArea(null);
    setShouldCascadeDelete(false);
  };

  const handleRowClick = (area: AdminClientUploadAreaDetail) => {
    setSelectedArea(area);
    setShowDetailsModal(true);
  };

  // Componente para animar números
  const AnimatedNumber: React.FC<{ value: number; isLoading: boolean }> = ({ value, isLoading }) => {
    const [displayValue, setDisplayValue] = useState(value);
    
    useEffect(() => {
      if (isLoading) return;
      
      const start = displayValue;
      const end = value;
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);
        
        setDisplayValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [value, isLoading]);
    
    return (
      <div className={`stat-number ${isLoading ? 'loading' : ''}`}>
        {isLoading ? '...' : displayValue}
      </div>
    );
  };

  const handleEdit = (area: AdminClientUploadAreaDetail) => {
    setSelectedArea(area);
    setShowDetailsModal(true);
  };

  return (
    <div className="detailed-monitoring-page">
      <div className="monitoring-header">
        <div className="header-left">
          <h1>👥 Gerenciamento de Áreas de Upload de Cliente</h1>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por cliente, ticket, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DriveCycleIndicator 
            cycleDurationMinutes={cycleDurationMinutes}
            timeLeftSeconds={timeLeftSeconds}
          />
          
          <button 
            onClick={forceSync}
            className="control-btn refresh"
            disabled={isSyncing}
            title="Atualizar agora"
          >
            <FiRefreshCw className={isSyncing ? 'spinning' : ''} />
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="control-btn primary"
            title="Nova Área"
          >
            <FiPlus />
          </button>
        </div>
      </div>
      
      <div className="statistics-dashboard">
        <div className="stat-card total">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-content">
            <AnimatedNumber value={clientAreas.length} isLoading={statsLoading} />
            <div className="stat-label">Total de Áreas</div>
          </div>
        </div>
        <div className="stat-card processing">
          <div className="stat-icon"><FiCheckCircle /></div>
          <div className="stat-content">
            <AnimatedNumber 
              value={clientAreas.filter(area => area.upload_area_status?.toLowerCase().includes('ativo')).length} 
              isLoading={statsLoading} 
            />
            <div className="stat-label">Áreas Ativas</div>
          </div>
        </div>
        <div className="stat-card failed">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-content">
            <AnimatedNumber 
              value={clientAreas.filter(area => area.upload_area_status?.toLowerCase().includes('aguardando')).length} 
              isLoading={statsLoading} 
            />
            <div className="stat-label">Aguardando Upload</div>
          </div>
        </div>
        <div className="stat-card eta">
          <div className="stat-icon"><FiDatabase /></div>
          <div className="stat-content">
            <AnimatedNumber 
              value={clientAreas.reduce((sum, area) => sum + (area.processed_backups?.length || 0), 0)} 
              isLoading={statsLoading} 
            />
            <div className="stat-label">Backups Processados</div>
          </div>
        </div>
        <div className="stat-card downloading">
          <div className="stat-icon"><FiDownload /></div>
          <div className="stat-content">
            <AnimatedNumber value={downloadingAreas.size} isLoading={false} />
            <div className="stat-label">Downloads em Progresso</div>
            {downloadingAreas.size > 0 && (
              <div className="stat-detail">
                {Array.from(downloadingAreas.entries()).map(([areaId, download]) => {
                  const elapsed = Math.floor((Date.now() - download.startTime.getTime()) / 1000);
                  const estimated = download.progress > 0 ? Math.floor((elapsed / download.progress) * (100 - download.progress)) : 0;
                  
                  return (
                    <div key={areaId} className="download-item">
                      <div className="download-header">
                        <span className="client-name">{download.clientName}</span>
                        <span className="download-percent">{Math.floor(download.progress)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${download.progress}%` }}
                        ></div>
                      </div>
                      <div className="download-time">
                        {estimated > 0 ? `${estimated}s restantes` : 'Calculando...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && clientAreas.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando áreas de cliente...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <FiAlertTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchClientAreas} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="empty-state">
          <FiUsers className="empty-icon" />
          <p>Nenhuma área de cliente encontrada.</p>
          {searchTerm ? (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              Limpar busca
            </button>
          ) : (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="control-button primary"
            >
              <FiPlus />
              Criar Primeira Área
            </button>
          )}
        </div>
      ) : (
        <section className="monitoring-section">
          <h2>
            <FiUsers className="section-icon" />
            Áreas de Upload de Cliente
            <span className="count-badge">{filteredAreas.length}</span>
          </h2>
          <div className="table-container">
            <table className="client-areas-table">
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
                {filteredAreas.map(area => (
                  <tr 
                    key={area.upload_area_id}
                    className={`table-row-clickable ${downloadingAreas.has(area.upload_area_id) ? 'syncing' : ''}`}
                    onClick={() => handleRowClick(area)}
                  >
                    <td>{area.client_name || 'N/A'}</td>
                    <td className="ticket-id">{area.ticket_id || 'N/A'}</td>
                    <td className="folder-name">{area.gdrive_folder_name}</td>
                    <td>
                      <span className={`status-badge ${area.upload_area_status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}>
                        {area.upload_area_status || 'Desconhecido'}
                      </span>
                    </td>
                    <td>{new Date(area.area_creation_date).toLocaleString('pt-BR')}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-icon view" 
                        title="Visualizar detalhes"
                        onClick={() => handleViewDetails(area)}
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="action-icon edit" 
                        title="Editar área"
                        onClick={() => handleEdit(area)}
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="action-icon sync" 
                        title="Sincronizar com Drive"
                        onClick={() => handleDownload(area)}
                      >
                        <FiRefreshCw className={downloadingAreas.has(area.upload_area_id) ? 'spinning' : ''} />
                      </button>
                      <button 
                        className="action-icon delete" 
                        title="Excluir área"
                        onClick={() => handleDelete(area)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      {/* Modais */}
      <ClientAreaDetailsModal
        isOpen={showDetailsModal}
        onClose={closeModals}
        clientArea={selectedArea}
      />
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeModals}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemName={selectedArea?.client_name || 'Área desconhecida'}
        folderName={selectedArea?.gdrive_folder_name}
        ticketId={selectedArea?.ticket_id}
        shouldCascadeDelete={shouldCascadeDelete}
        onCascadeDeleteChange={setShouldCascadeDelete}
        canCascadeDelete={(selectedArea?.processed_backups?.length || 0) > 0}
      />
      
      {showCreateModal && (
        <CreateClientAreaModal
          isOpen={showCreateModal}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            fetchClientAreas();
          }}
        />
      )}
    </div>
  );
};

export default AdminClientAreasPage;