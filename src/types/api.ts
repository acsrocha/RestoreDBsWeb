export interface StatusData {
  currentProcessing: string | null;
  queueCount: number;
  queuedFiles: string[];
  recentActivity: string[];
}

export interface FailedRestoreItem {
  fileName: string;
  fullFilePath: string;
  errorMessage: string;
  timestamp: string;
  details?: string;
} 