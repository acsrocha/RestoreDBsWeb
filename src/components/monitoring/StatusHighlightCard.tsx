import React from 'react';
import styles from './StatusHighlightCard.module.css'; // Importa CSS Module
import { FiActivity, FiAlertTriangle, FiClock, FiCpu, FiHelpCircle} from 'react-icons/fi'; // Ícones de exemplo

interface StatusHighlightCardProps {
    title: string;
    value: string | number;
    iconType: 'processing' | 'queue' | 'errors' | 'activity' | 'custom'; // Adicionado 'custom'
    customIcon?: React.ReactNode;
    typeClass?: string; // Para o valor do 'currentProcessing'
}

const IconMap: Record<string, React.ReactNode> = {
    processing: <FiCpu size={20} />,
    queue: <FiClock size={20} />,
    errors: <FiAlertTriangle size={20} />,
    activity: <FiActivity size={20} />,
};


const StatusHighlightCard: React.FC<StatusHighlightCardProps> = ({ title, value, iconType, customIcon, typeClass }) => {
    const iconToRender = customIcon || IconMap[iconType] || <FiHelpCircle size={20} />;
    const cardTypeClass = styles[iconType] || ''; // Usa a classe CSS Module para o tipo

    return (
        <div className={`${styles.highlightCard} ${cardTypeClass}`}>
            <div className={styles.cardIcon}>
                {iconToRender}
            </div>
            <div className={styles.cardContent}>
                <span className={`${styles.cardValue} ${typeClass ? styles[typeClass] : ''}`}>{value}</span>
                <span className={styles.cardLabel}>{title}</span>
            </div>
        </div>
    );
};

export default StatusHighlightCard;