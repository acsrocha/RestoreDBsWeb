// src/components/upload/UploadForm.tsx
import React, { useState, useRef } from 'react';
import { uploadBackup } from '../../services/api';
import { useLastUpdated } from '../../contexts/LastUpdatedContext'; // <<< IMPORTAR
import { FiUploadCloud, FiSend } from 'react-icons/fi'; // Ícones

const UploadForm: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'success' | 'error' | ''>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('Nenhum arquivo escolhido');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { signalUpdate } = useLastUpdated(); // <<< USAR O HOOK

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFileName(event.target.files[0].name);
    } else {
      setSelectedFileName('Nenhum arquivo escolhido');
    }
  };

  // Função para acionar o clique no input de arquivo escondido
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

    const formData = new FormData(event.currentTarget);
    setUploadStatus('Enviando arquivo... Por favor, aguarde.');
    setStatusType('pending');
    setIsUploading(true);

    try {
      const responseText = await uploadBackup(formData);
      setUploadStatus(`Sucesso: ${responseText}`);
      setStatusType('success');
      formRef.current?.reset();
      setSelectedFileName('Nenhum arquivo escolhido'); // Limpa o nome do arquivo selecionado
      signalUpdate(); // <<< SINALIZA ATUALIZAÇÃO APÓS UPLOAD BEM-SUCEDIDO
    } catch (error) {
      console.error('Falha no upload:', error);
      setUploadStatus(error instanceof Error ? `Erro no upload: ${error.message}` : 'Falha crítica no upload.');
      setStatusType('error');
      // Não chamar signalUpdate() em caso de erro de upload, pois não houve "atualização de dados" bem-sucedida.
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form id="uploadForm" encType="multipart/form-data" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-group">
        <label htmlFor="backupFileFieldActualInput">Arquivo de Backup (.fbk, .gbk, .bt):</label>
        {/* Input de arquivo real, escondido visualmente mas funcional */}
        <input
          type="file"
          id="backupFileFieldActualInput" // ID único para o input real
          name="backupFile"
          accept=".fbk,.gbk,.bt,.FBK,.GBK,.BT"
          required
          ref={fileInputRef}
          onChange={handleFileChange}
          className="visually-hidden" // Classe para esconder o input
          tabIndex={-1} // Remove da ordem de tabulação normal
        />
        {/* Container para o botão customizado e o nome do arquivo */}
        <div className="custom-file-input-container">
          {/* Botão customizado que aciona o input escondido */}
          <button
            type="button" // Importante para não submeter o formulário
            className="button-secondary custom-file-button" // Estilo de botão secundário
            onClick={handleCustomFileButtonClick}
            aria-controls="backupFileFieldActualInput" // Para acessibilidade
            aria-label="Escolher arquivo de backup para upload"
          >
            <FiUploadCloud /> {/* Ícone no botão */}
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

      <button type="submit" id="submitUploadBtn" className="button-primary" disabled={isUploading}>
        <FiSend /> {/* Ícone harmonizado */}
        {isUploading ? 'Enviando...' : 'Enviar Backup'}
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