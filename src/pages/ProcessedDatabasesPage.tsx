// src/pages/ProcessedDatabasesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Adicionado useRef
import ProcessedDatabasesTable from '../components/processedDatabases/ProcessedDatabasesTable';
import { fetchProcessedDatabases, markDatabaseForDiscard } from '../services/api';
import type { ProcessedDatabase } from '../types/api';
import { useInterval } from '../hooks/useInterval';
import { useLastUpdated } from '../contexts/LastUpdatedContext';
import { FiDatabase, FiRefreshCw } from 'react-icons/fi';

const REFRESH_PROCESSED_INTERVAL = 15000;

const ProcessedDatabasesPage: React.FC = () => {
  const [databases, setDatabases] = useState<ProcessedDatabase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Para carga inicial E refresh manual
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { signalUpdate } = useLastUpdated();

  //isLoading é controlado externamente (pelo useEffect de montagem ou pelo handleRefreshManual)
  const loadDatabases = useCallback(async (isPollOperation = false) => {
    if (isPollOperation) {
      setIsPollingLoading(true);
    }
    // Não seta setIsLoading(true) aqui, pois é controlado pelo chamador

    try {
      const data = await fetchProcessedDatabases();
      setDatabases(data);
      setError(null);
      signalUpdate();
    } catch (err) {
      console.error('Falha ao buscar bancos processados:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar bancos processados.';
      setError(errorMessage);
      // Só limpa databases se for erro na carga inicial/manual, não no polling
      if (!isPollOperation && isLoading) setDatabases([]);
    } finally {
      // isLoading só é setado para false se foi um carregamento principal (não polling)
      // e se ele estava true.
      if (isLoading && !isPollOperation) {
          setIsLoading(false);
      }
      if (isPollOperation) {
        setIsPollingLoading(false);
      }
    }
  }, [signalUpdate, isLoading]); // Manter isLoading como dependência para o finally funcionar corretamente

  const firstLoadProcessedRef = useRef(true);
  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      setIsLoading(true); // Ativa loading para a primeira carga
      loadDatabases();
      firstLoadProcessedRef.current = false;
    }
  }, [loadDatabases]); // loadDatabases agora depende de isLoading e signalUpdate, mas o ref previne o loop

  useInterval(() => {
    if (!isLoading && !isPollingLoading) { // Evita polling se já estiver carregando (inicial/manual ou outro polling)
        loadDatabases(true);
    }
  }, REFRESH_PROCESSED_INTERVAL);

  const handleMarkForDiscard = async (dbId: string) => {
    if (!window.confirm(`Tem certeza que deseja marcar o banco de dados com ID '${dbId}' para descarte? Esta ação é irreversível.`)) {
      return;
    }
    setIsLoading(true); // Mostra loading durante a operação
    setError(null);
    try {
      const message = await markDatabaseForDiscard(dbId);
      alert(message || `Banco ${dbId} processado para descarte.`);
      await loadDatabases(); // Recarrega a lista (e implicitamente chama signalUpdate)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro crítico ao marcar para descarte.';
      alert(errorMessage);
      console.error('Falha crítica ao marcar para descarte:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshManual = () => {
    setIsLoading(true); // Ativa o loading principal
    setError(null); // Limpa erros anteriores
    loadDatabases(false); // Chama loadDatabases indicando que não é polling
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
          isLoading={isLoading && databases.length === 0} // Mostra loading na tabela só na carga inicial E sem dados
          onMarkForDiscard={handleMarkForDiscard}
        />
      </section>
    </div>
  );
};

export default ProcessedDatabasesPage;