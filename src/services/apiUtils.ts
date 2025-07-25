// src/services/apiUtils.ts

// Variáveis de ambiente no Vite precisam começar com VITE_
const API_KEY = import.meta.env.VITE_APP_RESTOREDB_API_KEY;

// Função para obter URL base do servidor
export const getServerUrl = () => {
  // Usar URL vazia para usar o proxy do Vite
  return '';
};

export const getApiUrl = (endpoint: string) => {
  const serverUrl = getServerUrl();
  const finalUrl = serverUrl ? `${serverUrl}${endpoint}` : endpoint;
  return finalUrl;
};

// Função auxiliar para construir cabeçalhos, incluindo a API Key
export const buildHeaders = (includeContentTypeJson = false): HeadersInit => {
  const headers: HeadersInit = {};
  
  // Sempre incluir API Key se disponível
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  if (includeContentTypeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error for ${response.url}: ${response.status} - ${errorText}`);
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson && errorJson.error) {
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
  // Para respostas que não são JSON
  return response.text() as unknown as Promise<T>;
}