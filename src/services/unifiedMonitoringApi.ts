import { buildHeaders, getApiUrl, handleResponse } from './apiUtils';

export interface UnifiedMonitoringData {
  stats: {
    total: number;
    downloading: number;
    extracting: number;
    validating: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  activeJobs: FileProcessingJob[];
  recentlyCompleted: FileProcessingJob[];
  recentlyFailed: FileProcessingJob[];
  currentProcessing: string;
  queuedFiles: string[];
  queueCount: number;
  recentActivity: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface FileProcessingJob {
  id: string;
  fileName: string;
  originalPath: string;
  sourceType: 'upload' | 'google_drive' | 'local';
  status: 'downloading' | 'extracting' | 'validating' | 'queued' | 'processing' | 'completed' | 'failed';
  currentStage: string;
  overallProgress: number;
  clientUploadAreaId?: string;
  processedDatabaseId?: string;
  clientName: string;
  ticketId: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  stagesData?: string;
  errorMessage?: string;
}

export const fetchUnifiedMonitoringData = async (): Promise<UnifiedMonitoringData> => {
  try {
    const response = await fetch(getApiUrl('/api/unified_monitoring'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<UnifiedMonitoringData>(response);
  } catch (error) {
    console.error('Erro ao buscar dados unificados de monitoramento:', error);
    throw error;
  }
};

export const fetchJobsByClientArea = async (clientAreaId: string): Promise<FileProcessingJob[]> => {
  try {
    const response = await fetch(getApiUrl(`/api/unified_monitoring/client_area/${clientAreaId}`), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<FileProcessingJob[]>(response);
  } catch (error) {
    console.error('Erro ao buscar jobs da área cliente:', error);
    throw error;
  }
};

export const fetchRecentActivity = async (): Promise<ActivityLogEntry[]> => {
  try {
    // Tenta buscar logs do sistema
    const response = await fetch(getApiUrl('/api/logs/recent'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    if (!response.ok) {
      // Se não existir, retorna array vazio sem erro
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Falha silenciosa - retorna array vazio
    return [];
  }
};