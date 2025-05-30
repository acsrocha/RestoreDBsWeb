// src/services/api.ts
import type {
  StatusData,
  FailedRestoreItem,
  ProcessedDatabase,
  CreateClientUploadAreaRequest,
  CreateClientUploadAreaResponse,
  AdminClientUploadAreaDetail
} from '../types/api';

const STATUS_API_URL = '/api/status'; //
const ERRORS_API_URL = '/api/errors'; //
const PROCESSED_API_URL = '/api/processed_databases'; //
const UPLOAD_API_URL = '/api/upload'; //
const CREATE_CLIENT_DRIVE_AREA_URL = '/api/client_upload_area/create'; //
const ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL = '/api/admin/client_upload_areas_details'; //
const ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL = '/api/admin/client_upload_areas'; //


async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> { //
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson && errorJson.message) {
        throw new Error(errorJson.message);
      }
    } catch (e) {
      // Ignora o erro do parse
    }
    throw new Error(errorText || `Erro de rede: ${response.status} ${response.statusText}`);
  }

  // --- ALTERAÇÃO ---: Lida com respostas 204 No Content
  if (response.status === 204) {
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
  return response.text() as unknown as Promise<T>;
}


export const fetchStatusData = async (): Promise<StatusData> => { //
  const response = await fetch(STATUS_API_URL, { cache: 'no-store' });
  return handleResponse<StatusData>(response);
};

export const fetchErrorsData = async (): Promise<FailedRestoreItem[]> => { //
  const response = await fetch(ERRORS_API_URL, { cache: 'no-store' });
  return handleResponse<FailedRestoreItem[]>(response);
};

export const fetchProcessedDatabases = async (): Promise<ProcessedDatabase[]> => { //
  const response = await fetch(PROCESSED_API_URL, { cache: 'no-store' });
  return handleResponse<ProcessedDatabase[]>(response);
};

export const uploadBackup = async (formData: FormData): Promise<string> => { //
  const response = await fetch(UPLOAD_API_URL, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<string>(response, false);
};

export const markDatabaseForDiscard = async (dbId: string, confirmationTicketID: string): Promise<string> => { //
  const response = await fetch(`${PROCESSED_API_URL}/${dbId}/mark_for_discard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmationTicketID: confirmationTicketID }),
    cache: 'no-store'
  });
  return handleResponse<string>(response, false);
};

export const createClientDriveArea = async ( //
  data: CreateClientUploadAreaRequest
): Promise<CreateClientUploadAreaResponse> => {
  const response = await fetch(CREATE_CLIENT_DRIVE_AREA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  return handleResponse<CreateClientUploadAreaResponse>(response, true);
};

export const fetchAdminClientUploadAreaDetails = async (): Promise<AdminClientUploadAreaDetail[]> => { //
  const response = await fetch(ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL, {
    cache: 'no-store',
  });
  return handleResponse<AdminClientUploadAreaDetail[]>(response, true);
};

export const updateClientUploadAreaStatus = async ( //
  areaId: string,
  newStatus: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

export const updateClientUploadAreaNotes = async ( //
  areaId: string,
  newNotes: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/notes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes: newNotes }),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

// <<< NOVA FUNÇÃO PARA DOWNLOAD MANUAL >>>
/**
 * Solicita ao backend para baixar o arquivo mais recente de uma área do Drive para a fila.
 * @param areaId O ID da área de upload do cliente.
 * @returns Uma promessa que resolve para um objeto contendo a mensagem de sucesso do backend.
 */
export const downloadFromDrive = async (
  areaId: string
): Promise<{ message: string }> => {
  const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}/download`, {
    method: 'POST',
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};


// <<< NOVA FUNÇÃO PARA EXCLUIR ÁREA >>>
/**
 * Exclui permanentemente uma área de upload de cliente, incluindo a pasta no Drive.
 * @param areaId O ID da área de upload a ser excluída.
 * @returns Uma promessa que resolve quando a exclusão é bem-sucedida.
 */
export const deleteClientUploadArea = async (areaId: string): Promise<void> => {
    const response = await fetch(`${ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL}/${areaId}`, {
        method: 'DELETE',
        cache: 'no-store',
    });
    // O backend retorna 204 No Content, que não tem corpo JSON.
    await handleResponse<void>(response, false);
};