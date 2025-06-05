export interface StatusData {
  currentProcessing: string | null;
  queueCount: number;
  queuedFiles: string[];
  recentActivity: string[];
}

export interface FailedRestoreItem {
  filePath: string;
  fileName?: string;
  timestamp: string;
  error: string;
  details?: string;
} 