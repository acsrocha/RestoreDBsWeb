# Integração de Progresso das Etapas - RestoreDBs

## Visão Geral

Este documento descreve como o backend deve estruturar os dados de progresso das etapas para que o frontend possa exibir corretamente o estado de cada fase do processamento (Download, Validação, Restauração, Finalização).

## Estrutura de Dados Esperada

### Interface ProcessingStage

```typescript
interface ProcessingStage {
  status: 'pending' | 'start' | 'processing' | 'in_progress' | 'complete' | 'completed' | 'failed';
  details?: string;
  progress?: number; // 0-100
  startTime?: string; // ISO 8601 format
  endTime?: string;   // ISO 8601 format
  steps?: Array<{
    id: string;
    timestamp: string; // ISO 8601 format
    status: string;
    message: string;
    details?: string;
    duration?: number; // em milissegundos
  }>;
}
```

### Exemplo de Resposta da API

```json
{
  "id": "file_123",
  "fileName": "backup_cliente.fbk",
  "currentStage": "download",
  "overallProgress": 25,
  "downloadStage": {
    "status": "processing",
    "progress": 75,
    "startTime": "2025-01-08T15:30:00Z",
    "details": "Baixando do Google Drive...",
    "steps": [
      {
        "id": "step_1",
        "timestamp": "2025-01-08T15:30:00Z",
        "status": "completed",
        "message": "Conectando ao Google Drive",
        "duration": 2000
      },
      {
        "id": "step_2",
        "timestamp": "2025-01-08T15:30:02Z",
        "status": "in_progress",
        "message": "Baixando arquivo (75%)",
        "details": "Velocidade: 2.5 MB/s"
      }
    ]
  },
  "validationStage": {
    "status": "pending"
  },
  "restoreStage": {
    "status": "pending"
  },
  "finalizationStage": {
    "status": "pending"
  }
}
```

## Estados das Etapas

### 1. Download
- **pending**: Aguardando início do download
- **processing**: Download em andamento
- **complete**: Download concluído com sucesso
- **failed**: Falha no download

**Passos típicos:**
- Conectando ao Google Drive
- Autenticando
- Localizando arquivo
- Iniciando download
- Download em progresso (com percentual)
- Verificando integridade do arquivo baixado

### 2. Validação
- **pending**: Aguardando validação
- **processing**: Validando arquivo
- **complete**: Arquivo válido
- **failed**: Arquivo inválido ou corrompido

**Passos típicos:**
- Verificando extensão do arquivo
- Verificando tamanho do arquivo
- Testando se é um backup válido do Firebird
- Verificando integridade dos dados
- Extraindo metadados do backup

### 3. Restauração
- **pending**: Aguardando restauração
- **processing**: Restauração em andamento
- **complete**: Restauração concluída
- **failed**: Falha na restauração

**Passos típicos:**
- Preparando ambiente de restauração
- Executando gbak
- Monitorando progresso da restauração
- Verificando banco restaurado
- Criando alias no Firebird

### 4. Finalização
- **pending**: Aguardando finalização
- **processing**: Finalizando processo
- **complete**: Processo concluído
- **failed**: Falha na finalização

**Passos típicos:**
- Movendo arquivos para diretórios finais
- Atualizando banco de dados interno
- Enviando notificações
- Limpando arquivos temporários
- Registrando logs finais

## Implementação no Backend

### 1. Atualização de Estado

O backend deve atualizar o estado das etapas conforme o processamento avança:

```go
// Exemplo em Go
func updateStageProgress(fileID string, stage string, status string, progress int, details string) {
    stageData := StageData{
        Status:    status,
        Progress:  progress,
        Details:   details,
        UpdatedAt: time.Now(),
    }
    
    if status == "processing" && getStageData(fileID, stage).Status != "processing" {
        stageData.StartTime = time.Now()
    }
    
    if status == "complete" || status == "failed" {
        stageData.EndTime = time.Now()
    }
    
    updateJobStage(fileID, stage, stageData)
}
```

### 2. Adição de Passos

```go
func addStageStep(fileID string, stage string, message string, status string, details string) {
    step := StageStep{
        ID:        generateStepID(),
        Timestamp: time.Now(),
        Status:    status,
        Message:   message,
        Details:   details,
    }
    
    addStepToStage(fileID, stage, step)
}
```

### 3. Exemplo de Fluxo Completo

```go
// Início do download
updateStageProgress(fileID, "download", "processing", 0, "Iniciando download do Google Drive")
addStageStep(fileID, "download", "Conectando ao Google Drive", "in_progress", "")

// Durante o download
updateStageProgress(fileID, "download", "processing", 50, "Download em andamento")
addStageStep(fileID, "download", "Download 50% concluído", "in_progress", "Velocidade: 2.1 MB/s")

// Download concluído
updateStageProgress(fileID, "download", "complete", 100, "Download concluído com sucesso")
addStageStep(fileID, "download", "Download finalizado", "completed", "Arquivo salvo em: /temp/backup.fbk")

// Início da validação
updateCurrentStage(fileID, "validation")
updateStageProgress(fileID, "validation", "processing", 0, "Validando arquivo de backup")
addStageStep(fileID, "validation", "Verificando extensão do arquivo", "in_progress", "")
```

## Benefícios da Implementação

1. **Transparência**: O usuário vê exatamente o que está acontecendo em cada etapa
2. **Debugging**: Facilita identificar onde ocorrem problemas
3. **UX Melhorada**: Interface mais informativa e profissional
4. **Monitoramento**: Permite acompanhar performance de cada etapa
5. **Logs Detalhados**: Histórico completo do processamento

## Considerações Técnicas

- Use timestamps em formato ISO 8601 para compatibilidade
- Mantenha os passos organizados cronologicamente
- Limite o número de passos por etapa (máximo 20-30)
- Use mensagens claras e em português
- Inclua detalhes técnicos apenas quando necessário
- Considere performance ao atualizar estados frequentemente

## Testes

Para testar a implementação:

1. Simule diferentes cenários de falha em cada etapa
2. Teste com arquivos de diferentes tamanhos
3. Verifique se os timestamps estão corretos
4. Confirme que o progresso é atualizado adequadamente
5. Teste a expansão/recolhimento dos detalhes no frontend