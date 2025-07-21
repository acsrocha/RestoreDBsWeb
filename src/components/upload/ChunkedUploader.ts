// src/components/upload/ChunkedUploader.ts
import { calculateChecksum, initChunkedUpload, uploadChunk, getChunkedUploadStatus, finalizeChunkedUpload, abortChunkedUpload } from '../../services/chunkedUploadApi';
import type { UploadMetadata, InitUploadResponse, UploadStatusResponse, ChunkResponse, FinalizeResponse } from '../../services/chunkedUploadApi';

// Re-exportar interfaces para compatibilidade com código existente
export type { UploadMetadata, InitUploadResponse, UploadStatusResponse, ChunkResponse, FinalizeResponse };

/**
 * Classe para gerenciar upload de arquivos grandes em chunks
 * Otimizada para arquivos de 50GB-200GB
 */
export class ChunkedUploader {
  private file: File;
  private chunkSize: number;
  private totalChunks: number;
  private uploadId: string = '';
  private metadata: UploadMetadata;
  private receivedChunks: number[] = [];
  private aborted: boolean = false;
  private paused: boolean = false;
  private retryCount: number = 5; // Aumentado para maior resiliência
  private retryDelay: number = 2000; // Aumentado para evitar sobrecarga
  private activeRequests: AbortController[] = [];
  private storageKey: string = '';
  private maxConcurrentUploads: number = 3;

  // Callbacks
  private onProgress: (progress: number) => void;
  private onChunkComplete: (chunkIndex: number, receivedCount: number, totalCount: number) => void;
  private onComplete: (response: any) => void;
  private onError: (error: Error) => void;
  private onStatusChange: (status: 'initializing' | 'uploading' | 'paused' | 'finalizing' | 'completed' | 'error' | 'aborted') => void;

  /**
   * Cria um novo uploader de chunks otimizado para arquivos grandes
   * @param file Arquivo a ser enviado
   * @param metadata Metadados adicionais para enviar com o arquivo
   * @param onProgress Callback de progresso (0-100)
   * @param onChunkComplete Callback quando um chunk é completado
   * @param onComplete Callback quando completo
   * @param onError Callback de erro
   * @param onStatusChange Callback de mudança de status
   * @param chunkSize Tamanho de cada chunk em bytes (padrão: 25MB)
   * @param maxConcurrentUploads Número máximo de uploads simultâneos (padrão: 3)
   */
  constructor(
    file: File,
    metadata: UploadMetadata,
    onProgress: (progress: number) => void,
    onChunkComplete: (chunkIndex: number, receivedCount: number, totalCount: number) => void,
    onComplete: (response: any) => void,
    onError: (error: Error) => void,
    onStatusChange: (status: 'initializing' | 'uploading' | 'paused' | 'finalizing' | 'completed' | 'error' | 'aborted') => void,
    chunkSize: number = 1 * 1024 * 1024, // 1MB por padrão para facilitar o teste
    maxConcurrentUploads: number = 3
  ) {
    this.file = file;
    this.chunkSize = chunkSize;
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.metadata = metadata;
    this.onProgress = onProgress;
    this.onChunkComplete = onChunkComplete;
    this.onComplete = onComplete;
    this.onError = onError;
    this.onStatusChange = onStatusChange;
    this.maxConcurrentUploads = maxConcurrentUploads;
    this.storageKey = `chunked_upload_${file.name}_${file.size}_${file.lastModified}`;
  }

  /**
   * Inicia o processo de upload
   */
  public async start(): Promise<void> {
    try {
      this.onStatusChange('initializing');
      
      // Limpar estado anterior para forçar novo upload
      this.clearState();
      this.receivedChunks = [];
      
      // Iniciar novo upload
      await this.initializeUpload();
      
      // Iniciar envio de chunks
      this.onStatusChange('uploading');
      await this.uploadChunks();
    } catch (error) {
      this.onStatusChange('error');
      this.onError(error instanceof Error ? error : new Error('Erro desconhecido ao iniciar upload'));
    }
  }

  /**
   * Pausa o upload atual
   */
  public pause(): void {
    this.paused = true;
    this.onStatusChange('paused');
    
    // Cancelar requisições ativas
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests = [];
    
    // Salvar estado atual
    this.saveState();
  }

