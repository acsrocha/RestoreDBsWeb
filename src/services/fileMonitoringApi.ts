// src/services/fileMonitoringApi.ts
import type { FileMonitoringData, FileProcessingDetail } from '../types/fileMonitoring';
import { generateMockFileMonitoringData } from './mockFileMonitoring';
import { buildHeaders, getApiUrl, handleResponse } from './apiUtils';

const FILE_MONITORING_API_URL = () => getApiUrl('/api/file_monitoring');

// Flag para usar dados mockados (temporário até o backend estar pronto)
// IMPORTANTE: Altere para false quando o backend estiver implementado com a API /api/file_monitoring
// O proxy no vite.config.ts já está configurado para redirecionar as chamadas para o backend
const USE_MOCK_DATA = false; // Backend agora implementa o endpoint /api/file_monitoring

// Endpoint para buscar dados de monitoramento de arquivos
export const fetchFileMonitoringData = async (): Promise<FileMonitoringData> => {
  if (USE_MOCK_DATA) {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockFileMonitoringData();
  }
  
  try {
    console.log('Buscando dados de monitoramento...');
    const response = await fetch(FILE_MONITORING_API_URL(), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const data = await handleResponse<FileMonitoringData>(response);
    console.log('Dados recebidos:', data);
    
    // Verificar se os dados estão vazios
    if (
      (!data.activeFiles || data.activeFiles.length === 0) &&
      (!data.recentlyCompleted || data.recentlyCompleted.length === 0) &&
      (!data.recentlyFailed || data.recentlyFailed.length === 0)
    ) {
      console.log('Aviso: Todos os arrays de monitoramento estão vazios');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de monitoramento:', error);
    throw error;
  }
};

// Endpoint para buscar detalhes de um arquivo específico
export const fetchFileDetails = async (fileId: string): Promise<any> => {
  const response = await fetch(`${FILE_MONITORING_API_URL()}/${fileId}`, { 
    cache: 'no-store',
    headers: buildHeaders()
  });
  return handleResponse<any>(response);
};

// Função para buscar todos os jobs de processamento de arquivos em um único array
export const fetchFileProcessingJobs = async (): Promise<FileProcessingDetail[]> => {
  const data = await fetchFileMonitoringData();
  
  // Combina todos os jobs em um único array
  return [
    ...data.activeFiles,
    ...data.recentlyCompleted,
    ...data.recentlyFailed
  ];
};