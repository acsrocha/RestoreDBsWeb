# Especificação da API de Monitoramento Detalhado de Arquivos

Este documento descreve a API necessária para o monitoramento detalhado de arquivos no sistema RestoreDBs.

## Endpoint Principal

```
GET /api/file_monitoring
```

### Resposta

```json
{
  "activeFiles": [
    {
      "fileId": "string",
      "fileName": "string",
      "originalPath": "string",
      "sourceType": "upload | google_drive | local",
      "status": "queued | processing | completed | failed",
      "createdAt": "string (ISO datetime)",
      "startedAt": "string (ISO datetime) | null",
      "completedAt": "string (ISO datetime) | null",
      "stages": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "status": "pending | in_progress | completed | failed",
          "startTime": "string (ISO datetime) | null",
          "endTime": "string (ISO datetime) | null",
          "steps": [
            {
              "id": "string",
              "timestamp": "string (ISO datetime)",
              "status": "pending | in_progress | completed | failed",
              "message": "string",
              "details": "string | null",
              "duration": "number | null"
            }
          ],
          "progress": "number (0-100)"
        }
      ],
      "overallProgress": "number (0-100)",
      "currentStage": "string | null",
      "error": "string | null"
    }
  ],
  "recentlyCompleted": [
    // Mesmo formato de activeFiles
  ],
  "recentlyFailed": [
    // Mesmo formato de activeFiles
  ]
}
```

## Endpoint para Detalhes de um Arquivo Específico

```
GET /api/file_monitoring/{fileId}
```

### Resposta

```json
{
  "fileId": "string",
  "fileName": "string",
  "originalPath": "string",
  "sourceType": "upload | google_drive | local",
  "status": "queued | processing | completed | failed",
  "createdAt": "string (ISO datetime)",
  "startedAt": "string (ISO datetime) | null",
  "completedAt": "string (ISO datetime) | null",
  "stages": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "pending | in_progress | completed | failed",
      "startTime": "string (ISO datetime) | null",
      "endTime": "string (ISO datetime) | null",
      "steps": [
        {
          "id": "string",
          "timestamp": "string (ISO datetime)",
          "status": "pending | in_progress | completed | failed",
          "message": "string",
          "details": "string | null",
          "duration": "number | null"
        }
      ],
      "progress": "number (0-100)"
    }
  ],
  "overallProgress": "number (0-100)",
  "currentStage": "string | null",
  "error": "string | null",
  "logs": [
    {
      "timestamp": "string (ISO datetime)",
      "level": "info | warning | error | debug",
      "message": "string",
      "source": "string"
    }
  ]
}
```

## Implementação no Backend

Para implementar esta API no backend, será necessário:

1. Criar um sistema de rastreamento de arquivos que registre cada etapa do processamento
2. Armazenar o histórico de processamento de cada arquivo
3. Calcular o progresso de cada estágio e o progresso geral
4. Manter um registro dos arquivos recentemente processados (concluídos ou com falha)

### Estágios Padrão de Processamento

Os estágios padrão para um arquivo de backup são:

1. **Download/Upload**: Recebimento do arquivo (upload direto ou download do Google Drive)
2. **Validação**: Verificação do formato e integridade do arquivo
3. **Restauração**: Processo de restauração do banco de dados
4. **Finalização**: Configuração e registro do banco restaurado

### Integração com o Sistema Existente

O sistema de monitoramento detalhado deve ser integrado com o sistema existente, registrando eventos em cada etapa do processamento. Isso pode ser feito através de:

1. Hooks em pontos-chave do código existente
2. Sistema de eventos para registrar o progresso
3. Armazenamento temporário do estado de processamento de cada arquivo

## Considerações de Segurança

- Todos os endpoints devem ser protegidos com a mesma autenticação usada no restante da API
- Não expor informações sensíveis nos logs ou detalhes do processamento
- Limitar o número de registros retornados para evitar sobrecarga