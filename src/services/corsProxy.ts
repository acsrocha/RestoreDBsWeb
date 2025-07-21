// src/services/corsProxy.ts

/**
 * Função para contornar problemas de CORS usando um proxy público
 * Usar apenas para desenvolvimento
 */
export function addCorsProxy(url: string): string {
  // Usar apenas para URLs externas
  if (url.startsWith('http')) {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  return url;
}