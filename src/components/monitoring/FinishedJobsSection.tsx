import React, { useState } from 'react';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import FileProcessingList from './FileProcessingList';
import '../../styles/components/FinishedJobsSection.css';

interface FinishedJobsSectionProps {
  completedJobs: any[];
  failedJobs: any[];
  searchTerm: string;
  selectedView: string;
  onJobSelect: (jobId: string) => void;
  selectedJobId: string | null;
}

const FinishedJobsSection: React.FC<FinishedJobsSectionProps> = ({
  completedJobs,
  failedJobs,
  searchTerm,
  selectedView,
  onJobSelect,
  selectedJobId
}) => {
  const [activeTab, setActiveTab] = useState<'success' | 'failed'>('success');

  const filteredCompletedJobs = completedJobs.filter(job => 
    !searchTerm || 
    job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFailedJobs = failedJobs.filter(job => 
    !searchTerm || 
    job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Se o selectedView for específico, mostrar apenas essa aba
  const showSuccessTab = selectedView === 'all' || selectedView === 'completed';
  const showFailedTab = selectedView === 'all' || selectedView === 'failed';

  // Se apenas uma aba deve ser mostrada, definir como ativa
  React.useEffect(() => {
    if (selectedView === 'completed') setActiveTab('success');
    if (selectedView === 'failed') setActiveTab('failed');
  }, [selectedView]);

  return (
    <section className="monitoring-section finished-jobs-section">
      <div className="finished-jobs-header">
        <h2>Arquivos Finalizados</h2>
        <div className="finished-jobs-tabs">
          {showSuccessTab && completedJobs.length > 0 && (
            <button 
              className={`tab-button ${activeTab === 'success' ? 'active' : ''}`}
              onClick={() => setActiveTab('success')}
            >
              <FiCheckCircle className="tab-icon success" />
              Processados com Sucesso
              <span className="count-badge success">{filteredCompletedJobs.length}</span>
            </button>
          )}
          {showFailedTab && failedJobs.length > 0 && (
            <button 
              className={`tab-button ${activeTab === 'failed' ? 'active' : ''}`}
              onClick={() => setActiveTab('failed')}
            >
              <FiAlertTriangle className="tab-icon error" />
              Com Falha no Processamento
              <span className="count-badge error">{filteredFailedJobs.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className="finished-jobs-content">
        {activeTab === 'success' && showSuccessTab && (
          <FileProcessingList 
            jobs={filteredCompletedJobs} 
            isLoading={false} 
            emptyMessage="Nenhum arquivo processado com sucesso." 
            type="success"
            onJobSelect={onJobSelect}
            selectedJobId={selectedJobId}
          />
        )}
        
        {activeTab === 'failed' && showFailedTab && (
          <FileProcessingList 
            jobs={filteredFailedJobs} 
            isLoading={false} 
            emptyMessage="Nenhum arquivo com falha no processamento." 
            type="error"
            onJobSelect={onJobSelect}
            selectedJobId={selectedJobId}
          />
        )}
      </div>
    </section>
  );
};

export default FinishedJobsSection;