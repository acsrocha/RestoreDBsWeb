export interface StatusData {
  currentProcessing: string | null;
  queueCount: number;
  queuedFiles: string[];
  recentActivity: string[];
  driveMonitorNextRunEpoch?: number;
  driveMonitorIntervalMinutes?: number;
}

export interface FailedRestoreItem {
  fileName: string;
  fullFilePath: string;
  errorMessage: string;
  timestamp: string;
  details?: string;
}

export interface ProcessedDatabase {
  id: string;
  originalBackupFileName: string;
  internalFileName?: string;
  restoredDbName: string;
  restoredDbAlias: string;
  restorationTimestamp: string;
  processedBackupPath: string;
  restoredDbPath: string;
  custodyEndDate?: string;
  status: string;
  notes?: string;
  uploadedByCliente?: string;
  uploadedByTicketID?: string;
  uploadNotas?: string;
}

export interface CreateClientUploadAreaRequest {
  clientName: string;
  clientEmail: string;
  ticketID?: string;
  folderNameSuffix?: string;
}

export interface CreateClientUploadAreaResponse {
  success: boolean;
  message: string;
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  googleDriveFolderUrl?: string;
  sharedDriveIdUsed?: string;
  clientEmail?: string;
  permissionRoleGranted?: string;
}

export interface AdminProcessedBackupDetail {
  pb_id: string;
  pb_original_backup_filename: string;
  pb_internal_filename?: string;
  pb_restored_alias: string;
  pb_restoration_date: string;
  pb_status: string;
  pb_custody_end_date?: string;
  pb_database_notes?: string;
  pb_upload_notes_tecnico?: string;
}

export interface AdminClientUploadAreaDetail {
  upload_area_id: string;
  client_name: string;
  client_email: string;
  ticket_id?: string;
  gdrive_folder_name: string;
  gdrive_folder_id: string;
  gdrive_folder_url?: string;
  area_creation_date: string;
  upload_area_status: string;
  upload_area_notes?: string;
  processed_backups: AdminProcessedBackupDetail[];
}

export interface ParsedNoteEntry {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  rawLine: string;
} 