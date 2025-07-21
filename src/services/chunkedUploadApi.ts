// src/services/chunkedUploadApi.ts
// Importar apenas o que é necessário

// Variáveis de ambiente no Vite precisam começar com VITE_
const API_KEY = import.meta.env.VITE_APP_RESTOREDB_API_KEY;

// Função para obter URL base do servidor
const getServerUrl = () => {
  // Usar URL vazia para usar o proxy do Vite
  return '';
};

// Função para construir URL da API
const getApiUrl = (endpoint: string) => {
  const serverUrl = getServerUrl();
  return serverUrl ? `${serverUrl}${endpoint}` : endpoint;
};

// Função para construir cabeçalhos
const buildHeaders = (includeContentTypeJson = false): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  
  if (includeContentTypeJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Endpoints para upload em chunks - adaptado para o novo backend
const CHUNK_UPLOAD_INIT_URL = () => getApiUrl('/api/upload/large/init');
const CHUNK_UPLOAD_CHUNK_URL = () => getApiUrl('/api/upload/large/chunk');
const CHUNK_UPLOAD_STATUS_URL = () => getApiUrl('/api/upload/large/status');
const CHUNK_UPLOAD_FINALIZE_URL = () => getApiUrl('/api/upload/large/finalize');
const CHUNK_UPLOAD_ABORT_URL = () => getApiUrl('/api/upload/large/abort');

// Função para transformar snake_case em camelCase para compatibilidade
function transformResponse<T>(data: any): T {
  // Se for uma resposta de inicialização
  if (data.upload_id && data.chunk_size) {
    data.uploadId = data.upload_id;
    data.chunkSize = data.chunk_size;
    data.expiresAt = data.expires_at;
    data.totalChunks = data.total_chunks;
  }
  
  // Se for uma resposta de status
  if (data.file_name && data.received_chunks) {
    data.uploadId = data.upload_id;
    data.fileName = data.file_name;
    data.fileSize = data.file_size;
    data.receivedChunks = data.received_chunks;
    data.totalChunks = data.total_chunks;
    data.createdAt = data.created_at;
    data.expiresAt = data.expires_at;
  }
  
  // Se for uma resposta de chunk
  if (data.chunk_index !== undefined) {
    data.uploadId = data.upload_id;
    data.chunkIndex = data.chunk_index;
    data.receivedChunks = data.received_chunks;
    data.totalChunks = data.total_chunks;
  }
  
  // Se for uma resposta de finalização
  if (data.processed_file_id) {
    data.uploadId = data.upload_id;
    data.fileName = data.file_name;
    data.fileSize = data.file_size;
    data.processedFileId = data.processed_file_id;
  }
  
  return data as T;
}

// Função auxiliar para processar respostas da API
async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro na API: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${errorText}`);
  }

  if (response.status === 204) { // No Content
    return {} as Promise<T>;
  }

  if (isJsonExpected) {
    const data = await response.json();
    return transformResponse<T>(data);
  }
  
  return response.text() as unknown as Promise<T>;
}

// Interfaces para respostas da API - adaptadas para o novo formato do backend
export interface InitUploadResponse {
  upload_id: string;           // Adaptado para o novo formato do backend
  chunk_size: number;          // Adaptado para o novo formato do backend
  expires_at: string;          // Adaptado para o novo formato do backend
  total_chunks: number;        // Adaptado para o novo formato do backend
  
  // Mapeamento para compatibilidade com o código existente
  uploadId: string;            // Alias para upload_id
  chunkSize: number;           // Alias para chunk_size
  expiresAt: string;           // Alias para expires_at
  totalChunks: number;         // Alias para total_chunks
}

export interface UploadStatusResponse {
  upload_id: string;           // Adaptado para o novo formato do backend
  file_name: string;           // Adaptado para o novo formato do backend
  file_size: number;           // Adaptado para o novo formato do backend
  received_chunks: number[];   // Adaptado para o novo formato do backend
  total_chunks: number;        // Adaptado para o novo formato do backend
  progress: number;
  created_at: string;          // Adaptado para o novo formato do backend
  expires_at: string;          // Adaptado para o novo formato do backend
  status: 'pending' | 'uploading' | 'finalizing' | 'completed' | 'aborted' | 'error';
  
  // Mapeamento para compatibilidade com o código existente
  uploadId: string;            // Alias para upload_id
  fileName: string;            // Alias para file_name
  fileSize: number;            // Alias para file_size
  receivedChunks: number[];    // Alias para received_chunks
  totalChunks: number;         // Alias para total_chunks
  createdAt: string;           // Alias para created_at
  expiresAt: string;           // Alias para expires_at
}

export interface ChunkResponse {
  upload_id: string;           // Adaptado para o novo formato do backend
  chunk_index: number;         // Adaptado para o novo formato do backend
  received_chunks: number;     // Adaptado para o novo formato do backend
  total_chunks: number;        // Adaptado para o novo formato do backend
  progress: number;
  
  // Mapeamento para compatibilidade com o código existente
  uploadId: string;            // Alias para upload_id
  chunkIndex: number;          // Alias para chunk_index
  receivedChunks: number;      // Alias para received_chunks
  totalChunks: number;         // Alias para total_chunks
}

export interface FinalizeResponse {
  upload_id: string;           // Adaptado para o novo formato do backend
  file_name: string;           // Adaptado para o novo formato do backend
  file_size: number;           // Adaptado para o novo formato do backend
  status: 'completed';
  message: string;
  processed_file_id?: string;  // Adaptado para o novo formato do backend
  
  // Mapeamento para compatibilidade com o código existente
  uploadId: string;            // Alias para upload_id
  fileName: string;            // Alias para file_name
  fileSize: number;            // Alias para file_size
  processedFileId?: string;    // Alias para processed_file_id
}

export interface UploadMetadata {
  clienteNome?: string;
  ticketID?: string;
  notasTecnico?: string;
  [key: string]: string | undefined;
}

/**
 * Inicializa um upload em chunks no servidor
 */
export const initChunkedUpload = async (
  fileName: string,
  fileSize: number,
  metadata: UploadMetadata,
  chunkSize: number = 10 * 1024 * 1024 // 10MB por padrão
): Promise<InitUploadResponse> => {
  const url = CHUNK_UPLOAD_INIT_URL();
  console.log('Inicializando upload em:', url);
  console.log('Headers:', buildHeaders(true));
  console.log('Payload:', { fileName, fileSize, totalChunks: Math.ceil(fileSize / chunkSize), metadata });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({
      fileName: fileName,
      fileSize: fileSize,
      totalChunks: Math.ceil(fileSize / chunkSize),
      metadata
    })
  });

  return handleResponse<InitUploadResponse>(response);
};

/**
 * Verifica o status de um upload em chunks
 */
export const getChunkedUploadStatus = async (uploadId: string): Promise<UploadStatusResponse> => {
  const response = await fetch(`${CHUNK_UPLOAD_STATUS_URL()}?uploadId=${uploadId}`, {
    headers: buildHeaders()
  });

  return handleResponse<UploadStatusResponse>(response);
};

/**
 * Envia um chunk para o servidor
 */
export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
  chunk: Blob,
  checksum: string
): Promise<ChunkResponse> => {
  const formData = new FormData();
  formData.append('uploadId', uploadId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('chunk', chunk);
  formData.append('checksum', checksum);

  const response = await fetch(CHUNK_UPLOAD_CHUNK_URL(), {
    method: 'POST',
    headers: buildHeaders(),
    body: formData
  });

  return handleResponse<ChunkResponse>(response);
};

/**
 * Finaliza um upload em chunks
 */
export const finalizeChunkedUpload = async (
  uploadId: string,
  fileName: string,
  fileSize: number,
  metadata: UploadMetadata
): Promise<FinalizeResponse> => {
  const response = await fetch(CHUNK_UPLOAD_FINALIZE_URL(), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({
      uploadId: uploadId,
      fileName: fileName,
      fileSize: fileSize,
      metadata
    })
  });

  return handleResponse<FinalizeResponse>(response);
};

/**
 * Aborta um upload em chunks
 */
export const abortChunkedUpload = async (uploadId: string): Promise<{ message: string }> => {
  const response = await fetch(CHUNK_UPLOAD_ABORT_URL(), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ uploadId: uploadId })
  });

  return handleResponse<{ message: string }>(response);
};

/**
 * Calcula o checksum (MD5) de um blob
 */
export const calculateChecksum = async (blob: Blob): Promise<string> => {
  // Converter o blob para um ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();
  
  // Usar a API SubtleCrypto para calcular o hash MD5
  // Como SubtleCrypto não suporta MD5 diretamente, usamos SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  
  // Converter o ArrayBuffer para string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};