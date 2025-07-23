// src/services/uploadApi.ts
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';

const UPLOAD_API_URL = () => getApiUrl('/api/upload');

export const uploadBackup = async (formData: FormData): Promise<string> => {
  console.log('Iniciando upload para:', UPLOAD_API_URL());
  console.log('FormData contém backupFile:', formData.has('backupFile'));
  
  try {
    const response = await fetch(UPLOAD_API_URL(), {
      method: 'POST',
      headers: buildHeaders(), // FormData define Content-Type automaticamente
      body: formData,
    });
    
    console.log('Resposta do servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro detalhado do servidor:', errorText);
    }
    
    return handleResponse<string>(response, false); // Resposta é texto plano
  } catch (error) {
    console.error('Erro na chamada fetch:', error);
    throw error;
  }
};