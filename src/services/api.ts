// src/services/api.ts
import type {
  StatusData,
  FailedRestoreItem,
  ProcessedDatabase,
  CreateClientUploadAreaRequest,
  CreateClientUploadAreaResponse,
  // NOVO: Importar os novos tipos para a página de administração
  AdminClientUploadAreaDetail
} from '../types/api'; // Supondo que suas interfaces Admin estejam em 'src/types/api.ts'

const STATUS_API_URL = '/api/status';
const ERRORS_API_URL = '/api/errors';
const PROCESSED_API_URL = '/api/processed_databases';
const UPLOAD_API_URL = '/api/upload';
const CREATE_CLIENT_DRIVE_AREA_URL = '/api/client_upload_area/create';
// NOVO: URL para o endpoint de detalhes das áreas de upload de administração
const ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL = '/api/admin/client_upload_areas_details';
// NOVO: URL base para as ações de administração de áreas de cliente
const ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL = '/api/admin/client_upload_areas';


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
    } else if (response.status === 204 || (response.status === 200 && response.headers.get('content-length') === '0') ) { // No Content or OK with no body
        // Se for No Content (ou OK sem corpo, como alguns PUTs podem retornar), mas esperávamos JSON,
        // pode ser um T que permite null ou undefined.
        // Para este caso, retornaremos um objeto vazio para satisfazer a assinatura,
        // mas o chamador deve estar ciente.
        console.warn(`API Info for ${response.url}: Expected JSON but received ${response.status} with no JSON content.`);
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

// Função para criar a área de upload do cliente no Google Drive
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

// Função para buscar detalhes das áreas de upload de clientes (ADMIN)
export const fetchAdminClientUploadAreaDetails = async (): Promise<AdminClientUploadAreaDetail[]> => {
  const response = await fetch(ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL, {
    cache: 'no-store', // Garante que os dados sejam sempre os mais recentes
  });
  // Espera-se que a resposta seja um JSON contendo um array de AdminClientUploadAreaDetail
  return handleResponse<AdminClientUploadAreaDetail[]>(response, true); // isJsonExpected = true
};

// --- NOVA FUNÇÃO PARA ATUALIZAR O STATUS DA ÁREA DE UPLOAD DO CLIENTE ---
/**
 * Atualiza o status de uma área de upload de cliente específica.
 * @param areaId O ID da área de upload do cliente.
 * @param newStatus O novo status a ser definido.
 * @returns Uma promessa que resolve para um objeto contendo a mensagem de sucesso do backend.
 */
export const updateClientUploadAreaStatus = async (
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
  // O backend retorna um JSON com "message" em caso de 200 OK.
  return handleResponse<{ message: string }>(response, true);
};
// --- FIM DA NOVA FUNÇÃO ---