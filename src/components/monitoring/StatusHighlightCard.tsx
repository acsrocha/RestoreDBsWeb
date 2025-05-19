// src/components/monitoring/StatusHighlightCard.tsx
// ou src/components/common/HighlightCard.tsx (dependendo de onde você o colocou e importou)

import React from 'react';
// Não são necessários imports específicos de FiCpu, FiArchive, etc., aqui
// porque o ícone é passado como uma prop React.ReactNode.
// Importe apenas FiHelpCircle se você explicitamente quiser usá-lo como fallback.
// import { FiHelpCircle } from 'react-icons/fi'; // Opcional para fallback

interface StatusHighlightCardProps {
    icon: React.ReactNode;    // O componente pai (MonitoringPage) passará o ícone JSX
    label: string;            // Renomeado de 'title' para 'label' para clareza semântica
    value: string | number;
    type: string;             // Para classe CSS opcional (ex: 'processing', 'queue')
    title?: string;           // Para o atributo title HTML (tooltip) do card inteiro
}

const StatusHighlightCard: React.FC<StatusHighlightCardProps> = ({ icon, label, value, type, title }) => {
    // Exemplo de classes CSS. Adapte ao seu style.css ou sistema de estilização.
    // Se usar CSS Modules: const cardClasses = `${styles.highlightCard} ${styles[type] || ''}`;
    const cardClasses = `highlight-card ${type || ''}`;

    return (
        <div className={cardClasses} title={title}> {/* O 'title' aqui é o tooltip do card */}
            <div className="card-icon">
                {icon} {/* Renderiza o ícone que foi passado */}
            </div>
            <div className="card-content">
                <span className="card-value">{value}</span>
                <span className="card-label">{label}</span> {/* 'label' é o texto descritivo */}
            </div>
        </div>
    );
};

export default StatusHighlightCard;