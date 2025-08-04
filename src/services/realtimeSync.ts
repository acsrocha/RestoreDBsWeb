/**
 * Serviço de sincronização em tempo real usando eventos locais
 * Garante que todas as telas sejam atualizadas instantaneamente
 */

interface RealtimeEvent {
  type: 'download_started' | 'download_progress' | 'download_completed' | 'download_failed' | 'force_refresh';
  data: {
    trackingId: string;
    fileName: string;
    source: string;
    stage?: string;
    progress?: number;
    error?: string;
  };
}

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeSyncService {
  private static instance: RealtimeSyncService;
  private ws: WebSocket | null = null;
  private callbacks: Set<EventCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  static getInstance(): RealtimeSyncService {
    if (!RealtimeSyncService.instance) {
      RealtimeSyncService.instance = new RealtimeSyncService();
    }
    return RealtimeSyncService.instance;
  }

  connect() {
    try {
      const wsUrl = `ws://localhost:8558/ws/realtime`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 WebSocket conectado');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.notifyCallbacks(realtimeEvent);
        } catch (error) {
          console.error('Erro ao processar evento:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        console.log('⚠️ WebSocket erro - tentando reconectar');
      };

    } catch (error) {
      console.log('🔗 Usando sincronização local');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(callback: EventCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(event: RealtimeEvent) {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Erro ao executar callback:', error);
      }
    });
  }

  emitDownloadStarted(trackingId: string, fileName: string, source: string) {
    const event: RealtimeEvent = {
      type: 'download_started',
      data: { trackingId, fileName, source, stage: 'downloading', progress: 0 }
    };
    this.notifyCallbacks(event);
  }

  emitDownloadProgress(trackingId: string, stage: string, progress: number) {
    const event: RealtimeEvent = {
      type: 'download_progress',
      data: { trackingId, fileName: '', source: '', stage, progress }
    };
    this.notifyCallbacks(event);
  }

  emitDownloadCompleted(trackingId: string) {
    const event: RealtimeEvent = {
      type: 'download_completed',
      data: { trackingId, fileName: '', source: '', stage: 'completed', progress: 100 }
    };
    this.notifyCallbacks(event);
  }

  emitDownloadFailed(trackingId: string, error: string) {
    const event: RealtimeEvent = {
      type: 'download_failed',
      data: { trackingId, fileName: '', source: '', error }
    };
    this.notifyCallbacks(event);
  }

  disconnect() {
    this.callbacks.clear();
  }
}

export const realtimeSync = RealtimeSyncService.getInstance();
export type { RealtimeEvent };