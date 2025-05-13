// src/services/api.ts
// src/services/api.ts
import type { StatusData, FailedRestoreItem, ProcessedDatabase } from '../types/api';

const STATUS_API_URL = '/api/status';
const ERRORS_API_URL = '/api/errors';
const PROCESSED_API_URL = '/api/processed_databases';
const UPLOAD_API_URL = '/api/upload';

// Função auxiliar para tratamento de erros de fetch
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    throw new Error(`Network response was not ok: ${response.status} - ${errorText || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const fetchStatusData = async (): Promise<StatusData> => {
  const response = await fetch(STATUS_API_URL, { cache: 'no-store' });
  return handleResponse<StatusData>(response);
};

export const fetchErrorsData = async (): Promise<FailedRestoreItem[]> => {
  const response = await fetch(ERRORS_API_URL, { cache: 'no-store' });
  return handleResponse<FailedRestoreItem[]>(response);
};

export const fetchProcessedDatabases = async (): Promise<ProcessedDatabase[]> => {
  const response = await fetch(PROCESSED_API_URL, { cache: 'no-store' });
  return handleResponse<ProcessedDatabase[]>(response);
};

export const uploadBackup = async (formData: FormData): Promise<string> => {
  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Upload API Error: ${response.status} - ${errorText}`);
    throw new Error(`Upload failed: ${errorText || response.statusText}`);
  }
  return response.text(); // A API original retorna texto
};

export const markDatabaseForDiscard = async (dbId: string): Promise<string> => {
  const response = await fetch(`${PROCESSED_API_URL}/${dbId}/mark_for_discard`, {
    method: 'POST',
    cache: 'no-store'
  });
  const responseText = await response.text();
  if (!response.ok) {
    console.error(`Mark for discard API Error for ID ${dbId}: ${response.status} - ${responseText}`);
    throw new Error(`Failed to mark for discard (ID: ${dbId}): ${responseText || response.statusText}`);
  }
  return responseText;
};