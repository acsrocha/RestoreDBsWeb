import React from 'react';
import { FiBarChart, FiActivity, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

interface Stats {
  total: number;
  processing: number;
  completed: number;
  failed: number;
}

interface JobViewFiltersProps {
  selectedView: string;
  stats: Stats;
  onViewChange: (view: string) => void;
}

const JobViewFilters: React.FC<JobViewFiltersProps> = ({
  selectedView,
  stats,
  onViewChange
}) => {
  return (
    <div className="view-filters">
      <button 
        className={`filter-btn ${selectedView === 'all' ? 'active' : ''}`}
        onClick={() => onViewChange('all')}
      >
        <FiBarChart /> Todos ({stats.total})
      </button>
      <button 
        className={`filter-btn ${selectedView === 'processing' ? 'active' : ''}`}
        onClick={() => onViewChange('processing')}
      >
        <FiActivity /> Processando ({stats.processing})
      </button>
      <button 
        className={`filter-btn ${selectedView === 'completed' ? 'active' : ''}`}
        onClick={() => onViewChange('completed')}
      >
        <FiCheckCircle /> Concluídos ({stats.completed})
      </button>
      <button 
        className={`filter-btn ${selectedView === 'failed' ? 'active' : ''}`}
        onClick={() => onViewChange('failed')}
      >
        <FiAlertTriangle /> Falhas ({stats.failed})
      </button>
    </div>
  );
};

export default JobViewFilters;