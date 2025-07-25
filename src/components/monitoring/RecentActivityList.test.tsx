import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentActivityList from './RecentActivityList';
import { ActivityLogEntry } from '../../types/api';

// Mock para os hooks de acessibilidade
jest.mock('../../hooks/useA11y', () => ({
  ARIA_ROLES: {
    REGION: 'region',
    LIST: 'list',
    LISTITEM: 'listitem'
  },
  ARIA_LABELS: {
    LOADING: 'Carregando...'
  }
}));

describe('RecentActivityList Component', () => {
  // Dados de teste
  const mockActivities: ActivityLogEntry[] = [
    { timestamp: '10:15:30', message: 'Backup restaurado com sucesso', level: 'success' },
    { timestamp: '10:10:25', message: 'Erro ao processar arquivo', level: 'error' },
    { timestamp: '10:05:20', message: 'Iniciando processamento', level: 'info' },
    { timestamp: '10:00:15', message: 'Aviso: arquivo grande detectado', level: 'warning' }
  ];

  test('renderiza corretamente com atividades', () => {
    render(<RecentActivityList activities={mockActivities} isLoading={false} />);
    
    // Verificar se o título está presente
    expect(screen.getByText('Atividade Recente')).toBeInTheDocument();
    
    // Verificar se todas as atividades estão sendo exibidas
    expect(screen.getByText('Backup restaurado com sucesso')).toBeInTheDocument();
    expect(screen.getByText('Erro ao processar arquivo')).toBeInTheDocument();
    expect(screen.getByText('Iniciando processamento')).toBeInTheDocument();
    expect(screen.getByText('Aviso: arquivo grande detectado')).toBeInTheDocument();
  });

  test('exibe mensagem quando não há atividades', () => {
    render(<RecentActivityList activities={[]} isLoading={false} />);
    expect(screen.getByText('Nenhuma atividade encontrada')).toBeInTheDocument();
  });

  test('exibe indicador de carregamento quando isLoading=true', () => {
    render(<RecentActivityList activities={[]} isLoading={true} />);
    // Verificar se existem elementos com a classe loading-skeleton
    const skeletons = document.querySelectorAll('.loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('filtra atividades por tipo corretamente', () => {
    render(<RecentActivityList activities={mockActivities} isLoading={false} />);
    
    // Clicar no botão de filtro de erro
    fireEvent.click(screen.getByText('Erro'));
    
    // Verificar se apenas a atividade de erro está visível
    expect(screen.getByText('Erro ao processar arquivo')).toBeInTheDocument();
    expect(screen.queryByText('Backup restaurado com sucesso')).not.toBeInTheDocument();
    expect(screen.queryByText('Iniciando processamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Aviso: arquivo grande detectado')).not.toBeInTheDocument();
    
    // Clicar no botão de filtro de sucesso também
    fireEvent.click(screen.getByText('Sucesso'));
    
    // Verificar se agora as atividades de erro e sucesso estão visíveis
    expect(screen.getByText('Erro ao processar arquivo')).toBeInTheDocument();
    expect(screen.getByText('Backup restaurado com sucesso')).toBeInTheDocument();
    expect(screen.queryByText('Iniciando processamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Aviso: arquivo grande detectado')).not.toBeInTheDocument();
  });

  test('filtra atividades por texto corretamente', () => {
    render(<RecentActivityList activities={mockActivities} isLoading={false} />);
    
    // Encontrar o input de pesquisa e digitar "backup"
    const searchInput = screen.getByPlaceholderText('Pesquisar nas atividades...');
    fireEvent.change(searchInput, { target: { value: 'backup' } });
    
    // Verificar se apenas a atividade com "backup" está visível
    expect(screen.getByText('Backup restaurado com sucesso')).toBeInTheDocument();
    expect(screen.queryByText('Erro ao processar arquivo')).not.toBeInTheDocument();
    expect(screen.queryByText('Iniciando processamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Aviso: arquivo grande detectado')).not.toBeInTheDocument();
  });

  test('aplica a classe CSS correta com base no nível da atividade', () => {
    render(<RecentActivityList activities={mockActivities} isLoading={false} />);
    
    // Verificar se as classes CSS estão sendo aplicadas corretamente
    const successItem = screen.getByText('Backup restaurado com sucesso').closest('li');
    const errorItem = screen.getByText('Erro ao processar arquivo').closest('li');
    const infoItem = screen.getByText('Iniciando processamento').closest('li');
    const warningItem = screen.getByText('Aviso: arquivo grande detectado').closest('li');
    
    expect(successItem).toHaveClass('activity-item success');
    expect(errorItem).toHaveClass('activity-item error');
    expect(infoItem).toHaveClass('activity-item info');
    expect(warningItem).toHaveClass('activity-item warning');
  });
});