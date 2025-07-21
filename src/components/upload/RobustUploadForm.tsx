// src/components/upload/RobustUploadForm.tsx
import React, { useState, useRef, useEffect } from 'react';
// Modo de simulação para demonstração sem backend
// Defina como false para usar o backend real
const SIMULATION_MODE = false;
import { useLastUpdated } from '../../contexts/LastUpdatedContext';
import { ChunkedUploader } from './ChunkedUploader';
import { FiUploadCloud, FiPause, FiPlay, FiX, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

// Estilos específicos para este componente
import '../../styles/components/RobustUploadForm.css';

const RobustUploadForm: React.FC = () => {
  // Estados para gerenciar o upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'success' | 'error' | 'paused' | ''>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [uploadedChunks, setUploadedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const [uploadSpeed, setUploadSpeed] = useState<string>('');

  // Referências para elementos do DOM
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uploaderRef = useRef<ChunkedUploader | null>(null);
  
  // Contexto para atualizar a interface após upload
  const { signalUpdate } = useLastUpdated();

  // Referências para cálculo de velocidade e tempo restante
  const startTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<{time: number, progress: number}>({time: 0, progress: 0});

  // Limpar recursos quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (uploaderRef.current) {
        uploaderRef.current.abort();
      }
    };
  }, []);

  // Manipulador para seleção de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Resetar estados
      setUploadProgress(0);
      setUploadStatus('');
      setStatusType('');
      setUploadedChunks(0);
      setTotalChunks(0);
      setEstimatedTimeRemaining('');
      setUploadSpeed('');
    } else {
      setSelectedFile(null);
    }
  };

  // Manipulador para clique no botão de seleção de arquivo
  const handleCustomFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para calcular tempo restante e velocidade
  const updateTimeEstimates = (progress: number) => {
    const now = Date.now();
    
    // Se é o primeiro update ou progresso zerado, apenas inicializar
    if (lastProgressUpdateRef.current.time === 0 || progress === 0) {
      lastProgressUpdateRef.current = { time: now, progress };
      return;
    }
    
    // Calcular velocidade
    const timeDiff = (now - lastProgressUpdateRef.current.time) / 1000; // em segundos
    const progressDiff = progress - lastProgressUpdateRef.current.progress;
    
    if (timeDiff > 0 && progressDiff > 0) {
      // Velocidade em % por segundo
      const speedPercent = progressDiff / timeDiff;
      
      // Tempo restante estimado em segundos
      const remainingProgress = 100 - progress;
      const estimatedSeconds = remainingProgress / speedPercent;
      
      // Formatar tempo restante
      setEstimatedTimeRemaining(formatTime(estimatedSeconds));
      
      // Calcular e formatar velocidade de upload
      if (selectedFile) {
        const bytesTotal = selectedFile.size;
        const bytesPerSecond = (speedPercent / 100) * bytesTotal;
        setUploadSpeed(formatSpeed(bytesPerSecond));
      }
      
      // Atualizar referência
      lastProgressUpdateRef.current = { time: now, progress };
    }
  };

  // Formatar tempo em formato legível
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return 'Calculando...';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m restantes`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s restantes`;
    } else {
      return `${secs}s restantes`;
    }
  };

  // Formatar velocidade em formato legível
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(1)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else if (bytesPerSecond < 1024 * 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
    }
  };

  // Manipulador para envio do formulário
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setUploadStatus('Por favor, selecione um arquivo de backup.');
      setStatusType('error');
      return;
    }
    
    // Verificar tipo do arquivo
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.fbk') && !fileName.endsWith('.gbk') && !fileName.endsWith('.bt')) {
      setUploadStatus("Tipo de arquivo não suportado. Use .fbk, .gbk ou .bt");
      setStatusType('error');
      return;
    }
    
    // Iniciar upload
    setUploadStatus('Iniciando upload... Por favor, aguarde.');
    setStatusType('pending');
    setIsUploading(true);
    setIsPaused(false);
    setUploadProgress(0);
    startTimeRef.current = Date.now();
    lastProgressUpdateRef.current = { time: Date.now(), progress: 0 };
    
    // Coletar metadados do formulário
    const clienteNome = (document.getElementById('clienteNome') as HTMLInputElement)?.value;
    const ticketID = (document.getElementById('ticketID') as HTMLInputElement)?.value;
    const notasTecnico = (document.getElementById('notasTecnico') as HTMLTextAreaElement)?.value;
    
    const metadata = {
      clienteNome,
      ticketID,
      notasTecnico
    };
    
    if (SIMULATION_MODE) {
      // Modo de simulação para demonstração sem backend
      let progress = 0;
      const totalChunksSimulated = Math.ceil(selectedFile.size / (25 * 1024 * 1024));
      setTotalChunks(totalChunksSimulated);
      setUploadedChunks(0);
      
      // Simular inicialização
      setUploadStatus('Inicializando upload (modo simulação)...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular upload de chunks
      setUploadStatus('Enviando arquivo (modo simulação)...');
      
      // Criar um objeto para simular o uploader
      const simulatedUploader = {
        pause: () => {
          clearInterval(simulationInterval);
          setUploadStatus('Upload pausado. Clique em retomar para continuar.');
          setIsPaused(true);
        },
        resume: () => {
          setUploadStatus('Enviando arquivo (modo simulação)...');
          setIsPaused(false);
          startSimulation();
        },
        abort: () => {
          clearInterval(simulationInterval);
          setUploadStatus('Upload cancelado pelo usuário.');
          setStatusType('error');
          setIsUploading(false);
          setIsPaused(false);
        }
      };
      
      // Salvar referência para poder pausar/retomar/cancelar
      uploaderRef.current = simulatedUploader as any;
      
      let simulationInterval: NodeJS.Timeout;
      let uploadedChunksCount = 0;
      
      const startSimulation = () => {
        simulationInterval = setInterval(() => {
          // Incrementar progresso
          progress += 0.5;
          if (progress > 100) {
            progress = 100;
            clearInterval(simulationInterval);
            
            // Simular finalização
            setUploadStatus('Finalizando upload (modo simulação)...');
            setTimeout(() => {
              setUploadProgress(100);
              setUploadStatus(`Upload concluído com sucesso! (Modo simulação)`); 
              setStatusType('success');
              setIsUploading(false);
              setIsPaused(false);
              formRef.current?.reset();
              setSelectedFile(null);
              signalUpdate();
            }, 1500);
          }
          
          // Atualizar progresso
          setUploadProgress(progress);
          updateTimeEstimates(progress);
          
          // Simular upload de partes
          const expectedChunks = Math.floor((progress / 100) * totalChunksSimulated);
          if (expectedChunks > uploadedChunksCount) {
            uploadedChunksCount = expectedChunks;
            setUploadedChunks(uploadedChunksCount);
          }
        }, 300);
      };
      
      startSimulation();
      return;
    }
    
    try {
      // Criar e iniciar o uploader
      const uploader = new ChunkedUploader(
        selectedFile,
        metadata,
        // Callback de progresso
        (progress: number) => {
          setUploadProgress(progress);
          updateTimeEstimates(progress);
        },
        // Callback de parte completa
        (_chunkIndex: number, receivedCount: number, totalCount: number) => {
          setUploadedChunks(receivedCount);
          setTotalChunks(totalCount);
        },
        // Callback de conclusão
        (response: any) => {
          setUploadProgress(100);
          setUploadStatus(`Upload concluído com sucesso! ${response.message || ''}`);
          setStatusType('success');
          setIsUploading(false);
          setIsPaused(false);
          formRef.current?.reset();
          setSelectedFile(null);
          signalUpdate();
        },
        // Callback de erro
        (error: Error) => {
          setUploadStatus(`Erro: ${error.message}`);
          setStatusType('error');
          setIsUploading(false);
          setIsPaused(false);
        },
        // Callback de mudança de status
        (status) => {
          switch (status) {
            case 'initializing':
              setUploadStatus('Inicializando upload...');
              break;
            case 'uploading':
              setUploadStatus('Enviando arquivo...');
              setIsPaused(false);
              break;
            case 'paused':
              setUploadStatus('Upload pausado. Clique em retomar para continuar.');
              setIsPaused(true);
              break;
            case 'finalizing':
              setUploadStatus('Finalizando upload...');
              break;
            case 'completed':
              // Tratado pelo callback onComplete
              break;
            case 'error':
              // Tratado pelo callback onError
              break;
            case 'aborted':
              setUploadStatus('Upload cancelado pelo usuário.');
              setStatusType('error');
              setIsUploading(false);
              setIsPaused(false);
              break;
          }
        },
        // Tamanho da parte (25MB para arquivos grandes)
        25 * 1024 * 1024,
        // Uploads concorrentes
        3
      );
      
      // Salvar referência para poder pausar/retomar/cancelar
      uploaderRef.current = uploader;
      
      // Iniciar upload
      await uploader.start();
    } catch (error) {
      console.error('Falha ao iniciar upload:', error);
      
      // Mostrar informações detalhadas para diagnóstico
      let errorMessage = 'Falha crítica no upload.';
      
      if (error instanceof Error) {
        errorMessage = `Erro no upload: ${error.message}`;
      }
      
      setUploadStatus(errorMessage);
      setStatusType('error');
      setIsUploading(false);
      setIsPaused(false);
    }
  };

  // Manipuladores para pausar, retomar e cancelar
  const handlePauseUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.pause();
    }
  };

  const handleResumeUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.resume();
    }
  };

  const handleCancelUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.abort();
    }
  };

  return (
    <form id="robustUploadForm" encType="multipart/form-data" onSubmit={handleSubmit} ref={formRef}>
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
            disabled={isUploading}
          >
            <FiUploadCloud />
            Escolher arquivo
          </button>
          <span className="selected-file-name" aria-live="polite">
            {selectedFile ? (
              <>
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </>
            ) : (
              'Nenhum arquivo escolhido'
            )}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="clienteNome">Nome do Cliente (Opcional):</label>
        <input 
          type="text" 
          id="clienteNome" 
          name="clienteNome" 
          placeholder="Ex: Empresa Exemplo LTDA" 
          disabled={isUploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="ticketID">ID do Ticket/Chamado (Opcional):</label>
        <input 
          type="text" 
          id="ticketID" 
          name="ticketID" 
          placeholder="Ex: #12345, SUP-789" 
          disabled={isUploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notasTecnico">Notas Adicionais (Opcional):</label>
        <textarea 
          id="notasTecnico" 
          name="notasTecnico" 
          rows={3} 
          placeholder="Qualquer observação relevante sobre este backup..."
          disabled={isUploading}
        ></textarea>
      </div>

      {isUploading && (
        <div className="upload-progress-container">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          
          <div className="progress-stats">
            <div className="progress-text">
              {uploadProgress}% concluído
            </div>
            
            <div className="chunks-info">
              {uploadedChunks}/{totalChunks} partes enviadas
            </div>
            
            <div className="upload-metrics">
              <div className="speed">{uploadSpeed}</div>
              <div className="time-remaining">{estimatedTimeRemaining}</div>
            </div>
          </div>
          
          <div className="upload-controls">
            {!isPaused ? (
              <button 
                type="button" 
                className="control-button pause" 
                onClick={handlePauseUpload}
                aria-label="Pausar upload"
              >
                <FiPause /> Pausar
              </button>
            ) : (
              <button 
                type="button" 
                className="control-button resume" 
                onClick={handleResumeUpload}
                aria-label="Retomar upload"
              >
                <FiPlay /> Retomar
              </button>
            )}
            
            <button 
              type="button" 
              className="control-button cancel" 
              onClick={handleCancelUpload}
              aria-label="Cancelar upload"
            >
              <FiX /> Cancelar
            </button>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        id="submitUploadBtn" 
        className="button-primary" 
        disabled={isUploading || !selectedFile}
      >
        {isUploading ? (
          <>
            <FiLoader className="spin-animation" /> Enviando...
          </>
        ) : (
          <>
            <FiUploadCloud /> Iniciar Upload
          </>
        )}
      </button>

      {uploadStatus && (
        <div 
          id="uploadStatus" 
          className={`upload-status-message ${statusType}`} 
          aria-live="polite"
        >
          {statusType === 'success' ? (
            <FiCheckCircle className="status-icon success" />
          ) : statusType === 'error' ? (
            <FiAlertTriangle className="status-icon error" />
          ) : null}
          {uploadStatus}
        </div>
      )}
    </form>
  );
};

export default RobustUploadForm;