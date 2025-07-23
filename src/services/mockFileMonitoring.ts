// src/services/mockFileMonitoring.ts
import type { FileMonitoringData, FileProcessingDetail } from '../types/fileMonitoring';

// Função para gerar um ID aleatório
const generateId = () => Math.random().toString(36).substring(2, 15);

// Função para gerar uma data aleatória nos últimos 30 minutos
const generateRecentTimestamp = () => {
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 30);
  now.setMinutes(now.getMinutes() - minutesAgo);
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

// Função para gerar um arquivo em processamento
const generateProcessingFile = (status: 'queued' | 'processing' | 'completed' | 'failed'): FileProcessingDetail => {
  const fileId = generateId();
  const fileNames = [
    'backup_sistema_erp.fbk', 
    'backup_financeiro_2023.fbk', 
    'backup_completo_empresa.fbk',
    'backup_contabil_mensal.fbk',
    'backup_rh_folha.fbk',
    'backup_fiscal_2023.fbk'
  ];
  const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
  
  const sourceTypes = ['upload', 'google_drive', 'local'];
  const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)] as 'upload' | 'google_drive' | 'local';
  
  const createdAt = generateRecentTimestamp();
  const startedAt = status !== 'queued' ? generateRecentTimestamp() : undefined;
  const completedAt = (status === 'completed' || status === 'failed') ? generateRecentTimestamp() : undefined;
  
  // Gerar estágios de processamento
  const stages = [
    {
      id: generateId(),
      name: 'Download',
      description: 'Baixando arquivo do Google Drive ou recebendo upload',
      status: status === 'queued' ? 'pending' : 'completed',
      startTime: startedAt,
      endTime: status !== 'queued' ? generateRecentTimestamp() : undefined,
      steps: [
        {
          id: generateId(),
          timestamp: startedAt || createdAt,
          status: status === 'queued' ? 'pending' : 'completed',
          message: 'Iniciando download do arquivo',
          duration: Math.floor(Math.random() * 5000)
        },
        {
          id: generateId(),
          timestamp: startedAt || createdAt,
          status: status === 'queued' ? 'pending' : 'completed',
          message: 'Verificando integridade do arquivo',
          duration: Math.floor(Math.random() * 2000)
        },
        {
          id: generateId(),
          timestamp: startedAt || createdAt,
          status: status === 'queued' ? 'pending' : 'completed',
          message: 'Download concluído',
          duration: Math.floor(Math.random() * 1000)
        }
      ],
      progress: status === 'queued' ? 0 : 100
    },
    {
      id: generateId(),
      name: 'Validação',
      description: 'Verificando formato e estrutura do arquivo de backup',
      status: status === 'queued' ? 'pending' : status === 'processing' && Math.random() > 0.5 ? 'in_progress' : 'completed',
      startTime: status === 'queued' ? undefined : generateRecentTimestamp(),
      endTime: (status === 'completed' || status === 'failed' || (status === 'processing' && Math.random() < 0.5)) ? generateRecentTimestamp() : undefined,
      steps: [
        {
          id: generateId(),
          timestamp: status === 'queued' ? createdAt : generateRecentTimestamp(),
          status: status === 'queued' ? 'pending' : status === 'processing' && Math.random() > 0.7 ? 'in_progress' : 'completed',
          message: 'Verificando assinatura do arquivo',
          duration: Math.floor(Math.random() * 3000)
        },
        {
          id: generateId(),
          timestamp: status === 'queued' ? createdAt : generateRecentTimestamp(),
          status: status === 'queued' || status === 'processing' ? 'pending' : 'completed',
          message: 'Analisando estrutura interna',
          duration: Math.floor(Math.random() * 5000)
        }
      ],
      progress: status === 'queued' ? 0 : status === 'processing' ? Math.floor(Math.random() * 100) : 100
    },
    {
      id: generateId(),
      name: 'Restauração',
      description: 'Restaurando banco de dados a partir do backup',
      status: status === 'queued' || status === 'processing' ? 'pending' : status === 'failed' ? 'failed' : 'completed',
      startTime: status === 'completed' || status === 'failed' ? generateRecentTimestamp() : undefined,
      endTime: status === 'completed' || status === 'failed' ? generateRecentTimestamp() : undefined,
      steps: [
        {
          id: generateId(),
          timestamp: status === 'completed' || status === 'failed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' ? 'pending' : status === 'failed' ? 'failed' : 'completed',
          message: 'Iniciando processo de restauração',
          duration: status === 'completed' || status === 'failed' ? Math.floor(Math.random() * 10000) : undefined
        },
        {
          id: generateId(),
          timestamp: status === 'completed' || status === 'failed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' ? 'pending' : status === 'failed' ? 'failed' : 'completed',
          message: 'Configurando parâmetros de restauração',
          duration: status === 'completed' || status === 'failed' ? Math.floor(Math.random() * 2000) : undefined
        },
        {
          id: generateId(),
          timestamp: status === 'completed' || status === 'failed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' ? 'pending' : status === 'failed' ? 'failed' : 'completed',
          message: status === 'failed' ? 'Erro durante restauração' : 'Restauração concluída com sucesso',
          details: status === 'failed' ? 'Erro: Não foi possível acessar o arquivo de backup. Verifique se o arquivo não está corrompido.' : undefined,
          duration: status === 'completed' || status === 'failed' ? Math.floor(Math.random() * 15000) : undefined
        }
      ],
      progress: status === 'queued' || status === 'processing' ? 0 : status === 'failed' ? 50 : 100
    },
    {
      id: generateId(),
      name: 'Finalização',
      description: 'Configurando e registrando o banco restaurado',
      status: status === 'queued' || status === 'processing' || status === 'failed' ? 'pending' : 'completed',
      startTime: status === 'completed' ? generateRecentTimestamp() : undefined,
      endTime: status === 'completed' ? generateRecentTimestamp() : undefined,
      steps: [
        {
          id: generateId(),
          timestamp: status === 'completed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' || status === 'failed' ? 'pending' : 'completed',
          message: 'Configurando banco restaurado',
          duration: status === 'completed' ? Math.floor(Math.random() * 3000) : undefined
        },
        {
          id: generateId(),
          timestamp: status === 'completed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' || status === 'failed' ? 'pending' : 'completed',
          message: 'Registrando banco no sistema',
          duration: status === 'completed' ? Math.floor(Math.random() * 1000) : undefined
        },
        {
          id: generateId(),
          timestamp: status === 'completed' ? generateRecentTimestamp() : createdAt,
          status: status === 'queued' || status === 'processing' || status === 'failed' ? 'pending' : 'completed',
          message: 'Processo finalizado',
          duration: status === 'completed' ? Math.floor(Math.random() * 500) : undefined
        }
      ],
      progress: status === 'queued' || status === 'processing' || status === 'failed' ? 0 : 100
    }
  ];
  
  // Calcular progresso geral
  let overallProgress = 0;
  if (status === 'completed') {
    overallProgress = 100;
  } else if (status === 'failed') {
    overallProgress = Math.floor(Math.random() * 50) + 25; // 25-75%
  } else if (status === 'processing') {
    // Calcular com base nos estágios
    let completedStages = 0;
    let totalProgress = 0;
    stages.forEach(stage => {
      if (stage.status === 'completed') {
        completedStages++;
        totalProgress += 100;
      } else if (stage.status === 'in_progress') {
        totalProgress += stage.progress;
      }
    });
    overallProgress = Math.floor(totalProgress / stages.length);
  }
  
  return {
    fileId,
    fileName,
    originalPath: `/caminho/para/${fileName}`,
    sourceType,
    status,
    createdAt,
    startedAt,
    completedAt,
    stages,
    overallProgress,
    currentStage: status === 'processing' ? stages.find(s => s.status === 'in_progress')?.name : undefined,
    error: status === 'failed' ? 'Erro durante o processo de restauração do banco de dados' : undefined
  };
};

