/**
 * Sanitizador robusto para dados de monitoramento
 * Elimina dados fantasma e garante consistência
 */
export class MonitoringDataSanitizer {
  private static logInconsistency(type: string, details: any) {
    console.warn(`🚨 INCONSISTÊNCIA DETECTADA [${type}]:`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  static sanitize(rawData: any): any {
    // Validação de entrada
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Dados inválidos recebidos');
    }

    // Normalizar arrays
    const activeJobs = Array.isArray(rawData.activeJobs) ? rawData.activeJobs : [];
    const queuedFiles = Array.isArray(rawData.queuedFiles) ? rawData.queuedFiles : [];
    const recentlyCompleted = Array.isArray(rawData.recentlyCompleted) ? rawData.recentlyCompleted : [];
    const recentlyFailed = Array.isArray(rawData.recentlyFailed) ? rawData.recentlyFailed : [];

    // Calcular valores reais baseado APENAS em dados concretos
    const processingJobs = activeJobs.filter(job => job.status === 'processing' || job.status === 'in_progress');
    const realProcessing = processingJobs.length;
    const realQueued = queuedFiles.length;
    const realCompleted = recentlyCompleted.length;
    const realFailed = recentlyFailed.length;
    
    // LIMPEZA AGRESSIVA - Forçar zero se há inconsistência
    const statsProcessing = rawData.stats?.processing || 0;
    const hasRealActiveJobs = activeJobs.length > 0;
    
    // Se stats reporta processamento mas não há jobs reais, FORÇAR ZERO
    const finalProcessing = (statsProcessing > 0 && !hasRealActiveJobs) ? 0 : realProcessing;

    if (statsProcessing > 0 && !hasRealActiveJobs) {
      this.logInconsistency('GHOST_PROCESSING_ELIMINATED', {
        reportedProcessing: statsProcessing,
        actualActiveJobs: activeJobs.length,
        action: 'FORCED_TO_ZERO'
      });
    }

    const statsQueued = rawData.stats?.queued || 0;
    if (statsQueued !== realQueued) {
      this.logInconsistency('QUEUE_MISMATCH', {
        reported: statsQueued,
        actual: realQueued,
        queuedFiles: realQueued
      });
    }

    // Dados sanitizados
    return {
      stats: {
        total: realProcessing + realQueued + realCompleted + realFailed,
        downloading: 0,
        extracting: 0,
        validating: 0,
        processing: finalProcessing,
        queued: realQueued,
        completed: realCompleted,
        failed: realFailed
      },
      activeJobs,
      recentlyCompleted,
      recentlyFailed,
      queuedFiles,
      currentProcessing: (finalProcessing > 0 && processingJobs.length > 0) ? processingJobs[0].fileName : '',
      queueCount: realQueued,
      recentActivity: rawData.recentActivity || []
    };
  }
}