// src/components/clientDriveArea/CreateClientDriveAreaForm.tsx
import React, { useState, useRef } from 'react';
// ... (outros imports)
import { FiFolderPlus, FiLink, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
// <<< 1. Importar o módulo CSS refatorado, que agora controla o formulário
import styles from '../../pages/CreateClientDriveArea.module.css';
import { createClientDriveArea } from '../../services/api';

const CreateClientDriveAreaForm: React.FC = () => {
  // ... (toda a sua lógica de state, handleSubmit, etc., permanece a mesma)
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'success' | 'error' | 'partial-success' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responseDetails, setResponseDetails] = useState<Partial<any>>({}); // Usar 'any' temporariamente se o tipo não estiver definido
  const formRef = useRef<HTMLFormElement>(null);

  // ... (toda a sua lógica handleInputFocus e handleSubmit permanece idêntica)
  const handleInputFocus = () => {
    if (isSubmitting) {
      return;
    }
    if (statusMessage) {
      setStatusMessage('');
      setStatusType('');
      setResponseDetails({});
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentFormData = new FormData(event.currentTarget);
    const requestData = {
      clientName: currentFormData.get('clientName') as string,
      clientEmail: currentFormData.get('clientEmail') as string,
      ticketID: currentFormData.get('ticketID') as string,
      folderNameSuffix: (currentFormData.get('folderNameSuffix') as string) || undefined,
    };
    if (!requestData.clientEmail || !requestData.ticketID) {
      setStatusMessage('E-mail do Cliente e ID do Ticket são obrigatórios.');
      setStatusType('error');
      return;
    }
    if (!requestData.clientEmail.includes('@')) {
      setStatusMessage('Por favor, insira um e-mail válido para o cliente.');
      setStatusType('error');
      return;
    }
    setStatusMessage('Criando área de upload para o cliente... Por favor, aguarde.');
    setStatusType('pending');
    setIsSubmitting(true);
    setResponseDetails({});
    try {
      const response = await createClientDriveArea(requestData);
      setResponseDetails(response);
      if (response.success) {
        setStatusMessage(response.message || 'Área do cliente criada com sucesso!');
        setStatusType('success');
        formRef.current?.reset();
      } else {
        setStatusMessage(response.message || 'Operação concluída com avisos. Verifique os detalhes.');
        setStatusType('partial-success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha crítica ao criar área do cliente.';
      setStatusMessage(`Erro: ${errorMessage}`);
      setStatusType('error');
      setResponseDetails({ message: errorMessage, success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. APLICAR AS CLASSES DO MÓDULO E GLOBAIS
  return (
    <form onSubmit={handleSubmit} ref={formRef} className={styles.createClientDriveAreaForm}>
      {/* Os campos usarão a classe "form-group" do seu global.css */}
      <div className={styles.formFieldsWrapper}>
        <div className={styles.formRow}>
          <div className="form-group">
            <label htmlFor="clientNameDrive">Nome do Cliente/Empresa (Opcional):</label>
            <input
              type="text" id="clientNameDrive" name="clientName"
              placeholder="Ex: Fortes Tecnologia" onFocus={handleInputFocus}
            />
          </div>
          <div className="form-group">
            <label htmlFor="clientEmailDrive">E-mail do Cliente (para permissão no Drive):</label>
            <input
              type="email" id="clientEmailDrive" name="clientEmail"
              placeholder="Ex: contato@cliente.com" required onFocus={handleInputFocus}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className="form-group">
            <label htmlFor="ticketIDDrive">ID do Ticket/Chamado:</label>
            <input
              type="text" id="ticketIDDrive" name="ticketID"
              placeholder="Ex: #12345, SUP-789" required onFocus={handleInputFocus}
            />
          </div>
          <div className="form-group">
            <label htmlFor="folderNameSuffixDrive">Sufixo para Nome da Pasta (Opcional):</label>
            <input
              type="text" id="folderNameSuffixDrive" name="folderNameSuffix"
              placeholder="Ex: BackupInicial, DocumentosImportantes" onFocus={handleInputFocus}
            />
            <small className="field-description">
              Para ajudar a identificar a pasta no Drive. Ex: CLIENTE_Nome_TICKET_ID_Sufixo_Data
            </small>
          </div>
        </div>
      </div>

      <div className={styles.formActionsStickyBottom}>
        {statusMessage && (
          <div id="clientDriveFormStatus" className={`${styles.clientDriveStatusMessage} ${styles[statusType]}`} aria-live="polite">
            <div className={styles.statusHeader}>
              {statusType === 'success' && <FiCheckCircle className={styles.statusIcon} />}
              {statusType === 'error' && <FiAlertCircle className={styles.statusIcon} />}
              {(statusType === 'partial-success' || statusType === 'pending') && <FiAlertCircle className={styles.statusIcon} />}
              <span className={styles.messageText}>{statusMessage}</span>
            </div>
            {(responseDetails.googleDriveFolderUrl && (statusType === 'success' || statusType === 'partial-success')) && (
              <div className={styles.folderLinkContainer}>
                <FiLink /> Link da Pasta: <a href={responseDetails.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer">{responseDetails.googleDriveFolderName || 'Acessar Pasta'}</a>
              </div>
            )}
            {/* ... o resto da sua lógica de mensagens de aviso ... */}
          </div>
        )}
        {/* Usando a classe global "button-primary" */}
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          <FiFolderPlus />
          {isSubmitting ? 'Criando Pasta...' : 'Criar Pasta no Drive para Cliente'}
        </button>
      </div>
    </form>
  );
};

export default CreateClientDriveAreaForm;