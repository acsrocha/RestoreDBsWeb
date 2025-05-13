import React from 'react';
import { FiFileText } from 'react-icons/fi'; // Ícone de exemplo
import styles from './QueuedFilesList.module.css';
import { escapeHTML } from '../../utils/helpers'; // Você precisará criar este helper

interface QueuedFilesListProps {
    files: string[];
}

const QueuedFilesList: React.FC<QueuedFilesListProps> = ({ files }) => {
    if (!files || files.length === 0) {
        return <p className="empty-list-message"><em>Fila vazia</em></p>;
    }

    return (
        <ul className={styles.list} aria-live="polite">
            {files.map((file, index) => {
                const fileName = escapeHTML(file.split(/[\\/]/).pop() || file);
                return (
                    <li key={index} className={styles.listItem} title={`Caminho completo: ${escapeHTML(file)}`}>
                        <FiFileText className={styles.fileIcon} size={16} />
                        {fileName}
                    </li>
                );
            })}
        </ul>
    );
};

export default QueuedFilesList;