  /**
   * Retoma um upload pausado
   */
  public resume(): void {
    if (!this.paused) return;
    
    this.paused = false;
    this.onStatusChange('uploading');
    this.uploadChunks();
  }

  /**
   * Aborta o upload atual
   */
  public async abort(): Promise<void> {
    this.aborted = true;
    this.paused = false;
    this.onStatusChange('aborted');
    
    // Cancelar requisições ativas
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests = [];
    
    // Notificar o servidor sobre o cancelamento
    try {
      await abortChunkedUpload(this.uploadId);
    } catch (error) {
      console.warn('Erro ao notificar servidor sobre cancelamento:', error);
    }
    
    // Limpar estado
    this.clearState();
  }

  /**
   * Inicializa o upload no servidor e obtém um ID
   */
  private async initializeUpload(): Promise<void> {
    const data = await initChunkedUpload(
      this.file.name,
      this.file.size,
      this.metadata,
      this.chunkSize
    );
    
    // Compatibilidade com diferentes formatos de resposta
    this.uploadId = data.uploadId || data.upload_id;
    this.chunkSize = data.chunkSize || data.chunk_size || this.chunkSize;
    this.totalChunks = data.totalChunks || data.total_chunks || Math.ceil(this.file.size / this.chunkSize);
    
    console.log('Upload inicializado:', { 
      uploadId: this.uploadId, 
      chunkSize: this.chunkSize, 
      totalChunks: this.totalChunks 
    });
    
    // Salvar estado inicial
    this.saveState();
  }

