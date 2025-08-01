import { buildHeaders, getApiUrl, handleResponse } from './apiUtils';

export interface CancelJobResponse {
  message: string;
  jobId: string;
  fileName: string;
}

export const cancelJob = async (jobId: string): Promise<CancelJobResponse> => {
  try {
    const response = await fetch(getApiUrl(`/api/jobs/${jobId}/cancel`), {
      method: 'POST',
      headers: buildHeaders(),
    });
    
    return handleResponse<CancelJobResponse>(response);
  } catch (error) {
    console.error('Erro ao cancelar job:', error);
    throw error;
  }
};