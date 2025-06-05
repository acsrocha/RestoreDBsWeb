// src/components/common/HighlightCard.tsx
import React, { memo } from 'react';
import type { IconType } from 'react-icons';
import { ARIA_ROLES } from '../../hooks/useA11y';

interface HighlightCardProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  type: 'processing' | 'queue' | 'errors' | 'activity-summary';
  title?: string;
  isLoading?: boolean;
}

const HighlightCard: React.FC<HighlightCardProps> = ({
  icon,
  label,
  value,
  type,
  title,
  isLoading = false
}) => {
  const tooltipText = title || label;
  const cardId = `highlight-card-${type}`;
  const titleId = `${cardId}-title`;

  return (
    <div
      id={cardId}
      className={`highlight-card ${type} ${isLoading ? 'loading' : ''}`}
      role={ARIA_ROLES.REGION}
      aria-labelledby={titleId}
    >
      <div className="card-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="card-content">
        <h3 id={titleId} className="card-title">
          {label}
        </h3>
        <div 
          className="card-value"
          title={value}
        >
          {isLoading ? <div className="loading-skeleton" /> : value}
        </div>
      </div>
      {tooltipText && <div className="tooltip">{tooltipText}</div>}
    </div>
  );
};

export default memo(HighlightCard);