// src/services/uploadApi.ts
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';

const UPLOAD_API_URL = () => getApiUrl('/api/upload');

export const uploadBackup = async (formData: FormData): Promise<string> => {
  // Starting upload
  
  try {
    const response = await fetch(UPLOAD_API_URL(), {
      method: 'POST',
      headers: buildHeaders(), // FormData define Content-Type automaticamente
      body: formData,
    });
    
    // Server response received
    
    if (!response.ok) {
      const errorText = await response.text();
      // Server error details
    }
    
    return handleResponse<string>(response, false); // Resposta é texto plano
  } catch (error) {
    // Fetch error
    throw error;
  }
};