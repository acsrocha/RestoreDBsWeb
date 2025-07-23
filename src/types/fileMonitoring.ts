// src/types/fileMonitoring.ts
export interface FileProcessingStep {
  id: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  details?: string;
  duration?: number; // em milissegundos
}

export interface FileProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  steps: FileProcessingStep[];
  progress: number; // 0-100
}

export interface FileProcessingDetail {
  fileId: string;
  fileName: string;
  originalPath: string;
  sourceType: 'upload' | 'google_drive' | 'local';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  stages: FileProcessingStage[];
  overallProgress: number; // 0-100
  currentStage?: string;
  error?: string;
}

export interface FileMonitoringData {
  activeFiles: FileProcessingDetail[];
  recentlyCompleted: FileProcessingDetail[];
  recentlyFailed: FileProcessingDetail[];
}