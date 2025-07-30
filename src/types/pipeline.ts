export type PipelineStage = 
  | 'DOWNLOADING' 
  | 'EXTRACTING' 
  | 'VALIDATING' 
  | 'QUEUED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface StageDetail {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  progress?: number;
  message?: string;
  errorMessage?: string;
}

export interface PipelineItem {
  trackingId: string;
  fileName: string;
  source: 'upload' | 'drive' | 'upload_50gb';
  currentStage: PipelineStage;
  progress: number;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  stages: {
    downloading?: StageDetail;
    extracting?: StageDetail;
    validating?: StageDetail;
    queued?: StageDetail;
    processing?: StageDetail;
  };
}

export interface PipelineStats {
  total: number;
  downloading: number;
  extracting: number;
  validating: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}