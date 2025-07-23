// src/services/fileMonitoringApi.ts
import type { FileMonitoringData } from '../types/fileMonitoring';
import { generateMockFileMonitoringData } from './mockFileMonitoring';

// Variáveis de ambiente no Vite precisam começar com VITE_
const API_KEY = import.meta.env.VITE_APP_RESTOREDB_API_KEY;

// Função para obter URL base do servidor
const getServerUrl = () => {
  // Usar URL vazia para usar o proxy do Vite
  return '';
};

const getApiUrl = (endpoint: string) => {
  const serverUrl = getServerUrl();
  const finalUrl = serverUrl ? `${serverUrl}${endpoint}` : endpoint;
  return finalUrl;
};

const FILE_MONITORING_API_URL = () => getApiUrl('/api/file_monitoring');

// Função auxiliar para construir cabeçalhos, incluindo a API Key
const buildHeaders = (includeContentTypeJson = false): HeadersInit => {
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

async function handleResponse<T>(response: Response, isJsonExpected = true): Promise<T> {
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

// Flag para usar dados mockados (temporário até o backend estar pronto)
// IMPORTANTE: Altere para false quando o backend estiver implementado com a API /api/file_monitoring
// O proxy no vite.config.ts já está configurado para redirecionar as chamadas para o backend
const USE_MOCK_DATA = false; // Backend agora implementa o endpoint /api/file_monitoring

// Endpoint para buscar dados de monitoramento de arquivos
export const fetchFileMonitoringData = async (): Promise<FileMonitoringData> => {
  if (USE_MOCK_DATA) {
    // Simular um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockFileMonitoringData();
  }
  
  try {
    console.log('Buscando dados de monitoramento...');
    const response = await fetch(FILE_MONITORING_API_URL(), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const data = await handleResponse<FileMonitoringData>(response);
    console.log('Dados recebidos:', data);
    
    // Verificar se os dados estão vazios
    if (
      (!data.activeFiles || data.activeFiles.length === 0) &&
      (!data.recentlyCompleted || data.recentlyCompleted.length === 0) &&
      (!data.recentlyFailed || data.recentlyFailed.length === 0)
    ) {
      console.log('Aviso: Todos os arrays de monitoramento estão vazios');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de monitoramento:', error);
    throw error;
  }
};

// Endpoint para buscar detalhes de um arquivo específico
export const fetchFileDetails = async (fileId: string): Promise<any> => {
  const response = await fetch(`${FILE_MONITORING_API_URL()}/${fileId}`, { 
    cache: 'no-store',
    headers: buildHeaders()
  });
  return handleResponse<any>(response);
};