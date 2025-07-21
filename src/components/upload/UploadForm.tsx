// src/components/upload/UploadForm.tsx
import React, { useState, useRef } from 'react';
import { uploadBackup } from '../../services/api';
import { useLastUpdated } from '../../contexts/LastUpdatedContext';
import { FiUploadCloud, FiSend, FiLoader } from 'react-icons/fi';

const UploadForm: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'success' | 'error' | ''>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('Nenhum arquivo escolhido');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { signalUpdate } = useLastUpdated();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFileName(event.target.files[0].name);
    } else {
      setSelectedFileName('Nenhum arquivo escolhido');
    }
  };

  const handleCustomFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setUploadStatus('Por favor, selecione um arquivo de backup.');
      setStatusType('error');
      return;
    }

    const file = fileInputRef.current.files[0];
    console.log('Arquivo selecionado:', file.name);
    console.log('Tamanho:', file.size, 'bytes');
    console.log('Tipo:', file.type);
    
    // Verificar tipo do arquivo
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.fbk') && !fileName.endsWith('.gbk') && !fileName.endsWith('.bt')) {
      setUploadStatus("Tipo de arquivo não suportado. Use .fbk, .gbk ou .bt");
      setStatusType('error');
      return;
    }

    setUploadStatus('Iniciando upload... Por favor, aguarde.');
    setStatusType('pending');
    setIsUploading(true);
    setUploadProgress(0);

    // Criar FormData manualmente para garantir que os campos estão corretos
    const formData = new FormData();
    formData.append('backupFile', file);
    
    // Adicionar outros campos do formulário
    const clienteNome = (document.getElementById('clienteNome') as HTMLInputElement)?.value;
    const ticketID = (document.getElementById('ticketID') as HTMLInputElement)?.value;
    const notasTecnico = (document.getElementById('notasTecnico') as HTMLTextAreaElement)?.value;
    
    if (clienteNome) formData.append('clienteNome', clienteNome);
    if (ticketID) formData.append('ticketID', ticketID);
    if (notasTecnico) formData.append('notasTecnico', notasTecnico);
    
    // Verificar se o FormData contém o arquivo
    console.log('FormData contém backupFile:', formData.has('backupFile'));
    
    try {
      // Simular progresso para feedback visual
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 1;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);

      // Fazer upload usando a API existente
      const responseText = await uploadBackup(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus(`Sucesso: ${responseText}`);
      setStatusType('success');
      formRef.current?.reset();
      setSelectedFileName('Nenhum arquivo escolhido');
      signalUpdate();
    } catch (error) {
      console.error('Falha no upload:', error);
      setUploadStatus(error instanceof Error ? `Erro no upload: ${error.message}` : 'Falha crítica no upload.');
      setStatusType('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form id="uploadForm" encType="multipart/form-data" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-group">
        <label htmlFor="backupFileFieldActualInput">Arquivo de Backup:</label>
        <div className="file-types-info">
          <small>
            <strong>Tipos suportados:</strong>
            <br />• .fbk/.gbk - Backups tradicionais do Firebird
            <br />• .bt - Arquivos de configuração de banco (processamento especial)
          </small>
        </div>
        <input
          type="file"
          id="backupFileFieldActualInput"
          name="backupFile"
          accept=".fbk,.gbk,.bt,.FBK,.GBK,.BT"
          required
          ref={fileInputRef}
          onChange={handleFileChange}
          className="visually-hidden"
          tabIndex={-1}
        />
        <div className="custom-file-input-container">
          <button
            type="button"
            className="button-secondary custom-file-button"
            onClick={handleCustomFileButtonClick}
            aria-controls="backupFileFieldActualInput"
            aria-label="Escolher arquivo de backup para upload"
          >
            <FiUploadCloud />
            Escolher arquivo
          </button>
          <span className="selected-file-name" aria-live="polite">{selectedFileName}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="clienteNome">Nome do Cliente (Opcional):</label>
        <input type="text" id="clienteNome" name="clienteNome" placeholder="Ex: Empresa Exemplo LTDA" />
      </div>

      <div className="form-group">
        <label htmlFor="ticketID">ID do Ticket/Chamado (Opcional):</label>
        <input type="text" id="ticketID" name="ticketID" placeholder="Ex: #12345, SUP-789" />
      </div>

      <div className="form-group">
        <label htmlFor="notasTecnico">Notas Adicionais (Opcional):</label>
        <textarea id="notasTecnico" name="notasTecnico" rows={3} placeholder="Qualquer observação relevante sobre este backup..."></textarea>
      </div>

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {uploadProgress}% concluído
          </div>
        </div>
      )}

      <button type="submit" id="submitUploadBtn" className="button-primary" disabled={isUploading}>
        {isUploading ? (
          <>
            <FiLoader className="spin-animation" /> Enviando...
          </>
        ) : (
          <>
            <FiSend /> Enviar Backup
          </>
        )}
      </button>

      {uploadStatus && (
        <div id="uploadStatus" className={`upload-status-message ${statusType}`} aria-live="polite">
          {uploadStatus}
        </div>
      )}
    </form>
  );
};

export default UploadForm;