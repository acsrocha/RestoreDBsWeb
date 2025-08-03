import type { MonitoringJob, MonitoringStats } from '../store/monitoringStore';
import { getApiUrl, buildHeaders, handleResponse } from './apiUtils';

export interface UnifiedMonitoringData {
  activeJobs: MonitoringJob[];
  recentlyCompleted: MonitoringJob[];
  recentlyFailed: MonitoringJob[];
  stats: MonitoringStats;
}

class MonitoringService {
  private static instance: MonitoringService;
  private abortController: AbortController | null = null;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async fetchUnifiedData(): Promise<UnifiedMonitoringData> {
    this.abortPreviousRequest();
    this.abortController = new AbortController();

    try {
      const response = await fetch(getApiUrl('/api/monitoring/unified', true), {
        method: 'GET',
        headers: buildHeaders(),
        signal: this.abortController.signal
      });

      const data = await handleResponse<UnifiedMonitoringData>(response);
      
      // Validação de dados
      this.validateMonitoringData(data);
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Requisição cancelada');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/api/jobs/${jobId}/cancel`), {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ jobId })
    });

    await handleResponse(response, false);
  }

  private abortPreviousRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private validateMonitoringData(data: UnifiedMonitoringData): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados de monitoramento inválidos');
    }

    if (!Array.isArray(data.activeJobs)) {
      throw new Error('activeJobs deve ser um array');
    }

    if (!Array.isArray(data.recentlyCompleted)) {
      throw new Error('recentlyCompleted deve ser um array');
    }

    if (!Array.isArray(data.recentlyFailed)) {
      throw new Error('recentlyFailed deve ser um array');
    }

    if (!data.stats || typeof data.stats !== 'object') {
      throw new Error('stats deve ser um objeto');
    }

    // Validar consistência dos dados
    const totalJobs = data.activeJobs.length + data.recentlyCompleted.length + data.recentlyFailed.length;
    const statsTotal = data.stats.processing + data.stats.completed + data.stats.failed;
    
    if (Math.abs(totalJobs - statsTotal) > 1) {
      console.warn('Inconsistência detectada entre jobs e estatísticas', {
        totalJobs,
        statsTotal,
        activeJobs: data.activeJobs.length,
        completed: data.recentlyCompleted.length,
        failed: data.recentlyFailed.length,
        stats: data.stats
      });
    }
  }

  destroy(): void {
    this.abortPreviousRequest();
  }
}

export const monitoringService = MonitoringService.getInstance();