// src/types/api.ts (CORRIGIDO)

export interface StatusData {
  currentProcessing: string | null;  // CORRIGIDO para 'c' minúsculo
  queuedFiles: string[];           // CORRIGIDO para 'q' minúsculo
  recentActivity: string[];        // CORRIGIDO para 'r' minúsculo
  queueCount: number;              // CORRIGIDO para 'q' minúsculo
}

export interface FailedRestoreItem {
  // As tags json na sua struct Go FailedRestoreInfo são:
  // `json:"fileName"`, `json:"fullFilePath"`, `json:"errorMessage"`, `json:"timestamp"`
  // Portanto, as chaves aqui já estavam corretas em camelCase.
  fileName: string;
  fullFilePath: string;
  errorMessage: string;
  timestamp: string; // ou Date
}

export interface ProcessedDatabase {
  // As tags json na sua struct Go ProcessedDatabase são camelCase.
  id: string;
  originalBackupFileName: string;
  internalFileName?: string;       // `json:"internalFileName"`
  restoredDbName: string;          // `json:"restoredDbName"`
  restoredDbAlias: string;         // `json:"restoredDbAlias"`
  restorationTimestamp: string;    // `json:"restorationTimestamp"`
  processedBackupPath: string;     // `json:"processedBackupPath"`
  restoredDbPath: string;          // `json:"restoredDbPath"`
  custodyEndDate?: string;          // `json:"custodyEndDate"`
  status: string;                  // `json:"status"`
  notes?: string;                  // `json:"notes"`
  uploadedByCliente?: string;      // `json:"uploadedByCliente,omitempty"`
  uploadedByTicketID?: string;     // `json:"uploadedByTicketID,omitempty"`
  uploadNotas?: string;            // `json:"uploadNotas,omitempty"`
  // A propriedade `notasTecnico` foi removida pois não corresponde diretamente
  // a uma tag json da struct ProcessedDatabase em Go.
  // Use `notes` para notas gerais ou `uploadNotas` para notas do técnico do upload.
}
