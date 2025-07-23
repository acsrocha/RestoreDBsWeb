// src/services/monitoringApi.ts
import type { FileMonitoringData } from '../types/fileMonitoring';
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';

const FILE_MONITORING_API_URL = () => getApiUrl('/api/file_monitoring');

// Endpoint para buscar dados de monitoramento de arquivos
export const fetchFileMonitoringData = async (): Promise<FileMonitoringData> => {
  try {
    console.log('Buscando dados de monitoramento...');
    const response = await fetch(FILE_MONITORING_API_URL(), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    console.log('Status da resposta:', response.status);
    
    const data = await handleResponse<FileMonitoringData>(response);
    
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