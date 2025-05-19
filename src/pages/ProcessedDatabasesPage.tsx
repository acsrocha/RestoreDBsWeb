// src/pages/ProcessedDatabasesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import ProcessedDatabasesTable from '../components/processedDatabases/ProcessedDatabasesTable'
import {
  fetchProcessedDatabases,
  markDatabaseForDiscard
} from '../services/api'
import type { ProcessedDatabase } from '../types/api'
import { useInterval } from '../hooks/useInterval'
import { useLastUpdated } from '../contexts/LastUpdatedContext'
import { FiDatabase, FiRefreshCw } from 'react-icons/fi'

// --- NOVOS IMPORTS ---
import DiscardConfirmationModal from '../components/shared/DiscardConfirmationModal'
import NotificationBanner from '../components/shared/NotificationBanner'
// --- FIM DOS NOVOS IMPORTS ---

const REFRESH_PROCESSED_INTERVAL = 15000

const ProcessedDatabasesPage: React.FC = () => {
  const [databases, setDatabases] = useState<ProcessedDatabase[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null) // Erro de carregamento da lista

  const { signalUpdate, addActivity } = useLastUpdated()

  // --- NOVOS ESTADOS para o Modal e Feedback ---
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false)
  const [dbToConfirmDiscard, setDbToConfirmDiscard] =
    useState<ProcessedDatabase | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false)
  // --- FIM DOS NOVOS ESTADOS ---

  const loadDatabases = useCallback(
    async (isPollOperation = false, isTriggeredByManualAction = false) => {
      if (isTriggeredByManualAction && !isPollOperation) {
        setIsLoading(true) // Loading principal da página
        setError(null)
      } else if (isPollOperation && !isTriggeredByManualAction && !isLoading) {
        setIsPollingLoading(true) // Loading sutil para polling
      }

      try {
        const data = await fetchProcessedDatabases()
        setDatabases(data)
        if (!isPollOperation || isTriggeredByManualAction) setError(null)
        signalUpdate()
      } catch (err) {
        console.error('Falha ao buscar bancos processados:', err)
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar bancos processados.'
        if (!isPollOperation || isTriggeredByManualAction) {
          setError(errorMessage) // Define erro para carregamentos principais/manuais
          if (isTriggeredByManualAction || firstLoadProcessedRef.current)
            setDatabases([]) // Limpa dados apenas em erro de carregamento inicial ou manual
        }
        // Não define feedbackMessage aqui, pois este 'error' é para o carregamento da lista
      } finally {
        if (isTriggeredByManualAction || (!isPollOperation && isLoading)) {
          setIsLoading(false)
        }
        if (isPollOperation) {
          setIsPollingLoading(false)
        }
      }
    },
    [signalUpdate, isLoading] // Mantém isLoading aqui, pois afeta a lógica de setIsPollingLoading
  )

  const firstLoadProcessedRef = useRef(true)
  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      // setIsLoading(true); // Já é tratado no loadDatabases
      loadDatabases(false, true) // true para isTriggeredByManualAction na carga inicial
      firstLoadProcessedRef.current = false
    }
  }, [loadDatabases])

  useInterval(() => {
    if (!isLoading && !isPollingLoading && !isDiscardModalOpen) {
      // Não atualiza se o modal estiver aberto
      loadDatabases(true, false)
    }
  }, REFRESH_PROCESSED_INTERVAL)

  // --- NOVAS FUNÇÕES PARA GERENCIAR O MODAL DE DESCARTE ---
  const handleOpenDiscardModal = (dbId: string) => {
    // Remove originalTicketId daqui
    const dbToProcess = databases.find(d => d.id === dbId)
    if (dbToProcess) {
      setDbToConfirmDiscard(dbToProcess)
      setIsDiscardModalOpen(true)
      setFeedbackMessage(null)
    } else {
      console.error(
        `[handleOpenDiscardModal] Banco com ID ${dbId} NÃO encontrado.`
      )
      setFeedbackMessage({
        type: 'error',
        text: `Erro: Não foi possível encontrar o banco de dados com ID ${dbId} para descarte.`
      })
    }
  }

  const handleCloseDiscardModal = () => {
    if (addActivity && dbToConfirmDiscard && !isDiscarding) {
      addActivity(
        `Descarte para '${dbToConfirmDiscard.restoredDbAlias}' cancelado pelo usuário no modal.`
      )
    }
    setIsDiscardModalOpen(false)
    setDbToConfirmDiscard(null)
  }

  const handleConfirmDiscard = async (
    confirmationTicketValueFromModal?: string
  ) => {
    if (!dbToConfirmDiscard) return

    setIsDiscarding(true)
    setFeedbackMessage(null)

    const aliasToDiscard = dbToConfirmDiscard.restoredDbAlias

    try {
      const message = await markDatabaseForDiscard(
        dbToConfirmDiscard.id,
        confirmationTicketValueFromModal || ''
      )
      setFeedbackMessage({ type: 'success', text: message })
      if (addActivity) addActivity(message)
      await loadDatabases(false, true)
      setIsDiscardModalOpen(false)
      setDbToConfirmDiscard(null)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Erro desconhecido ao marcar '${aliasToDiscard}' para descarte.`
      console.error(`Falha ao marcar para descarte '${aliasToDiscard}':`, err)
      setFeedbackMessage({
        type: 'error',
        text: `Falha ao marcar '${aliasToDiscard}' para descarte: ${errorMessage}`
      })
    } finally {
      setIsDiscarding(false)
    }
  }
  // --- FIM DAS NOVAS FUNÇÕES ---

  const handleRefreshManual = () => {
    setFeedbackMessage(null)
    loadDatabases(false, true)
  }

  // LOG D: Verifica os estados relevantes antes de cada renderização da página

  return (
    <div id='view-bancos-restaurados' className='view active'>
      <section
        className='list-card processed-databases-card'
        id='processedDatabasesSection'
        aria-labelledby='processedDatabasesHeader'
      >
        <h2 id='processedDatabasesHeader'>
          <span className='icon'>
            <FiDatabase />
          </span>
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
            {isLoading && !isPollingLoading && !isDiscarding
              ? 'Carregando...'
              : isPollingLoading && !isDiscarding
              ? 'Atualizando...'
              : isDiscarding
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

        {error && !isLoading && (
          <div className='error-message' style={{ marginBottom: '15px' }}>
            {`Erro ao carregar dados: ${error}`}
          </div>
        )}
        <ProcessedDatabasesTable
          databases={databases}
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
  )
}

export default ProcessedDatabasesPage
