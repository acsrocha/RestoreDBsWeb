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

const REFRESH_PROCESSED_INTERVAL = 15000

const ProcessedDatabasesPage: React.FC = () => {
  const [databases, setDatabases] = useState<ProcessedDatabase[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPollingLoading, setIsPollingLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const { signalUpdate, addActivity } = useLastUpdated() // Supondo que addActivity existe no contexto

  const loadDatabases = useCallback(
    async (isPollOperation = false, isTriggeredByManualAction = false) => {
      if (isTriggeredByManualAction && !isPollOperation) {
        setIsLoading(true)
        setError(null)
      } else if (isPollOperation && !isTriggeredByManualAction && !isLoading) {
        setIsPollingLoading(true)
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
          setError(errorMessage)
          // Não limpar 'databases' em caso de erro de polling, para manter a última lista válida visível
          if (isTriggeredByManualAction || firstLoadProcessedRef.current)
            setDatabases([])
        }
      } finally {
        if (isTriggeredByManualAction || (!isPollOperation && isLoading)) {
          setIsLoading(false)
        }
        if (isPollOperation) {
          setIsPollingLoading(false)
        }
      }
    },
    [signalUpdate, isLoading]
  ) // isLoading como dependência

  const firstLoadProcessedRef = useRef(true)
  useEffect(() => {
    if (firstLoadProcessedRef.current) {
      setIsLoading(true)
      loadDatabases(false, true)
      firstLoadProcessedRef.current = false
    }
  }, [loadDatabases])

  useInterval(() => {
    if (!isLoading && !isPollingLoading) {
      loadDatabases(true, false)
    }
  }, REFRESH_PROCESSED_INTERVAL)

  const handleMarkForDiscard = async (
    dbId: string,
    originalTicketId?: string
  ) => {
    let confirmationTicketValue: string | null = '' // O valor que será enviado ao backend

    const dbToDiscard = databases.find(db => db.id === dbId)
    const aliasToDiscard = dbToDiscard
      ? dbToDiscard.restoredDbAlias
      : `ID ${dbId}`

    // Verifica se o ticket original existe e não é uma string vazia/undefined
    const hasOriginalTicket = originalTicketId && originalTicketId.trim() !== ''

    if (hasOriginalTicket) {
      confirmationTicketValue = window.prompt(
        `CONFIRMAÇÃO ADICIONAL NECESSÁRIA:\n\n` +
          `O banco '${aliasToDiscard}' está associado ao Ticket ID original: '${originalTicketId}'.\n` +
          `Para confirmar o DESCARTE PERMANENTE, por favor, digite o Ticket ID ('${originalTicketId}') novamente abaixo:`
      )

      if (confirmationTicketValue === null) {
        // Usuário clicou em "Cancelar" no prompt
        alert(`Descarte do banco '${aliasToDiscard}' cancelado pelo usuário.`)
        if (addActivity)
          addActivity(
            `Tentativa de descarte para '${aliasToDiscard}' cancelada pelo usuário.`
          )
        return
      }
    } else {
      // Se não há ticket original, apenas uma confirmação simples
      if (
        !window.confirm(
          `Tem certeza que deseja marcar o banco '${aliasToDiscard}' para descarte? Esta ação é irreversível.`
        )
      ) {
        if (addActivity)
          addActivity(
            `Tentativa de descarte para '${aliasToDiscard}' cancelada pelo usuário (confirmação simples).`
          )
        return
      }
      // confirmationTicketValue permanece ""
    }

    setIsLoading(true) // Feedback visual para a ação de descarte
    setError(null)
    try {
      const message = await markDatabaseForDiscard(
        dbId,
        confirmationTicketValue.trim()
      )
      alert(message) // Exibe a mensagem de sucesso (ou aviso com erros parciais) do backend
      if (addActivity) addActivity(message) // Loga a mensagem do backend na UI de atividades
      await loadDatabases(false, true) // Recarrega a lista como uma ação manual
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Erro desconhecido ao marcar '${aliasToDiscard}' para descarte.`
      console.error(`Falha ao marcar para descarte '${aliasToDiscard}':`, err)
      alert(
        `Falha ao marcar '${aliasToDiscard}' para descarte:\n\n${errorMessage}`
      ) // Exibe a mensagem de erro do backend
      setError(errorMessage)
      setIsLoading(false)
    }
    // Se o descarte for bem-sucedido, o setIsLoading(false) é feito no finally de loadDatabases
  }

  const handleRefreshManual = () => {
    loadDatabases(false, true)
  }

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
            disabled={isLoading || isPollingLoading}
          >
            <FiRefreshCw />
            {isLoading && !isPollingLoading
              ? 'Carregando...'
              : isPollingLoading
              ? 'Atualizando...'
              : 'Atualizar Lista'}
          </button>
        </div>
        {error && !isLoading && (
          <div className='error-message' style={{ marginBottom: '15px' }}>
            {`Erro: ${error}`}
          </div>
        )}
        <ProcessedDatabasesTable
          databases={databases}
          isLoading={isLoading && databases.length === 0}
          onMarkForDiscard={handleMarkForDiscard}
        />
      </section>
    </div>
  )
}

export default ProcessedDatabasesPage
