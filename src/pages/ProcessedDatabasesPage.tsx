// src/pages/ProcessedDatabasesPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ProcessedDatabasesTable from '../components/processedDatabases/ProcessedDatabasesTable';
import {
  fetchProcessedDatabases,
  markDatabaseForDiscard
} from '../services/api';
import type { ProcessedDatabase } from '../types/api';
import { useInterval } from '../hooks/useInterval';
// --- IMPORTAÇÃO CORRIGIDA ---
import { useLastUpdated } from '../contexts/LastUpdatedContext'; // Garanta que o caminho para seu contexto está correto
// --- FIM DA IMPORTAÇÃO CORRIGIDA ---
import { FiDatabase, FiRefreshCw, FiSearch, FiLoader } from 'react-icons/fi';

import DiscardConfirmationModal from '../components/shared/DiscardConfirmationModal';
import NotificationBanner from '../components/shared/NotificationBanner';

const REFRESH_PROCESSED_INTERVAL = 15000;

const getStatusClassNameForPage = (status?: string): string => {
  if (!status) return 'status-badge status--desconhecido';
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('sucesso') || lowerStatus === 'ativo') return 'status-badge status--success status-ativo';
  if (lowerStatus.includes('falha') || lowerStatus.includes('problema')) return 'status-badge status--error';
  if (lowerStatus.includes('processamento') || lowerStatus.includes('download concluído')) return 'status-badge status--info';
  if (lowerStatus.includes('aguardando') || lowerStatus.includes('upload concluído')) return 'status-badge status--warning';
  if (lowerStatus === 'marcadoparadescarte') return 'status-badge status--warning status-marcadoparadescarte';
  if (lowerStatus.includes('arquivado')) return 'status-badge status--archived';
  if (lowerStatus === 'ativo') return 'status-badge status-ativo';
  if (lowerStatus === 'marcadoparadescarte') return 'status-badge status-marcadoparadescarte';
  return 'status-badge status--desconhecido';
};

