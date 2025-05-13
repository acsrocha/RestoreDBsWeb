// src/components/common/HighlightCard.tsx
import React from 'react';

interface HighlightCardProps {
  icon: React.ReactNode; // Alterado para React.ReactNode
  label: string;
  value: string | number;
  type: 'processing' | 'queue' | 'errors' | 'activity-summary';
  title?: string;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ icon, label, value, type, title }) => {
  return (
    <div className={`highlight-card ${type}`} title={title}>
      {/* O ícone agora é renderizado diretamente */}
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <span className="card-value">{value}</span>
        <span className="card-label">{label}</span>
      </div>
    </div>
  );
};

export default HighlightCard;