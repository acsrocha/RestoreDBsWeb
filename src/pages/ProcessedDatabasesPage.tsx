// src/pages/ProcessedDatabasesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProcessedDatabasesTable from '../components/processedDatabases/ProcessedDatabasesTable';
import { fetchProcessedDatabases, markDatabaseForDiscard } from '../services/api';
import type { ProcessedDatabase } from '../types/api';
import { useInterval } from '../hooks/useInterval';
import { useLastUpdated } from '../contexts/LastUpdatedContext';
import { FiDatabase, FiRefreshCw } from 'react-icons/fi';

const REFRESH_PROCESSED_INTERVAL = 15000;

const ProcessedDatabasesPage: React.FC = () => {
  const [databases, setDatabases] = useState<ProcessedDatabase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado para carga inicial E refresh manual/operações
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { signalUpdate } = useLastUpdated();

  const loadDatabases = useCallback(async (isPollOperation = false, isTriggeredByManualAction = false) => {
    // isLoading é setado para true ANTES desta função ser chamada para carga inicial ou manual.
    // isPollingLoading é setado para true se for uma operação de polling.
    if (isPollOperation) {
      setIsPollingLoading(true);
    }

    try {
      const data = await fetchProcessedDatabases();
      setDatabases(data);
      setError(null);
      signalUpdate();
    } catch (err) {
      console.error('Falha ao buscar bancos processados:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar bancos processados.';
      setError(errorMessage);
      // Limpa databases se for erro na carga inicial ou refresh manual (quando isLoading era true), não no polling.
      if (!isPollOperation && (isLoading || isTriggeredByManualAction)) {
        setDatabases([]);
      }
    } finally {
      // Desativa o loading principal se foi uma carga inicial ou uma ação manual que o ativou.
      if ((isLoading && !isPollOperation) || isTriggeredByManualAction) {
        setIsLoading(false);
      }
      if (isPollOperation) {
        setIsPollingLoading(false);
      }
    }
  }, [signalUpdate, isLoading]); // Manter isLoading aqui é importante para que o `finally`
                                 // tenha o valor correto de isLoading que foi setado *antes* da chamada.

  const firstLoadProcessedRef = useRef(true);
  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      // setIsLoading(true); // Já é o estado inicial padrão do useState
      loadDatabases(); // Chama sem flags (isPollOperation=false, isTriggeredByManualAction=false)
      firstLoadProcessedRef.current = false;
    }
  }, [loadDatabases]); // loadDatabases depende de isLoading, mas o ref previne loop de montagem.

  useInterval(() => {
    if (!isLoading && !isPollingLoading) {
        loadDatabases(true, false); // isPollOperation=true, isTriggeredByManualAction=false
    }
  }, REFRESH_PROCESSED_INTERVAL);

  const handleMarkForDiscard = async (dbId: string) => {
    if (!window.confirm(`Tem certeza que deseja marcar o banco de dados com ID '${dbId}' para descarte? Esta ação é irreversível.`)) {
      return;
    }
    setIsLoading(true); // Ativa o loading principal para esta operação
    setError(null);
    try {
      const message = await markDatabaseForDiscard(dbId);
      alert(message || `Banco ${dbId} processado para descarte.`);
      // Chama loadDatabases como uma ação manual para recarregar e resetar isLoading
      await loadDatabases(false, true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro crítico ao marcar para descarte.';
      alert(errorMessage);
      console.error('Falha crítica ao marcar para descarte:', err);
      setError(errorMessage);
      setIsLoading(false); // Garante que o loading desative se o descarte falhar antes de loadDatabases
    }
    // Se o descarte for bem-sucedido, o setIsLoading(false) principal é feito no finally de loadDatabases
  };

  const handleRefreshManual = () => {
    setIsLoading(true); // Ativa o loading principal
    setError(null);     // Limpa erros anteriores
    loadDatabases(false, true); // Chama loadDatabases indicando que é refresh manual
  };

  return (
    <div id="view-bancos-restaurados" className="view active">
      <section className="list-card processed-databases-card" id="processedDatabasesSection" aria-labelledby="processedDatabasesHeader">
        <h2 id="processedDatabasesHeader">
          <span className="icon"><FiDatabase /></span>
          Bancos de Dados Processados
        </h2>
        <div className="table-actions">
          <button
            id="refreshProcessedDBsBtn"
            className="button-refresh"
            title="Atualizar lista de bancos processados"
            onClick={handleRefreshManual}
            disabled={isLoading || isPollingLoading}
          >
            <FiRefreshCw />
            {/* O texto do botão agora usa apenas isLoading para "Carregando..."
                e isPollingLoading para "Atualizando...", como antes. */}
            {isLoading ? 'Carregando...' : (isPollingLoading ? 'Atualizando...' : 'Atualizar Lista')}
          </button>
        </div>
        {error && (
            <div className="error-message" style={{marginBottom: '15px'}}>
                {error}
            </div>
        )}
        <ProcessedDatabasesTable
          databases={databases}
          // Mostra loading na tabela se for carga inicial/manual E ainda não houver dados
          isLoading={isLoading && databases.length === 0}
          onMarkForDiscard={handleMarkForDiscard}
        />
      </section>
    </div>
  );
};

export default ProcessedDatabasesPage;