// src/services/api.ts
import { buildHeaders, getApiUrl, handleResponse } from './apiUtils';

// Endpoint para buscar dados de saúde do sistema
export const fetchHealthData = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/health'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar dados de saúde do sistema:', error);
    throw error;
  }
};

// Endpoint para buscar dados de status
export const fetchStatusData = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/status'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar dados de status:', error);
    throw error;
  }
};

// Endpoint para buscar dados de erros
export const fetchErrorsData = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/errors'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar dados de erros:', error);
    throw error;
  }
};

// Endpoint para buscar atividade do sistema
export const fetchSystemActivity = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/system_activity'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar atividade do sistema:', error);
    throw error;
  }
};

// Endpoint para buscar bancos de dados processados
export const fetchProcessedDatabases = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/processed_databases'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar bancos de dados processados:', error);
    throw error;
  }
};

// Endpoint para marcar banco de dados para descarte
export const markDatabaseForDiscard = async (databaseId: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/discard_database/${databaseId}`), { 
      method: 'POST',
      headers: buildHeaders(true)
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao marcar banco de dados para descarte:', error);
    throw error;
  }
};

// Endpoint para fazer upload de backup
export const uploadBackup = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/upload'), { 
      method: 'POST',
      headers: buildHeaders(), // Não incluir Content-Type para FormData
      body: formData
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao fazer upload de backup:', error);
    throw error;
  }
};

// Endpoint para criar área de cliente no Drive
export const createClientDriveArea = async (data: any): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/create_client_area'), { 
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(data)
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao criar área de cliente no Drive:', error);
    throw error;
  }
};

// Endpoint para buscar detalhes de áreas de cliente
export const fetchAdminClientUploadAreaDetails = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/client_upload_areas_admin_details'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar detalhes de áreas de cliente:', error);
    throw error;
  }
};

// Endpoint para baixar do Drive
export const downloadFromDrive = async (driveId: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/download_from_drive/${driveId}`), { 
      method: 'POST',
      headers: buildHeaders(true)
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao baixar do Drive:', error);
    throw error;
  }
};

// Endpoint para excluir área de cliente
export const deleteClientUploadArea = async (areaId: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/client_upload_area/${areaId}`), { 
      method: 'DELETE',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao excluir área de cliente:', error);
    throw error;
  }
};

// Endpoint para atualizar status de área de cliente
export const updateClientUploadAreaStatus = async (areaId: string, status: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/client_upload_area_status/${areaId}`), { 
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify({ status })
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao atualizar status de área de cliente:', error);
    throw error;
  }
};

// Endpoint para atualizar notas de área de cliente
export const updateClientUploadAreaNotes = async (areaId: string, notes: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/client_upload_area_notes/${areaId}`), { 
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify({ notes })
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao atualizar notas de área de cliente:', error);
    throw error;
  }
};

// Endpoint para buscar configuração CORS
export const fetchCORSConfig = async (): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/cors_config'), { 
      cache: 'no-store',
      headers: buildHeaders()
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao buscar configuração CORS:', error);
    throw error;
  }
};

// Endpoint para atualizar configuração CORS
export const updateCORSConfig = async (config: any): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/cors_config'), { 
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify(config)
    });
    
    return handleResponse<any>(response);
  } catch (error) {
    console.error('Erro ao atualizar configuração CORS:', error);
    throw error;
  }
};