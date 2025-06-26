// src/services/api.ts
import type {
  StatusData,
  FailedRestoreItem,
  ProcessedDatabase,
  CreateClientUploadAreaRequest,
  CreateClientUploadAreaResponse,
  AdminClientUploadAreaDetail
} from '../types/api';

// Variáveis de ambiente no Vite precisam começar com VITE_
// Você precisará criar um arquivo .env na raiz do seu projeto frontend
const API_KEY = import.meta.env.VITE_APP_RESTOREDB_API_KEY;

if (!API_KEY) {
  console.warn(
    "ATENÇÃO: A chave de API (VITE_APP_RESTOREDB_API_KEY) não está configurada no frontend. " +
    "Crie um arquivo .env na raiz do projeto frontend com VITE_APP_RESTOREDB_API_KEY=sua_chave_aqui. " +
    "As chamadas para endpoints protegidos falharão sem ela."
  );
}

const STATUS_API_URL = '/api/status';
const ERRORS_API_URL = '/api/errors';
const PROCESSED_API_URL = '/api/processed_databases';
const UPLOAD_API_URL = '/api/upload';
const CREATE_CLIENT_DRIVE_AREA_URL = '/api/client_upload_area/create';
const ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL = '/api/admin/client_upload_areas_details';
const ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL = '/api/admin/client_upload_areas';
const HEALTH_API_URL = '/api/health';
const SYSTEM_ACTIVITY_API_URL = '/api/system_activity';

// Função auxiliar para construir cabeçalhos, incluindo a API Key
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

async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    try {
      const errorJson = JSON.parse(errorText);
      // Backend envia a mensagem de erro na propriedade "error"
      if (errorJson && errorJson.error) { // <<< ALTERAÇÃO: Usar errorJson.error
        throw new Error(errorJson.error);
      }
    } catch (e) {
      // Ignora o erro do parse, ou se errorText não for JSON
    }
    throw new Error(errorText || `Erro de rede: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) { // No Content
    return {} as Promise<T>;
  }

  if (isJsonExpected) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json() as Promise<T>;
    } else if (response.status === 200 && response.headers.get('content-length') === '0' ) {
        console.warn(`API Info for ${response.url}: Expected JSON but received ${response.status} with no JSON content.`);
        return {} as Promise<T>;
    } else {
        const text = await response.text();
        console.warn(`API Warning for ${response.url}: Expected JSON response but got ${contentType}. Body: ${text}`);
        throw new Error(`Resposta inesperada do servidor: ${text || response.statusText}`);
    }
  }
  // Para respostas que não são JSON (ex: texto plano do uploadHandler)
  return response.text() as unknown as Promise<T>;
}


// Endpoints Públicos (não precisam de API Key)
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

// Endpoints Protegidos (agora incluem API Key)
export const uploadBackup = async (formData: FormData): Promise<string> => {
  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    headers: buildHeaders(), // FormData define Content-Type automaticamente
    body: formData,
  });
  return handleResponse<string>(response, false); // Resposta é texto plano
};

export const markDatabaseForDiscard = async (dbId: string, confirmationTicketID: string): Promise<string> => {
  const response = await fetch(`${PROCESSED_API_URL}/${dbId}/mark_for_discard`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ confirmationTicketID: confirmationTicketID }),
    cache: 'no-store'
  });
  return handleResponse<string>(response, false); // Resposta é texto plano
};

export const createClientDriveArea = async (
  data: CreateClientUploadAreaRequest
): Promise<CreateClientUploadAreaResponse> => {
  const response = await fetch(CREATE_CLIENT_DRIVE_AREA_URL, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  return handleResponse<CreateClientUploadAreaResponse>(response, true);
};

export const fetchAdminClientUploadAreaDetails = async (): Promise<AdminClientUploadAreaDetail[]> => {
  const response = await fetch(ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL, {
    headers: buildHeaders(),
    cache: 'no-store',
  });
  return handleResponse<AdminClientUploadAreaDetail[]>(response, true);
};

export const updateClientUploadAreaStatus = async (
  areaId: string,
  newStatus: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/status`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify({ status: newStatus }),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

export const updateClientUploadAreaNotes = async (
  areaId: string,
  newNotes: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/notes`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify({ notes: newNotes }),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

export const downloadFromDrive = async (
  areaId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/download`, {
    method: 'POST',
    headers: buildHeaders(),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

export const deleteClientUploadArea = async (areaId: string): Promise<void> => {
    const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}`, {
        method: 'DELETE',
        headers: buildHeaders(),
        cache: 'no-store',
    });
    await handleResponse<void>(response, false); // Backend retorna 204 No Content
};

// Novos endpoints para monitoramento do sistema
export const fetchHealthData = async (): Promise<any> => {
  console.log('Fazendo chamada para:', HEALTH_API_URL);
  const response = await fetch(HEALTH_API_URL, { 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  return handleResponse<any>(response);
};

export const fetchSystemActivity = async (): Promise<string[]> => {
  const response = await fetch(SYSTEM_ACTIVITY_API_URL, { cache: 'no-store' });
  return handleResponse<string[]>(response);
};