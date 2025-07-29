// src/services/statusApi.ts
import { getApiUrl, handleResponse } from './apiUtils';
import type { StatusData, FailedRestoreItem } from './apiTypes';

const STATUS_API_URL = () => getApiUrl('/api/status');
const ERRORS_API_URL = () => getApiUrl('/api/errors');
const HEALTH_API_URL = () => getApiUrl('/api/health');
const SYSTEM_ACTIVITY_API_URL = () => getApiUrl('/api/system_activity');

// Endpoints Públicos (não precisam de API Key)
export const fetchStatusData = async (): Promise<StatusData> => {
  const response = await fetch(STATUS_API_URL(), { cache: 'no-store' });
  return handleResponse<StatusData>(response);
};

export const fetchErrorsData = async (): Promise<FailedRestoreItem[]> => {
  const response = await fetch(ERRORS_API_URL(), { cache: 'no-store' });
  return handleResponse<FailedRestoreItem[]>(response);
};

// Novos endpoints para monitoramento do sistema
export const fetchHealthData = async (): Promise<any> => {
  const url = HEALTH_API_URL();
  const response = await fetch(url, { 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return handleResponse<any>(response);
};

export const fetchSystemActivity = async (): Promise<string[]> => {
  const response = await fetch(SYSTEM_ACTIVITY_API_URL(), { cache: 'no-store' });
  return handleResponse<string[]>(response);
};