  /**
   * Verifica o status do upload no servidor
   */
  private async checkServerStatus(): Promise<void> {
    try {
      const data = await getChunkedUploadStatus(this.uploadId);
      
      // Atualizar progresso
      const progress = Math.round(data.progress);
      this.onProgress(progress);
      
      // Atualizar chunks recebidos (compatibilidade com diferentes formatos)
      if (data.receivedChunks || data.received_chunks) {
        this.receivedChunks = data.receivedChunks || data.received_chunks;
      }
      
      console.log('Status do upload:', { 
        uploadId: this.uploadId, 
        progress, 
        receivedChunks: this.receivedChunks.length 
      });
    } catch (error) {
      // Verificar se o erro é 404 (upload não encontrado)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404') && errorMessage.includes('não encontrado')) {
        console.warn('Upload não encontrado no servidor. Reiniciando upload...');
        this.clearState();
        await this.initializeUpload();
        return;
      }
      if (error instanceof Error && error.message.includes('404')) {
        // Upload não encontrado no servidor, iniciar novo
        this.clearState();
        await this.initializeUpload();
      } else {
        throw error;
      }
    }
  }

  /**
   * Envia todos os chunks pendentes para o servidor
   */
  private async uploadChunks(): Promise<void> {
    if (this.aborted || this.paused) return;
    
    // Forçar envio de todos os chunks
    const pendingChunks = [];
    for (let i = 0; i < this.totalChunks; i++) {
      pendingChunks.push(i);
    }
    
    console.log(`Enviando todos os chunks: ${pendingChunks.length} de ${this.totalChunks}`);
    
    // Enviar todos os chunks em lotes
    for (let i = 0; i < pendingChunks.length; i += this.maxConcurrentUploads) {
      const batch = pendingChunks.slice(i, i + this.maxConcurrentUploads);
      console.log(`Enviando lote ${Math.floor(i/this.maxConcurrentUploads) + 1}: ${batch.length} chunks`);
      
      try {
        await Promise.all(batch.map(chunkIndex => this.uploadChunk(chunkIndex)));
      } catch (error) {
        console.error(`Erro ao enviar lote ${Math.floor(i/this.maxConcurrentUploads) + 1}:`, error);
        throw error;
      }
    }
    
    console.log('Todos os chunks enviados, finalizando upload...');
    
    // Finalizar o upload após enviar todos os chunks
    await this.finalizeUpload();
  }

  /**
   * Retorna os índices de chunks que ainda não foram enviados
   */
  private getPendingChunks(): number[] {
    const pendingChunks: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.receivedChunks.includes(i)) {
        pendingChunks.push(i);
      }
    }
    return pendingChunks;
  }

  /**
   * Envia um chunk específico para o servidor
   */
  private async uploadChunk(chunkIndex: number, retryCount = 0): Promise<void> {
    console.log(`Iniciando upload do chunk ${chunkIndex}...`);
    if (this.aborted || this.paused) return;
    
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);
    
    // Calcular checksum do chunk
    const checksum = await calculateChecksum(chunk);
    
    const controller = new AbortController();
    this.activeRequests.push(controller);
    
    try {
      const data = await uploadChunk(
        this.uploadId,
        chunkIndex,
        this.totalChunks,
        chunk,
        checksum
      );
      
      // Remover controller da lista de requisições ativas
      const index = this.activeRequests.indexOf(controller);
      if (index !== -1) {
        this.activeRequests.splice(index, 1);
      }
      
      // Atualizar progresso (compatibilidade com diferentes formatos)
      this.onProgress(Math.round(data.progress));
      
      console.log('Chunk enviado:', { 
        chunkIndex, 
        progress: data.progress,
        receivedChunks: data.receivedChunks || data.received_chunks
      });
      
      // Adicionar chunk à lista de recebidos
      if (!this.receivedChunks.includes(chunkIndex)) {
        this.receivedChunks.push(chunkIndex);
      }
      
      // Notificar conclusão do chunk
      this.onChunkComplete(chunkIndex, this.receivedChunks.length, this.totalChunks);
      
      // Salvar estado
      this.saveState();
    } catch (error) {
      // Se foi abortado, não tentar novamente
      if (this.aborted || this.paused) return;
      
      // Remover controller da lista de requisições ativas
      const index = this.activeRequests.indexOf(controller);
      if (index !== -1) {
        this.activeRequests.splice(index, 1);
      }
      
      // Tentar novamente se ainda houver tentativas restantes
      if (retryCount < this.retryCount) {
        console.warn(`Erro ao enviar chunk ${chunkIndex}, tentando novamente (${retryCount + 1}/${this.retryCount})...`);
        // Backoff exponencial para evitar sobrecarregar o servidor
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.uploadChunk(chunkIndex, retryCount + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Finaliza o upload no servidor
   */
  private async finalizeUpload(): Promise<void> {
    this.onStatusChange('finalizing');
    
    // Verificar se todos os chunks foram enviados
    if (this.receivedChunks.length < this.totalChunks) {
      console.error(`Tentativa de finalizar upload incompleto: ${this.receivedChunks.length} de ${this.totalChunks} chunks enviados`);
      throw new Error(`Upload incompleto: ${this.receivedChunks.length} de ${this.totalChunks} chunks enviados`);
    }
    
    console.log(`Finalizando upload ${this.uploadId} com ${this.receivedChunks.length} chunks enviados`);
    
    try {
      const data = await finalizeChunkedUpload(
        this.uploadId,
        this.file.name,
        this.file.size,
        this.metadata
      );
      
      console.log('Upload finalizado:', data);
      
      // Limpar estado
      this.clearState();
      
      this.onStatusChange('completed');
      this.onComplete(data);
    } catch (error) {
      this.onStatusChange('error');
      this.onError(error instanceof Error ? error : new Error('Erro ao finalizar upload'));
    }
  }

  /**
   * Salva o estado atual no localStorage
   */
  private saveState(): void {
    try {
      const state = {
        uploadId: this.uploadId,
        fileName: this.file.name,
        fileSize: this.file.size,
        totalChunks: this.totalChunks,
        receivedChunks: this.receivedChunks,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Falha ao salvar estado do upload:', error);
    }
  }

  /**
   * Carrega o estado do localStorage
   */
  private loadState(): { uploadId: string, receivedChunks: number[] } | null {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) return null;
      
      const state = JSON.parse(stateJson);
      
      // Verificar se o estado é válido para este arquivo
      if (state.fileName !== this.file.name || state.fileSize !== this.file.size) {
        return null;
      }
      
      // Verificar se o estado não expirou (7 dias para arquivos grandes)
      const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
      if (Date.now() - state.timestamp > expirationTime) {
        this.clearState();
        return null;
      }
      
      return {
        uploadId: state.uploadId,
        receivedChunks: state.receivedChunks
      };
    } catch (error) {
      console.warn('Falha ao carregar estado do upload:', error);
      return null;
    }
  }

  /**
   * Limpa o estado do localStorage
   */
  private clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Falha ao limpar estado do upload:', error);
    }
  }
}