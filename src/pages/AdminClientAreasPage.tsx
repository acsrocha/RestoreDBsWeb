// Exemplo: src/pages/AdminClientAreasPage.tsx
import React, { useEffect, useState } from 'react';
import { fetchAdminClientUploadAreaDetails } from '../services/api'; // Ajuste o caminho se necessário
import type { AdminClientUploadAreaDetail } from '../types/api'; // Ajuste o caminho se necessário
// import { FiExternalLink, FiEdit, FiTrash2, FiInfo } from 'react-icons/fi'; // Ícones para futuras ações
// import './AdminClientAreasPage.css'; // Você pode criar um CSS específico se precisar

const AdminClientAreasPage: React.FC = () => {
  const [areas, setAreas] = useState<AdminClientUploadAreaDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAdminClientUploadAreaDetails();
        setAreas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        console.error("Erro ao buscar dados das áreas de cliente:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div className="loading-message">Carregando dados das áreas de cliente...</div>;
  }

  if (error) {
    return <div className="error-message">Erro ao carregar dados: {error}</div>;
  }

  if (areas.length === 0) {
    return <div className="info-message">Nenhuma área de upload de cliente encontrada.</div>;
  }

  return (
    <div className="admin-client-areas-page list-card"> {/* Usando a classe list-card para um estilo base */}
      <h2>Gerenciamento de Áreas de Upload de Cliente</h2>
      <div className="table-wrapper"> {/* Para permitir rolagem horizontal em tabelas grandes */}
        <table className="data-table"> {/* Usando a classe data-table do seu global.css */}
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Ticket ID</th>
              <th>Pasta no Drive</th>
              <th>URL da Pasta</th>
              <th>Criação da Área</th>
              <th>Status da Área</th>
              <th>Backups Processados</th>
              {/* Adicionar mais colunas para ações no futuro */}
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.upload_area_id}>
                <td>{area.client_name}</td>
                <td>{area.client_email}</td>
                <td>{area.ticket_id || 'N/A'}</td>
                <td>{area.gdrive_folder_name}</td>
                <td>
                  {area.gdrive_folder_url ? (
                    <a href={area.gdrive_folder_url} target="_blank" rel="noopener noreferrer">
                      Abrir Pasta {/* Poderia adicionar um ícone aqui */}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{area.area_creation_date}</td>
                <td>{area.upload_area_status}</td>
                <td>
                  {area.processed_backups.length > 0 ? (
                    <ul>
                      {area.processed_backups.map((backup) => (
                        <li key={backup.pb_id}>
                          {backup.pb_original_backup_filename} ({backup.pb_restored_alias}) - {backup.pb_restoration_date}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Nenhum backup processado'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminClientAreasPage;