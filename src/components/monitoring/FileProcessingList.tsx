// src/components/monitoring/FileProcessingList.tsx
import React, { useState } from 'react';
import { FiFileText, FiChevronDown, FiChevronRight, FiSearch } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import FileProcessingDetail from './FileProcessingDetail';
import type { FileProcessingDetail as FileProcessingDetailType } from '../../types/fileMonitoring';

import '../../styles/components/FileProcessingList.css';

interface FileProcessingListProps {
  files: FileProcessingDetailType[];
  title: string;
  emptyMessage: string;
  isLoading: boolean;
}

const FileProcessingList: React.FC<FileProcessingListProps> = ({ 
  files, 
  title, 
  emptyMessage,
  isLoading 
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  // Usar debounce para melhorar a performance da busca
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    file.originalPath.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const renderLoadingState = () => (
    <div className="loading-skeleton-container">
      <div className="loading-skeleton" />
      <div className="loading-skeleton" style={{ width: '85%' }} />
      <div className="loading-skeleton" style={{ width: '90%' }} />
    </div>
  );

  return (
    <div className="file-processing-list">
      <div className="list-header">
        <h2>{title}</h2>
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {isLoading ? (
        renderLoadingState()
      ) : files.length === 0 ? (
        <div className="empty-list">
          <p>{emptyMessage}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-list">
          <p>Nenhum resultado encontrado para "{searchQuery}"</p>
        </div>
      ) : (
        <ul className="files-list">
          {filteredFiles.map(file => (
            <li key={file.fileId} className={`file-item status-${file.status}`}>
              <button 
                className="file-summary" 
                onClick={() => toggleFile(file.fileId)}
                aria-expanded={expandedFiles[file.fileId] || false}
                aria-controls={`file-details-${file.fileId}`}
              >
                <span className="expand-icon">
                  {expandedFiles[file.fileId] ? <FiChevronDown /> : <FiChevronRight />}
                </span>
                <FiFileText className="file-icon" />
                <span className="file-name" title={file.originalPath}>{file.fileName}</span>
                <div className="file-progress-container">
                  <div 
                    className="file-progress-bar" 
                    style={{ width: `${file.overallProgress}%` }}
                    aria-valuenow={file.overallProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="file-progress-text">{file.overallProgress}%</span>
                <span className="file-status">{file.status}</span>
              </button>
              
              {expandedFiles[file.fileId] && (
                <div className="file-details" id={`file-details-${file.fileId}`}>
                  <FileProcessingDetail file={file} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileProcessingList;