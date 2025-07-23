// src/services/databaseApi.ts
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';
import type { ProcessedDatabase } from './apiTypes';

const PROCESSED_API_URL = () => getApiUrl('/api/processed_databases');

export const fetchProcessedDatabases = async (): Promise<ProcessedDatabase[]> => {
  const response = await fetch(PROCESSED_API_URL(), { cache: 'no-store' });
  return handleResponse<ProcessedDatabase[]>(response);
};

export const markDatabaseForDiscard = async (dbId: string, confirmationTicketID: string): Promise<string> => {
  const response = await fetch(`${PROCESSED_API_URL()}/${dbId}/mark_for_discard`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ confirmationTicketID: confirmationTicketID }),
    cache: 'no-store'
  });
  return handleResponse<string>(response, false); // Resposta é texto plano
};