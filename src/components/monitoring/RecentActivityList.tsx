// src/components/monitoring/RecentActivityList.tsx
import React from 'react';
import { escapeHTML } from '../../utils/helpers';
import { FiList } from 'react-icons/fi'; // <<< Adicionar importação do ícone

interface RecentActivityListProps {
  activities: string[];
  isLoading: boolean;
}

const getActivityClass = (activity: string): string => {
  const lowerActivity = activity.toLowerCase();
  if (lowerActivity.includes('sucesso')) return 'log-success';
  if (lowerActivity.includes('erro') || lowerActivity.includes('falha')) return 'log-error';
  if (lowerActivity.includes('iniciando') || lowerActivity.includes('upload') || lowerActivity.includes('adicionando') || lowerActivity.includes('detectado') || lowerActivity.includes('aviso')) return 'log-info';
  return 'log-default';
};

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="list-card" id="recentActivitySection">
        <h2><span className="icon"><FiList /></span>Atividade Recente</h2> {/* Ícone adicionado */}
        <ul id="recentActivity" aria-live="polite">
          <li className="empty-list"><em>Carregando atividades...</em></li>
        </ul>
      </div>
    );
  }

  return (
    <div className="list-card" id="recentActivitySection">
      <h2><span className="icon"><FiList /></span>Atividade Recente</h2> {/* Ícone adicionado */}
      <ul id="recentActivity" aria-live="polite">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const activityClass = getActivityClass(activity);
            return (
              <li key={index} className={activityClass}>
                {escapeHTML(activity)}
              </li>
            );
          })
        ) : (
          <li className="empty-list"><em>Nenhuma atividade recente</em></li>
        )}
      </ul>
    </div>
  );
};

export default RecentActivityList;