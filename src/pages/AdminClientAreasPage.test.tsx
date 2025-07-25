import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminClientAreasPage from './AdminClientAreasPage';
import { deleteClientUploadArea } from '../services/api';
import { GlobalRefreshProvider } from '../contexts/GlobalRefreshContext';
import { NotificationProvider } from '../hooks/useNotification';

// Mock dos serviços de API
jest.mock('../services/api', () => ({
  fetchAdminClientUploadAreaDetails: jest.fn().mockResolvedValue([
    {
      upload_area_id: 'area-1',
      client_name: 'Cliente Teste',
      client_email: 'cliente@teste.com',
      ticket_id: '20230615123456',
      gdrive_folder_name: 'Cliente Teste - 20230615123456',
      gdrive_folder_id: 'folder-id-1',
      gdrive_folder_url: 'https://drive.google.com/folders/folder-id-1',
      area_creation_date: '2023-06-15 12:34:56',
      upload_area_status: 'Ativo',
      upload_area_notes: 'Notas de teste',
      processed_backups: [
        {
          pb_id: 'backup-1',
          pb_original_backup_filename: 'backup1.fbk',
          pb_restored_alias: 'backup1',
          pb_restoration_date: '2023-06-15 13:00:00',
          pb_status: 'Ativo'
        }
      ]
    },
    {
      upload_area_id: 'area-2',
      client_name: 'Cliente Sem Backups',
      client_email: 'sem@backups.com',
      gdrive_folder_name: 'Cliente Sem Backups',
      gdrive_folder_id: 'folder-id-2',
      area_creation_date: '2023-06-16 10:00:00',
      upload_area_status: 'Ativo',
      processed_backups: []
    }
  ]),
  deleteClientUploadArea: jest.fn().mockResolvedValue({}),
  downloadFromDrive: jest.fn().mockResolvedValue({ message: 'Download iniciado com sucesso' }),
  updateClientUploadAreaStatus: jest.fn().mockResolvedValue({ message: 'Status atualizado com sucesso' }),
  updateClientUploadAreaNotes: jest.fn().mockResolvedValue({ message: 'Notas atualizadas com sucesso' })
}));

// Mock dos contextos
jest.mock('../contexts/GlobalRefreshContext', () => ({
  ...jest.requireActual('../contexts/GlobalRefreshContext'),
  useGlobalRefresh: () => ({
    refreshTrigger: 0,
    triggerRefresh: jest.fn()
  })
}));

// Mock das notificações
jest.mock('../hooks/useNotification', () => ({
  ...jest.requireActual('../hooks/useNotification'),
  useNotification: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn()
  })
}));

// Componente wrapper para os testes
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <GlobalRefreshProvider>
          {ui}
        </GlobalRefreshProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('AdminClientAreasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza a lista de áreas de cliente', async () => {
    renderWithProviders(<AdminClientAreasPage />);
    
    // Verificar se está carregando inicialmente
    expect(screen.getByText(/Carregando áreas de cliente/i)).toBeInTheDocument();
    
    // Esperar os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
      expect(screen.getByText('Cliente Sem Backups')).toBeInTheDocument();
    });
    
    // Verificar se os detalhes das áreas são exibidos
    expect(screen.getByText('cliente@teste.com')).toBeInTheDocument();
    expect(screen.getByText('sem@backups.com')).toBeInTheDocument();
    
    // Verificar se os badges de status são exibidos
    const statusBadges = screen.getAllByText('Ativo');
    expect(statusBadges.length).toBe(2);
  });

  test('abre o modal de exclusão ao clicar no botão de excluir', async () => {
    renderWithProviders(<AdminClientAreasPage />);
    
    // Esperar os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    });
    
    // Encontrar o botão de exclusão e clicar nele
    const deleteButtons = screen.getAllByTitle('Excluir área');
    fireEvent.click(deleteButtons[0]);
    
    // Verificar se o modal de exclusão foi aberto
    expect(screen.getByText(/Excluir Área de Cliente Teste/i)).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja excluir a área de upload de Cliente Teste/i)).toBeInTheDocument();
    
    // Verificar se a opção de exclusão em cascata está presente para a área com backups
    expect(screen.getByText(/Excluir também os 1 bancos de dados associados/i)).toBeInTheDocument();
  });

  test('executa a exclusão ao confirmar no modal', async () => {
    renderWithProviders(<AdminClientAreasPage />);
    
    // Esperar os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    });
    
    // Encontrar o botão de exclusão e clicar nele
    const deleteButtons = screen.getAllByTitle('Excluir área');
    fireEvent.click(deleteButtons[0]);
    
    // Verificar se o modal de exclusão foi aberto
    expect(screen.getByText(/Excluir Área de Cliente Teste/i)).toBeInTheDocument();
    
    // Marcar a opção de exclusão em cascata
    const cascadeCheckbox = screen.getByText(/Excluir também os 1 bancos de dados associados/i);
    fireEvent.click(cascadeCheckbox);
    
    // Clicar no botão de confirmação
    const confirmButton = screen.getByText('Excluir Área');
    fireEvent.click(confirmButton);
    
    // Verificar se a função de exclusão foi chamada com o ID correto
    await waitFor(() => {
      expect(deleteClientUploadArea).toHaveBeenCalledWith('area-1');
    });
  });

  test('não exibe a opção de exclusão em cascata para áreas sem backups', async () => {
    renderWithProviders(<AdminClientAreasPage />);
    
    // Esperar os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Cliente Sem Backups')).toBeInTheDocument();
    });
    
    // Encontrar o botão de exclusão da segunda área (sem backups) e clicar nele
    const deleteButtons = screen.getAllByTitle('Excluir área');
    fireEvent.click(deleteButtons[1]);
    
    // Verificar se o modal de exclusão foi aberto
    expect(screen.getByText(/Excluir Área de Cliente Sem Backups/i)).toBeInTheDocument();
    
    // Verificar que a opção de exclusão em cascata NÃO está presente
    expect(screen.queryByText(/Excluir também os/i)).not.toBeInTheDocument();
  });

  test('inicia o download ao clicar no botão de download', async () => {
    renderWithProviders(<AdminClientAreasPage />);
    
    // Esperar os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    });
    
    // Encontrar o botão de download e clicar nele
    const downloadButtons = screen.getAllByTitle('Baixar do Drive');
    fireEvent.click(downloadButtons[0]);
    
    // Verificar se a função de download foi chamada com o ID correto
    expect(downloadFromDrive).toHaveBeenCalledWith('area-1');
  });
});