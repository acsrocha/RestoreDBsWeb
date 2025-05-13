// src/types/api.ts
export interface QueuedFile {
  // Adapte conforme a estrutura real se houver mais campos
  path: string; // Exemplo, o original parece ser apenas uma string
}

export interface CurrentProcessingInfo {
  // Adapte conforme a estrutura real
  filename: string; // Exemplo
  // ... outros campos
}

export interface StatusData {
  CurrentProcessing: string | null; // Ou um objeto mais detalhado CurrentProcessingInfo
  QueuedFiles: string[]; // Ou QueuedFile[]
  RecentActivity: string[];
  QueueCount: number;
}

export interface FailedRestoreItem {
  fileName: string;
  fullFilePath: string;
  errorMessage: string;
  timestamp: string; // ou Date
}

export interface ProcessedDatabase {
  id: string;
  originalBackupFileName: string;
  internalFileName?: string;
  restoredDbName: string;
  restoredDbAlias: string;
  restorationTimestamp: string; // ou Date
  processedBackupPath: string;
  restoredDbPath: string;
  custodyEndDate?: string; // ou Date
  status: string;
  notasTecnico?: string; // Original era 'notes' e depois 'notasTecnico'
  // Campos do upload
  uploadedByCliente?: string;
  uploadedByTicketID?: string;
  // uploadNotas: string; // 'notasTecnico' do formulário de upload é mapeado para 'UploadNotas' no Go struct, verifique o nome correto.
}