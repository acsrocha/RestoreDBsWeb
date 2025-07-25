import React from 'react';
import { FiDatabase, FiActivity, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

interface Stats {
  total: number;
  processing: number;
  completed: number;
  failed: number;
}

interface RealtimeStats {
  avgProgress: number;
  estimatedTime: number;
}

interface StatisticsDashboardProps {
  stats: Stats;
  realtimeStats: RealtimeStats;
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  stats,
  realtimeStats
}) => {
  return (
    <div className="stats-dashboard">
      <div className="stat-card total">
        <div className="stat-icon">
          <FiDatabase />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total de Arquivos</div>
        </div>
      </div>
      
      <div className="stat-card processing">
        <div className="stat-icon">
          <FiActivity />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.processing}</div>
          <div className="stat-label">Em Processamento</div>
          {realtimeStats.avgProgress > 0 && (
            <div className="stat-detail">{realtimeStats.avgProgress.toFixed(1)}% médio</div>
          )}
        </div>
      </div>
      
      <div className="stat-card completed">
        <div className="stat-icon">
          <FiCheckCircle />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Concluídos</div>
        </div>
      </div>
      
      <div className="stat-card failed">
        <div className="stat-icon">
          <FiAlertTriangle />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.failed}</div>
          <div className="stat-label">Com Falha</div>
        </div>
      </div>
      
      {realtimeStats.estimatedTime > 0 && (
        <div className="stat-card eta">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {Math.round(realtimeStats.estimatedTime / 60000)}min
            </div>
            <div className="stat-label">Tempo Estimado</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsDashboard;