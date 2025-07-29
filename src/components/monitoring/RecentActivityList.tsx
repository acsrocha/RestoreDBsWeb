// src/components/monitoring/RecentActivityList.tsx
import React, { memo, useMemo, useState, useCallback } from 'react';
// import { escapeHTML } from '../../utils/helpers'; // React já escapa strings em {}
import { FiActivity, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ARIA_ROLES, ARIA_LABELS } from '../../hooks/useA11y';
import ActivityFilters from './ActivityFilters';
import type { ActivityLogEntry } from '../../types/api';

import '../../styles/components/RecentActivityList.css';
import '../../styles/components/ActivityFilters.css';

interface RecentActivityListProps {
  activities: ActivityLogEntry[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

const getActivityClass = (activity: ActivityLogEntry): string => {
  return `activity-item ${activity.level}`;
};

// Função formatMessage removida pois não é mais necessária

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const listId = 'recent-activity-list';
  const headerId = 'recent-activity-header';

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (!activity) return false;
      const lowerMessage = activity.message.toLowerCase();
      const matchesSearch = searchQuery === '' || lowerMessage.includes(searchQuery.toLowerCase());
      
      // Lógica de filtro agora é simples e robusta!
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(activity.level);

      const activityTime = activity.timestamp;
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

  const renderActivity = useCallback((activity: ActivityLogEntry, index: number) => {
    return (
      <li 
        key={`${activity.timestamp}-${index}`} 
        className={getActivityClass(activity)}
        role={ARIA_ROLES.LISTITEM}
      >
        <span 
          className="activity-time"
          aria-label="Horário da atividade"
          title="Horário da atividade"
        >
          <FiClock style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {activity.timestamp}
        </span>
        <span 
          className="activity-message"
          title={activity.message}
        >
          {activity.message}
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
    <>
      <h2 id={headerId}>
        <FiActivity className="section-icon" />
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
    </>
  );
};

// Memoize o componente para evitar re-renderizações desnecessárias
export default memo(RecentActivityList);