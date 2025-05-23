// src/pages/ProcessedDatabasesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProcessedDatabasesTable from '../components/processedDatabases/ProcessedDatabasesTable';
import {
  fetchProcessedDatabases,
  markDatabaseForDiscard
} from '../services/api';
import type { ProcessedDatabase } from '../types/api';
import { useInterval } from '../hooks/useInterval';
import { useLastUpdated } from '../contexts/LastUpdatedContext';
import { FiDatabase, FiRefreshCw } from 'react-icons/fi';

import DiscardConfirmationModal from '../components/shared/DiscardConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';

const REFRESH_PROCESSED_INTERVAL = 15000;

const ProcessedDatabasesPage: React.FC = () => {
  const [databases, setDatabases] = useState<ProcessedDatabase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carregamento principal da página
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false); // Estado para loading sutil de polling
  const [error, setError] = useState<string | null>(null);

  const { signalUpdate, addActivity } = useLastUpdated();

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);
  const [dbToConfirmDiscard, setDbToConfirmDiscard] =
    useState<ProcessedDatabase | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);

  const firstLoadProcessedRef = useRef(true); // Para controlar a primeira carga

  const loadDatabases = useCallback(
    async (isPollOperation = false, isTriggeredByManualAction = false) => {
      // Define o estado de carregamento apropriado
      if (isTriggeredByManualAction && !isPollOperation) {
        setIsLoading(true); // Loading principal para ação manual ou carga inicial
        setError(null);     // Limpa erros anteriores em uma nova tentativa manual
      } else if (isPollOperation && !isLoading /* Evita overlap com loading principal */) {
        setIsPollingLoading(true);
      }

      try {
        const data = await fetchProcessedDatabases();
        setDatabases(Array.isArray(data) ? data : []); // Garante que 'data' seja sempre um array
        if (!isPollOperation || isTriggeredByManualAction) {
          setError(null); // Limpa erro se a carga (manual/inicial) for bem-sucedida
        }
        signalUpdate();
      } catch (err) {
        console.error('Falha ao buscar bancos processados:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar bancos processados.';
        
        // Define erro e limpa dados apenas em carregamentos principais/manuais ou na primeira carga
        if (!isPollOperation || isTriggeredByManualAction || firstLoadProcessedRef.current) {
          setError(errorMessage);
          setDatabases([]); // Garante que a tabela mostre "nenhum dado" em caso de erro crítico na carga
        }
      } finally {
        // Garante que os estados de loading sejam desativados corretamente
        if (isTriggeredByManualAction || (!isPollOperation && firstLoadProcessedRef.current)) {
          setIsLoading(false);
        }
        if (isPollOperation) {
          setIsPollingLoading(false);
        }
      }
    },
    // Removido isLoading da lista de dependências para evitar recriações excessivas de loadDatabases.
    // A lógica de setIsPollingLoading agora verifica !isLoading diretamente.
    [signalUpdate] 
  );

  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      loadDatabases(false, true); // Considera a primeira carga como uma ação "manual" para setar isLoading
      firstLoadProcessedRef.current = false;
    }
  }, [loadDatabases]);

  useInterval(() => {
    // Não faz polling se um loading principal estiver ativo, se o modal estiver aberto ou se já houver um polling em andamento.
    if (!isLoading && !isPollingLoading && !isDiscardModalOpen) {
      loadDatabases(true, false);
    }
  }, REFRESH_PROCESSED_INTERVAL);

  const handleOpenDiscardModal = (dbId: string) => {
    const dbToProcess = databases.find(d => d.id === dbId);
    if (dbToProcess) {
      setDbToConfirmDiscard(dbToProcess);
      setIsDiscardModalOpen(true);
      setFeedbackMessage(null);
    } else {
      console.error(
        `[handleOpenDiscardModal] Banco com ID ${dbId} NÃO encontrado.`
      );
      setFeedbackMessage({
        type: 'error',
        text: `Erro: Não foi possível encontrar o banco de dados com ID ${dbId} para descarte.`
      });
    }
  };

  const handleCloseDiscardModal = () => {
    if (addActivity && dbToConfirmDiscard && !isDiscarding) {
      addActivity(
        `Descarte para '${dbToConfirmDiscard.restoredDbAlias}' cancelado pelo usuário no modal.`
      );
    }
    setIsDiscardModalOpen(false);
    setDbToConfirmDiscard(null);
  };

  const handleConfirmDiscard = async (
    confirmationTicketValueFromModal?: string
  ) => {
    if (!dbToConfirmDiscard) return;

    setIsDiscarding(true);
    setFeedbackMessage(null);
    const aliasToDiscard = dbToConfirmDiscard.restoredDbAlias;

    try {
      const message = await markDatabaseForDiscard(
        dbToConfirmDiscard.id,
        confirmationTicketValueFromModal || ''
      );
      setFeedbackMessage({ type: 'success', text: message });
      if (addActivity) addActivity(message);
      // Força recarregamento completo da lista após descarte bem-sucedido
      // A flag isTriggeredByManualAction (segundo parâmetro true) fará com que setIsLoading(true) seja chamado.
      await loadDatabases(false, true); 
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Erro desconhecido ao marcar '${aliasToDiscard}' para descarte.`;
      console.error(`Falha ao marcar para descarte '${aliasToDiscard}':`, err);
      setFeedbackMessage({
        type: 'error',
        text: `Falha ao marcar '${aliasToDiscard}' para descarte: ${errorMessage}`
      });
    } finally {
      setIsDiscarding(false);
      setIsDiscardModalOpen(false); // Garante que o modal feche em qualquer caso
      setDbToConfirmDiscard(null);
    }
  };
  
  const handleRefreshManual = () => {
    setFeedbackMessage(null);
    loadDatabases(false, true);
  };

  return (
    <div id='view-bancos-restaurados' className='view active'>
      <section
        className='list-card processed-databases-card'
        id='processedDatabasesSection'
        aria-labelledby='processedDatabasesHeader'
      >
        {/* --- TÍTULO AJUSTADO COM ÍCONE DIRETO --- */}
        <h2 id='processedDatabasesHeader'>
          <FiDatabase /> 
          Bancos de Dados Processados
        </h2>
        <div className='table-actions'>
          <button
            id='refreshProcessedDBsBtn'
            className='button-refresh'
            title='Atualizar lista de bancos processados'
            onClick={handleRefreshManual}
            disabled={isLoading || isPollingLoading || isDiscarding}
          >
            <FiRefreshCw />
            {isLoading && !isPollingLoading && !isDiscarding // Mostra "Carregando..." se for o loading principal da página
              ? 'Carregando...'
              : isPollingLoading && !isDiscarding // Mostra "Atualizando..." para o polling sutil
              ? 'Atualizando...'
              : isDiscarding // Mostra "Processando..." durante a ação de descarte
              ? 'Processando...'
              : 'Atualizar Lista'}
          </button>
        </div>

        {feedbackMessage && (
          <NotificationBanner
            type={feedbackMessage.type}
            message={feedbackMessage.text}
            onDismiss={() => setFeedbackMessage(null)}
          />
        )}

        {/* Mostra erro principal de carregamento da lista se houver e não estiver em loading principal */}
        {error && !isLoading && ( 
          <div className='error-message' style={{ marginBottom: '15px' }}>
            {`Erro ao carregar dados: ${error}`}
          </div>
        )}
        
        <ProcessedDatabasesTable
          databases={databases}
          // Prop 'isLoading' para a tabela: true se for o loading principal E a lista estiver vazia.
          // A tabela internamente mostrará "Nenhum banco" se databases.length === 0 e esta prop for false.
          isLoading={isLoading && databases.length === 0 && !isDiscarding} 
          onMarkForDiscard={handleOpenDiscardModal}
        />
      </section>

      <DiscardConfirmationModal
        isOpen={isDiscardModalOpen}
        dbToDiscard={dbToConfirmDiscard}
        onClose={handleCloseDiscardModal}
        onConfirm={handleConfirmDiscard}
        isDiscarding={isDiscarding}
      />
    </div>
  );
};

export default ProcessedDatabasesPage;