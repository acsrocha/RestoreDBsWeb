// src/components/monitoring/RecentActivityList.tsx
import React, { memo, useMemo, useState, useCallback } from 'react';
// import { escapeHTML } from '../../utils/helpers'; // React já escapa strings em {}
import { FiActivity, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ARIA_ROLES, ARIA_LABELS } from '../../hooks/useA11y';
import ActivityFilters from './ActivityFilters';

import '../../styles/components/RecentActivityList.css';
import '../../styles/components/ActivityFilters.css';

interface RecentActivityListProps {
  activities: string[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

const getActivityClass = (activity: string): string => {
  if (typeof activity !== 'string') return 'activity-item';
  const lowerActivity = activity.toLowerCase();
  
  if (lowerActivity.includes('sucesso') || lowerActivity.includes('concluído')) 
    return 'activity-item success';
  
  if (lowerActivity.includes('erro') || lowerActivity.includes('falha')) 
    return 'activity-item error';
  
  if (lowerActivity.includes('iniciando') || 
      lowerActivity.includes('upload') ||
      lowerActivity.includes('adicionando') ||
      lowerActivity.includes('detectado') ||
      lowerActivity.includes('processamento')) 
    return 'activity-item info';
  
  if (lowerActivity.includes('aviso') || 
      lowerActivity.includes('aguardando')) 
    return 'activity-item warning';
  
  return 'activity-item';
};

const formatMessage = (message: string): string => {
  // Remove caracteres especiais e formata melhor a mensagem
  return message
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const listId = 'recent-activity-list';
  const headerId = 'recent-activity-header';

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const lowerActivity = activity.toLowerCase();
      const matchesSearch = searchQuery === '' || lowerActivity.includes(searchQuery.toLowerCase());
      
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => {
        switch (type) {
          case 'success':
            return lowerActivity.includes('sucesso') || lowerActivity.includes('concluído');
          case 'error':
            return lowerActivity.includes('erro') || lowerActivity.includes('falha');
          case 'info':
            return lowerActivity.includes('iniciando') || 
                   lowerActivity.includes('upload') ||
                   lowerActivity.includes('processamento');
          case 'warning':
            return lowerActivity.includes('aviso') || 
                   lowerActivity.includes('aguardando');
          default:
            return false;
        }
      });

      const timeMatch = activity.match(/^(\d{2}:\d{2}:\d{2})/);
      const activityTime = timeMatch ? timeMatch[1] : '';
      const matchesDate = (!dateRange.start && !dateRange.end) ||
        ((!dateRange.start || activityTime >= dateRange.start) &&
         (!dateRange.end || activityTime <= dateRange.end));

      return matchesSearch && matchesType && matchesDate;
    });
  }, [activities, searchQuery, selectedTypes, dateRange]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderLoadingState = () => (
    <>
      <div className="loading-skeleton" />
      <div className="loading-skeleton" style={{ width: '85%' }} />
      <div className="loading-skeleton" style={{ width: '90%' }} />
    </>
  );

  const renderActivity = useCallback((activity: string, index: number) => {
    const timeMatch = activity.match(/^(\d{2}:\d{2}:\d{2})/);
    const time = timeMatch ? timeMatch[1] : '';
    const message = timeMatch ? formatMessage(activity.slice(timeMatch[0].length)) : formatMessage(activity);

    return (
      <li 
        key={`${time}-${index}`} 
        className={getActivityClass(activity)}
        role={ARIA_ROLES.LISTITEM}
      >
        <span 
          className="activity-time"
          aria-label="Horário da atividade"
          title="Horário da atividade"
        >
          <FiClock style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {time}
        </span>
        <span 
          className="activity-message"
          title={message}
        >
          {message}
        </span>
      </li>
    );
  }, []);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <FiChevronLeft />
        </button>
        
        <div className="pagination-info">
          Página {currentPage} de {totalPages}
        </div>

        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <FiChevronRight />
        </button>
      </div>
    );
  };

  return (
    <div 
      className="list-card" 
      role={ARIA_ROLES.REGION}
      aria-labelledby={headerId}
    >
      <h2 id={headerId}>
        <span className="icon" aria-hidden="true">
          <FiActivity />
        </span>
        Atividade Recente
      </h2>

      <ActivityFilters
        onSearchChange={setSearchQuery}
        onTypeChange={(type) => {
          setSelectedTypes(prev => {
            const index = prev.indexOf(type);
            if (index === -1) {
              return [...prev, type];
            }
            return prev.filter(t => t !== type);
          });
        }}
        onDateChange={(start, end) => setDateRange({ start, end })}
        selectedTypes={selectedTypes}
      />

      <ul 
        id={listId}
        role={ARIA_ROLES.LIST}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <li 
            className="empty-list"
            role={ARIA_ROLES.LISTITEM}
            aria-label={ARIA_LABELS.LOADING}
          >
            {renderLoadingState()}
          </li>
        ) : paginatedActivities.length > 0 ? (
          paginatedActivities.map(renderActivity)
        ) : (
          <li 
            className="empty-list"
            role={ARIA_ROLES.LISTITEM}
            aria-label="Nenhuma atividade disponível"
          >
            <em>Nenhuma atividade encontrada</em>
          </li>
        )}
      </ul>

      {renderPagination()}
    </div>
  );
};

// Memoize o componente para evitar re-renderizações desnecessárias
export default memo(RecentActivityList);