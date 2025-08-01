import React from 'react';
import { FiClock, FiFileText } from 'react-icons/fi';
import JobDetails from './JobDetails';
import '../../styles/components/FileProcessingList.css';

interface FileProcessingJob {
  fileId: string;
  fileName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  overallProgress: number;
  currentStage: string;
  downloadStageStatus: string;
  downloadStageDetails?: string;
  validationStageStatus: string;
  validationStageDetails?: string;
  restoreStageStatus: string;
  restoreStageDetails?: string;
  finalizationStageStatus: string;
  finalizationStageDetails?: string;
}

interface FileProcessingListProps {
  jobs: FileProcessingJob[];
  isLoading: boolean;
  emptyMessage: string;
  type: 'success' | 'error';
  onJobSelect?: (jobId: string) => void;
  selectedJobId?: string | null;
  selectedJob?: any;
}

const FileProcessingList: React.FC<FileProcessingListProps> = ({
  jobs,
  isLoading,
  emptyMessage,
  type,
  onJobSelect,
  selectedJobId,
  selectedJob
}) => {


  // Formatar duração do processamento
  const formatDuration = (startTime: string, endTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;
    
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="file-processing-list">
      {jobs.map(job => (
        <div 
          key={job.id || job.fileId} 
          className={`file-item ${type} ${selectedJobId === (job.id || job.fileId) ? 'selected' : ''}`}
        >
          <div 
            className="file-header" 
            onClick={() => {
              if (onJobSelect) {
                const jobId = job.id || job.fileId;
                // Se já está selecionado, deseleciona (recolhe)
                if (selectedJobId === jobId) {
                  onJobSelect('');
                } else {
                  onJobSelect(jobId);
                }
              }
            }}
          >
            <div className="file-info">
              <FiFileText className="file-icon" />
              <span className="file-name" title={job.fileName}>
                {job.fileName}
              </span>
            </div>
            
            <div className="file-meta">
              <div className="file-time">
                <FiClock className="time-icon" />
                <span title={`Duração: ${formatDuration(job.startedAt, job.completedAt)}`}>
                  {formatDuration(job.startedAt, job.completedAt)}
                </span>
              </div>
              

            </div>
          </div>
          

          
          {/* JobDetails aparece diretamente abaixo do item selecionado */}
          {selectedJobId === (job.id || job.fileId) && (
            <JobDetails 
              job={{
                fileId: job.fileId || job.id,
                fileName: job.fileName,
                status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'processing',
                startedAt: job.createdAt || job.startedAt,
                completedAt: job.status === 'completed' ? job.updatedAt || job.finishedAt : undefined,
                errorMessage: job.errorMessage || job.error,
                downloadStage: { status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'pending' },
                validationStage: { status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'pending' },
                restoreStage: { status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'pending' },
                finalizationStage: { status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'pending' }
              }}
              onClose={() => onJobSelect && onJobSelect(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FileProcessingList;