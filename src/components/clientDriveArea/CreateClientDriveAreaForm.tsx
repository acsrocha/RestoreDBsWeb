// src/components/clientDriveArea/CreateClientDriveAreaForm.tsx
import React, { useState, useRef } from 'react';
import {
  createClientDriveArea
} from '../../services/api';
import type {
  CreateClientUploadAreaRequest,
  CreateClientUploadAreaResponse
} from '../../types/api';
import { FiFolderPlus, FiSend, FiLink, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const CreateClientDriveAreaForm: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'success' | 'error' | 'partial-success' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Importante para a lógica
  const [responseDetails, setResponseDetails] = useState<Partial<CreateClientUploadAreaResponse>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleInputFocus = () => {
    // ALTERAÇÃO CRÍTICA AQUI:
    // Se o formulário estiver em processo de envio (isSubmitting === true),
    // não faça nada, ou seja, não limpe a mensagem.
    if (isSubmitting) {
      return;
    }

    // Se não estiver enviando e houver uma mensagem, o usuário provavelmente
    // está iniciando uma nova entrada, então limpe a mensagem anterior.
    if (statusMessage) {
      setStatusMessage('');
      setStatusType('');
      setResponseDetails({});
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentFormData = new FormData(event.currentTarget);

    const requestData: CreateClientUploadAreaRequest = {
      clientName: currentFormData.get('clientName') as string,
      clientEmail: currentFormData.get('clientEmail') as string,
      ticketID: currentFormData.get('ticketID') as string,
      folderNameSuffix: (currentFormData.get('folderNameSuffix') as string) || undefined,
    };

    // Validações de campos obrigatórios (exemplo)
    if (!requestData.clientEmail || !requestData.ticketID) {
      setStatusMessage('E-mail do Cliente e ID do Ticket são obrigatórios.');
      setStatusType('error');
      setResponseDetails({});
      // Neste ponto, isSubmitting NÃO é true. Se um campo focar, a mensagem de validação será limpa.
      // Isso geralmente é ok, pois o usuário está corrigindo o campo.
      return;
    }
    if (requestData.clientEmail && !requestData.clientEmail.includes('@')) {
      setStatusMessage('Por favor, insira um e-mail válido para o cliente.');
      setStatusType('error');
      setResponseDetails({});
      return;
    }

    // Início do processo de envio
    setStatusMessage('Criando área de upload para o cliente... Por favor, aguarde.');
    setStatusType('pending');
    setIsSubmitting(true); // <<< Ponto chave: isSubmitting fica true
    setResponseDetails({});

    try {
      const response = await createClientDriveArea(requestData);
      setResponseDetails(response);

      if (response.success) {
        setStatusMessage(response.message || 'Área do cliente criada com sucesso!');
        setStatusType('success');
        formRef.current?.reset(); // Se form.reset() causar foco, handleInputFocus verá isSubmitting = true e não limpará
      } else {
        setStatusMessage(response.message || 'Operação concluída com avisos. Verifique os detalhes.');
        setStatusType('partial-success');
      }
    } catch (error) {
      console.error('Falha ao criar área do cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha crítica ao criar área do cliente.';
      setStatusMessage(`Erro: ${errorMessage}`);
      setStatusType('error');
      setResponseDetails({ message: errorMessage, success: false });
    } finally {
      setIsSubmitting(false); // <<< Ponto chave: isSubmitting volta para false APÓS tudo
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="create-client-drive-area-form">
      <div className="form-fields-wrapper">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientNameDrive">Nome do Cliente/Empresa (Opcional):</label>
            <input
              type="text"
              id="clientNameDrive"
              name="clientName"
              placeholder="Ex: Fortes Tecnologia"
              onFocus={handleInputFocus}
            />
          </div>
          <div className="form-group">
            <label htmlFor="clientEmailDrive">E-mail do Cliente (para permissão no Drive):</label>
            <input
              type="email"
              id="clientEmailDrive"
              name="clientEmail"
              placeholder="Ex: contato@cliente.com"
              required
              onFocus={handleInputFocus}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ticketIDDrive">ID do Ticket/Chamado:</label>
            <input
              type="text"
              id="ticketIDDrive"
              name="ticketID"
              placeholder="Ex: #12345, SUP-789"
              required
              onFocus={handleInputFocus}
            />
          </div>
          <div className="form-group">
            <label htmlFor="folderNameSuffixDrive">Sufixo para Nome da Pasta (Opcional):</label>
            <input
              type="text"
              id="folderNameSuffixDrive"
              name="folderNameSuffix"
              placeholder="Ex: BackupInicial, DocumentosImportantes"
              onFocus={handleInputFocus}
            />
            <small className="field-description">
              Para ajudar a identificar a pasta no Drive. Ex: CLIENTE_Nome_TICKET_ID_Sufixo_Data
            </small>
          </div>
        </div>
      </div>

      <div className="form-actions-sticky-bottom">
        {statusMessage && (
          <div
            id="clientDriveFormStatus"
            className={`client-drive-status-message ${statusType}`}
            aria-live="polite"
          >
            <div className="status-header">
              {statusType === 'success' && <FiCheckCircle className="status-icon" />}
              {statusType === 'error' && <FiAlertCircle className="status-icon" />}
              {statusType === 'partial-success' && <FiAlertCircle className="status-icon" />}
              {statusType === 'pending' && <FiSend className="status-icon" />}
              <span className="message-text">{statusMessage}</span>
            </div>
            {responseDetails.googleDriveFolderUrl && (statusType === 'success' || statusType === 'partial-success') && (
              <div className="folder-link-container">
                <FiLink className="link-icon" />
                Link da Pasta: <a href={responseDetails.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer">{responseDetails.googleDriveFolderName || 'Acessar Pasta'}</a>
              </div>
            )}
            {statusType === 'partial-success' && responseDetails.googleDriveFolderId && !responseDetails.permissionRoleGranted && responseDetails.clientEmail && (
              <p className="warning-details">
                Atenção: A pasta "{responseDetails.googleDriveFolderName || `ID: ${responseDetails.googleDriveFolderId}`}"
                foi criada, mas a permissão de escrita para {responseDetails.clientEmail} pode ter falhado.
                Verifique as permissões no Google Drive.
              </p>
            )}
            {statusType === 'error' && responseDetails.message && responseDetails.message !== statusMessage && (
              <p className="warning-details">
                Detalhes do erro: {responseDetails.message}
              </p>
            )}
          </div>
        )}
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          <FiFolderPlus style={{ marginRight: '8px' }} />
          {isSubmitting ? 'Criando Pasta...' : 'Criar Pasta no Drive para Cliente'}
        </button>
      </div>
    </form>
  );
};

export default CreateClientDriveAreaForm;