// src/services/api.ts
import type { StatusData, FailedRestoreItem, ProcessedDatabase } from '../types/api';

const STATUS_API_URL = '/api/status';
const ERRORS_API_URL = '/api/errors';
const PROCESSED_API_URL = '/api/processed_databases';
const UPLOAD_API_URL = '/api/upload';

// Função auxiliar para tratamento de erros de fetch
async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text(); // Sempre tente ler o texto do erro
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    throw new Error(errorText || `Erro de rede: ${response.status} ${response.statusText}`);
  }
  if (isJsonExpected) {
    // Para respostas que deveriam ser JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json() as Promise<T>;
    } else {
        // Se esperávamos JSON mas não veio, pode ser um erro ou uma resposta inesperada
        console.warn(`API Warning for ${response.url}: Expected JSON response but got ${contentType}`);
        // Tenta ler como texto se não for JSON, pode ser útil para debug
        // ou se o tipo T for string.
        return response.text() as unknown as Promise<T>;
    }
  }
  // Se JSON não é esperado (ex: para markDatabaseForDiscard que retorna texto)
  return response.text() as unknown as Promise<T>;
}


export const fetchStatusData = async (): Promise<StatusData> => {
  const response = await fetch(STATUS_API_URL, { cache: 'no-store' });
  return handleResponse<StatusData>(response); // isJsonExpected = true por padrão
};

export const fetchErrorsData = async (): Promise<FailedRestoreItem[]> => {
  const response = await fetch(ERRORS_API_URL, { cache: 'no-store' });
  return handleResponse<FailedRestoreItem[]>(response); // isJsonExpected = true por padrão
};

export const fetchProcessedDatabases = async (): Promise<ProcessedDatabase[]> => {
  const response = await fetch(PROCESSED_API_URL, { cache: 'no-store' });
  return handleResponse<ProcessedDatabase[]>(response); // isJsonExpected = true por padrão
};

export const uploadBackup = async (formData: FormData): Promise<string> => {
  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    body: formData,
  });
  // Para upload, a resposta de sucesso é texto, e a de erro também pode ser.
  return handleResponse<string>(response, false); // isJsonExpected = false
};

// ATUALIZADA para enviar o confirmationTicketID
export const markDatabaseForDiscard = async (dbId: string, confirmationTicketID: string): Promise<string> => {
  const response = await fetch(`${PROCESSED_API_URL}/${dbId}/mark_for_discard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmationTicketID: confirmationTicketID }), // Envia como JSON
    cache: 'no-store'
  });
  // A resposta (sucesso ou erro tratado pelo backend) é esperada como texto simples
  return handleResponse<string>(response, false); // isJsonExpected = false
};