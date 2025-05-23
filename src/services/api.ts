// src/services/api.ts
import type {
  StatusData,
  FailedRestoreItem,
  ProcessedDatabase,
  // NOVO: Importar os novos tipos que você adicionou ao seu src/types/api.ts
  CreateClientUploadAreaRequest,
  CreateClientUploadAreaResponse
} from '../types/api';

const STATUS_API_URL = '/api/status';
const ERRORS_API_URL = '/api/errors';
const PROCESSED_API_URL = '/api/processed_databases';
const UPLOAD_API_URL = '/api/upload';
// NOVO: URL para o novo endpoint
const CREATE_CLIENT_DRIVE_AREA_URL = '/api/client_upload_area/create';

// Função auxiliar para tratamento de erros de fetch (sua função existente)
async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text(); // Sempre tente ler o texto do erro
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    // Tenta fazer parse do errorText como JSON para pegar uma mensagem mais estruturada, se houver
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson && errorJson.message) {
        throw new Error(errorJson.message);
      }
    } catch (e) {
      // Ignora o erro do parse e usa o errorText ou o statusText
    }
    throw new Error(errorText || `Erro de rede: ${response.status} ${response.statusText}`);
  }

  if (isJsonExpected) {
    // Para respostas que deveriam ser JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json() as Promise<T>;
    } else if (response.status === 204) { // No Content
        // Se for No Content, mas esperávamos JSON, pode ser um T que permite null ou undefined.
        // Para este caso, retornaremos um objeto vazio para satisfazer a assinatura,
        // mas o chamador deve estar ciente.
        // Ou, idealmente, o T seria `void` ou o handleResponse não seria chamado.
        // Dado que o backend pode retornar 201 ou 206 com JSON, e erros com JSON,
        // o 204 não deve ocorrer para chamadas que esperam CreateClientUploadAreaResponse.
        console.warn(`API Warning for ${response.url}: Expected JSON but received 204 No Content.`);
        return {} as Promise<T>; // Retorna um objeto vazio para T, pode precisar de ajuste no chamador
    } else {
        // Se esperávamos JSON mas não veio, pode ser um erro ou uma resposta inesperada
        const text = await response.text();
        console.warn(`API Warning for ${response.url}: Expected JSON response but got ${contentType}. Body: ${text}`);
        throw new Error(`Resposta inesperada do servidor: ${text || response.statusText}`);
    }
  }
  // Se JSON não é esperado (ex: para uploadBackup ou markDatabaseForDiscard que retornam texto)
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
    // cache: 'no-store' // Uploads geralmente não devem ser cacheados por padrão
  });
  // Para upload, a resposta de sucesso é texto, e a de erro também pode ser.
  return handleResponse<string>(response, false); // isJsonExpected = false
};

export const markDatabaseForDiscard = async (dbId: string, confirmationTicketID: string): Promise<string> => {
  const response = await fetch(`${PROCESSED_API_URL}/${dbId}/mark_for_discard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmationTicketID: confirmationTicketID }),
    cache: 'no-store'
  });
  return handleResponse<string>(response, false); // isJsonExpected = false
};

// NOVO: Função para criar a área de upload do cliente no Google Drive
export const createClientDriveArea = async (
  data: CreateClientUploadAreaRequest
): Promise<CreateClientUploadAreaResponse> => {
  const response = await fetch(CREATE_CLIENT_DRIVE_AREA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store', // Para garantir que não haja cache desta requisição POST
  });
  // A resposta de sucesso (201 Created ou 206 Partial Content) e
  // de erro do backend (400, 500, 503) são esperadas como JSON.
  return handleResponse<CreateClientUploadAreaResponse>(response, true); // isJsonExpected = true
};