const ProcessedDatabasesPage: React.FC = () => {
  // ProcessedDatabasesPage rendered

  const [databases, setDatabases] = useState<ProcessedDatabase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Esta linha causava o erro "useLastUpdated is not defined"
  const { lastUpdatedGlobal, signalUpdate, addActivity } = useLastUpdated();

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);
  const [dbToConfirmDiscard, setDbToConfirmDiscard] =
    useState<ProcessedDatabase | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const firstLoadProcessedRef = useRef(true);

  const loadDatabases = useCallback(
    async (isPollOperation = false, isTriggeredByManualAction = false) => {
      if (isTriggeredByManualAction && !isPollOperation) {
        setIsLoading(true);
        setError(null);
      } else if (isPollOperation && !isLoading) {
        setIsPollingLoading(true);
      }
      try {
        const data = await fetchProcessedDatabases();
        const sortedData = (Array.isArray(data) ? data : []).sort(
          (a, b) =>
            new Date(b.restorationTimestamp).getTime() -
            new Date(a.restorationTimestamp).getTime()
        );
        setDatabases(sortedData);
        if (!isPollOperation || isTriggeredByManualAction) {setError(null);}
        signalUpdate();
      } catch (err) {
        console.error('Falha ao buscar bancos processados:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar bancos processados.';
        if (!isPollOperation || isTriggeredByManualAction || firstLoadProcessedRef.current) {
          setError(errorMessage);
          setDatabases([]);
        }
      } finally {
        if (isTriggeredByManualAction || (!isPollOperation && firstLoadProcessedRef.current)) {setIsLoading(false);}
        if (isPollOperation) {setIsPollingLoading(false);}
      }
    },
    [signalUpdate, isLoading]
  );

  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      loadDatabases(false, true);
      firstLoadProcessedRef.current = false;
    }
  }, [loadDatabases]);

  useInterval(() => {
    if (!isLoading && !isPollingLoading && !isDiscardModalOpen) {
      loadDatabases(true, false);
    }
  }, REFRESH_PROCESSED_INTERVAL);

  const filteredDatabases = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (lowercasedQuery === '') {return databases;}
    return databases.filter(db => 
      db.originalBackupFileName?.toLowerCase().includes(lowercasedQuery) ||
      db.restoredDbAlias?.toLowerCase().includes(lowercasedQuery) ||
      db.uploadedByTicketID?.toLowerCase().includes(lowercasedQuery) ||
      db.status?.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, databases]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {setFeedbackMessage(null);}, 7000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleOpenDiscardModal = (dbId: string) => {
    // Opening discard modal
    const dbToProcess = databases.find(d => d.id === dbId);
    
    if (dbToProcess) {
      // Database found for discard
      setDbToConfirmDiscard(dbToProcess);
    } else {
      // Database not found for discard
      setFeedbackMessage({
        type: 'error',
        text: `Erro: Não foi possível encontrar o banco de dados com ID ${dbId} para descarte.`
      });
      setDbToConfirmDiscard(null);
    }
  };

  useEffect(() => {
    if (dbToConfirmDiscard) {
      // Opening discard modal
      setIsDiscardModalOpen(true);
      setFeedbackMessage(null);
    }
  }, [dbToConfirmDiscard]);


  const handleCloseDiscardModal = () => {
    // Closing discard modal
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
    // Confirming discard
    if (!dbToConfirmDiscard) {
      // Error: no database to discard
      return;
    }

    setIsDiscarding(true);
    setFeedbackMessage(null);
    const aliasToDiscard = dbToConfirmDiscard.restoredDbAlias;

    try {
      const responseText = await markDatabaseForDiscard(
        dbToConfirmDiscard.id,
        confirmationTicketValueFromModal || ''
      );
      let messageToShow = responseText;
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.message) messageToShow = jsonResponse.message;
        else if (jsonResponse.warning) messageToShow = jsonResponse.warning;
      } catch(e) { /* Usa texto original se não for JSON */ }
      setFeedbackMessage({ type: 'success', text: messageToShow });
      if (addActivity) addActivity(messageToShow);
      await loadDatabases(false, true); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro desconhecido ao marcar '${aliasToDiscard}' para descarte.`;
      setFeedbackMessage({ type: 'error', text: `Falha: ${errorMessage}` });
    } finally {
      setIsDiscarding(false);
      setIsDiscardModalOpen(false); 
      setDbToConfirmDiscard(null);  
    }
  };
  
  const handleRefreshManual = () => {
    setFeedbackMessage(null);
    loadDatabases(false, true);
  };
  
  // Modal state before render


  return (
    <div className='admin-client-areas-page list-card'> 
      <div className="admin-areas-header">
        <h2><FiDatabase /> Bancos de Dados Processados</h2>
        <div className="admin-areas-header-actions">
          <button 
            onClick={handleRefreshManual} 
            className="button-refresh" 
            disabled={isLoading || isPollingLoading || isDiscarding}
            title="Atualizar a lista de bancos de dados"
          >
            <FiRefreshCw size={14} className={(isLoading || isPollingLoading) && !isDiscarding ? 'spin-animation' : ''} />
            {isLoading && !isPollingLoading && !isDiscarding
              ? 'Carregando...'
              : isPollingLoading && !isDiscarding
              ? 'Atualizando...'
              : isDiscarding
              ? 'Processando...'
              : 'Atualizar Lista'}
          </button>
        </div>
      </div>
      {lastUpdatedGlobal && <p className="grid-last-updated">Interface atualizada pela última vez às: {lastUpdatedGlobal.toLocaleString()}</p>}
      
      <div className="table-filter-bar">
        <div className="form-group search-form-group">
          <label htmlFor="processed-db-search"><FiSearch /> Pesquisar</label>
          <input
            type="search"
            id="processed-db-search"
            placeholder="Nome original, alias, ticket ou status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading && databases.length === 0}
          />
        </div>
      </div>
        
      {feedbackMessage && (
        <NotificationBanner
          type={feedbackMessage.type}
          message={feedbackMessage.text}
          onDismiss={() => setFeedbackMessage(null)}
        />
      )}

      {error && !isLoading && ( 
        <NotificationBanner
            type="error"
            message={`Erro ao carregar dados: ${error}`}
            onDismiss={() => setError(null)}
        />
      )}
      
      <div className="table-wrapper">
        {(isLoading && databases.length === 0 && !error) ? (
          <div className="loading-message" style={{padding: '20px', textAlign: 'center'}}>
            <FiLoader className="spin-animation" size={24} style={{marginRight: '10px'}} />
            Carregando bancos de dados processados...
          </div>
        ) : (!isLoading && !error && filteredDatabases.length === 0) ? (
          <div className="empty-list" style={{padding: '20px', textAlign: 'center'}}>
            {searchQuery 
              ? `Nenhum banco de dados encontrado para "${searchQuery}".` 
              : 'Nenhum banco de dados processado no sistema.'}
          </div>
        ) : (!error) ? (
          <ProcessedDatabasesTable
            databases={filteredDatabases}
            isLoading={false} 
            onMarkForDiscard={handleOpenDiscardModal}
            getStatusClassName={getStatusClassNameForPage}
          />
        ) : null } 
      </div>

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