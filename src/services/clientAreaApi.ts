// src/services/clientAreaApi.ts
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';
import type { 
  CreateClientUploadAreaRequest, 
  CreateClientUploadAreaResponse, 
  AdminClientUploadAreaDetail 
} from './apiTypes';

const CREATE_CLIENT_DRIVE_AREA_URL = () => getApiUrl('/api/client_upload_area/create');
const ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL = '/api/admin/client_upload_areas_details';
const ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL = '/api/admin/client_upload_areas';

export const createClientDriveArea = async (
  data: CreateClientUploadAreaRequest
): Promise<CreateClientUploadAreaResponse> => {
  const response = await fetch(CREATE_CLIENT_DRIVE_AREA_URL(), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  return handleResponse<CreateClientUploadAreaResponse>(response, true);
};

export const fetchAdminClientUploadAreaDetails = async (): Promise<AdminClientUploadAreaDetail[]> => {
  const response = await fetch(getApiUrl(ADMIN_CLIENT_UPLOAD_AREAS_DETAILS_URL), {
    headers: buildHeaders(),
    cache: 'no-store',
  });
  return handleResponse<AdminClientUploadAreaDetail[]>(response, true);
};

export const updateClientUploadAreaStatus = async (
  areaId: string,
  newStatus: string
): Promise<{ message: string }> => {
  const response = await fetch(`${getApiUrl(ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL)}/${areaId}/status`, {
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
  const response = await fetch(`${getApiUrl(ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL)}/${areaId}/notes`, {
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
  const response = await fetch(`${getApiUrl(ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL)}/${areaId}/download`, {
    method: 'POST',
    headers: buildHeaders(),
    cache: 'no-store',
  });
  return handleResponse<{ message: string }>(response, true);
};

export const deleteClientUploadArea = async (areaId: string): Promise<void> => {
  const response = await fetch(`${getApiUrl(ADMIN_CLIENT_UPLOAD_AREAS_BASE_URL)}/${areaId}`, {
    method: 'DELETE',
    headers: buildHeaders(),
    cache: 'no-store',
  });
  await handleResponse<void>(response, false); // Backend retorna 204 No Content
};