// Gerar dados de monitoramento de arquivos
export const generateMockFileMonitoringData = (): FileMonitoringData => {
  // Gerar arquivos ativos (em processamento ou na fila)
  const activeFilesCount = Math.floor(Math.random() * 3) + 1; // 1-3 arquivos ativos
  const activeFiles: FileProcessingDetail[] = [];
  
  for (let i = 0; i < activeFilesCount; i++) {
    const status = Math.random() > 0.3 ? 'processing' : 'queued';
    activeFiles.push(generateProcessingFile(status));
  }
  
  // Gerar arquivos concluídos recentemente
  const completedFilesCount = Math.floor(Math.random() * 5) + 2; // 2-6 arquivos concluídos
  const recentlyCompleted: FileProcessingDetail[] = [];
  
  for (let i = 0; i < completedFilesCount; i++) {
    recentlyCompleted.push(generateProcessingFile('completed'));
  }
  
  // Gerar arquivos com falha
  const failedFilesCount = Math.floor(Math.random() * 3); // 0-2 arquivos com falha
  const recentlyFailed: FileProcessingDetail[] = [];
  
  for (let i = 0; i < failedFilesCount; i++) {
    recentlyFailed.push(generateProcessingFile('failed'));
  }
  
  return {
    activeFiles,
    recentlyCompleted,
    recentlyFailed
  };
};