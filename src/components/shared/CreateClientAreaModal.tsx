import React, { useState } from 'react';
import { FiX, FiFolderPlus, FiLink, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';
import { createClientDriveArea } from '../../services/clientAreaApi';
import { useNotification } from '../../hooks/useNotification';

interface CreateClientAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClientAreaModal: React.FC<CreateClientAreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    ticketID: '',
    folderNameSuffix: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'pending' | ''>('');
  const [responseDetails, setResponseDetails] = useState<any>({});

  const { showSuccess, showError } = useNotification();

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (statusMessage) {
      setStatusMessage('');
      setStatusType('');
      setResponseDetails({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientEmail || !formData.ticketID) {
      setStatusMessage('E-mail do Cliente e ID do Ticket são obrigatórios.');
      setStatusType('error');
      return;
    }

    if (!formData.clientEmail.includes('@')) {
      setStatusMessage('Por favor, insira um e-mail válido para o cliente.');
      setStatusType('error');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Criando área de upload para o cliente... Por favor, aguarde.');
    setStatusType('pending');
    setResponseDetails({});

    try {
      const response = await createClientDriveArea(formData);
      setResponseDetails(response);
      
      if (response.success) {
        setStatusMessage(response.message || 'Área do cliente criada com sucesso!');
        setStatusType('success');
        showSuccess('Área de cliente criada com sucesso!');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setStatusMessage(response.message || 'Operação concluída com avisos. Verifique os detalhes.');
        setStatusType('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha crítica ao criar área do cliente.';
      setStatusMessage(`Erro: ${errorMessage}`);
      setStatusType('error');
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ clientName: '', clientEmail: '', ticketID: '', folderNameSuffix: '' });
      setStatusMessage('');
      setStatusType('');
      setResponseDetails({});
      onClose();
    }
  };

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div 
        className="modal-content create-area-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="modal-close-button"
          disabled={isSubmitting}
        >
          <FiX />
        </button>

        <div className="modal-header">
          <SiGoogledrive className="modal-icon" />
          <h2>Criar Nova Área de Cliente</h2>
        </div>

        <form onSubmit={handleSubmit} className="create-area-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="clientName">Nome do Cliente/Empresa</label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="Ex: Fortes Tecnologia"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">E-mail do Cliente *</label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                placeholder="Ex: contato@cliente.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ticketID">ID do Ticket/Chamado *</label>
              <input
                type="text"
                id="ticketID"
                name="ticketID"
                value={formData.ticketID}
                onChange={handleInputChange}
                placeholder="Ex: #12345, SUP-789"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="folderNameSuffix">Sufixo para Nome da Pasta</label>
              <input
                type="text"
                id="folderNameSuffix"
                name="folderNameSuffix"
                value={formData.folderNameSuffix}
                onChange={handleInputChange}
                placeholder="Ex: BackupInicial, DocumentosImportantes"
                disabled={isSubmitting}
              />
              <small className="field-help">
                Para ajudar a identificar a pasta no Drive
              </small>
            </div>
          </div>

          {statusMessage && (
            <div className={`status-message ${statusType}`}>
              <div className="status-header">
                {statusType === 'success' && <FiCheckCircle />}
                {statusType === 'error' && <FiAlertCircle />}
                {statusType === 'pending' && <FiAlertCircle />}
                <span>{statusMessage}</span>
              </div>
              {responseDetails.googleDriveFolderUrl && statusType === 'success' && (
                <div className="folder-link">
                  <FiLink />
                  <a 
                    href={responseDetails.googleDriveFolderUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {responseDetails.googleDriveFolderName || 'Acessar Pasta'}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="button-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={isSubmitting}
            >
              <FiFolderPlus />
              {isSubmitting ? 'Criando...' : 'Criar Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClientAreaModal;