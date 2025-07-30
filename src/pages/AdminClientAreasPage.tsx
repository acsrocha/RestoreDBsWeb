import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiSearch, FiEye, FiDownload, FiTrash2, FiUsers, FiCheckCircle, FiDatabase, FiAlertTriangle, FiEdit2 } from 'react-icons/fi';
import { fetchAdminClientUploadAreaDetails, downloadFromDrive, deleteClientUploadArea } from '../services/clientAreaApi';
import { useNotification } from '../hooks/useNotification';

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

  const [isFetching, setIsFetching] = useState(false);

  const fetchClientAreas = async () => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminClientUploadAreaDetails();
      setClientAreas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar áreas de cliente';
      setError(errorMessage);
      showError('Falha ao carregar áreas de cliente: ' + errorMessage);
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
      showInfo('Iniciando download do Google Drive...');
      await downloadFromDrive(area.upload_area_id);
      showSuccess('Download iniciado com sucesso!');
      fetchClientAreas();
    } catch (error: any) {
      showError('Erro ao iniciar download: ' + (error?.message || 'Erro desconhecido'));
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

  const handleEdit = (area: AdminClientUploadAreaDetail) => {
    setSelectedArea(area);
    setShowDetailsModal(true);
  };

  return (
    <div className="detailed-monitoring-page">
      <div className="monitoring-header">
        <div className="header-content">
          <div className="header-title">
            <h1>👥 Gerenciamento de Áreas de Upload de Cliente</h1>
            <p className="header-subtitle">
              Gerencie e monitore as áreas de upload criadas para os clientes
            </p>
          </div>
          <div className="header-actions">
            <div className="search-container">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, ticket, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <button 
              onClick={fetchClientAreas}
              className="control-button refresh"
              disabled={isLoading}
            >
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
              Atualizar
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="control-button primary"
            >
              <FiPlus />
              Nova Área
            </button>
          </div>
        </div>
      </div>

      <div className="statistics-dashboard">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiUsers />
          </div>
          <div className="stat-content">
            <div className="stat-number">{clientAreas.length}</div>
            <div className="stat-label">Total de Áreas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {clientAreas.filter(area => area.upload_area_status?.toLowerCase().includes('ativo')).length}
            </div>
            <div className="stat-label">Áreas Ativas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon processing">
            <FiDownload />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {clientAreas.filter(area => area.upload_area_status?.toLowerCase().includes('aguardando')).length}
            </div>
            <div className="stat-label">Aguardando Upload</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FiDatabase />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {clientAreas.reduce((sum, area) => sum + (area.processed_backups?.length || 0), 0)}
            </div>
            <div className="stat-label">Backups Processados</div>
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
                    className="table-row-clickable"
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
                        <FiDownload />
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