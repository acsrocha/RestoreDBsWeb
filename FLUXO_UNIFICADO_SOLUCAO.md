# Solução para Fluxo Unificado de Monitoramento

## Problema Atual
Os componentes de monitoramento não estão consumindo um fluxo unificado:
- Monitoramento Geral usa `/api/status`
- Monitoramento Detalhado usa `/api/file_monitoring`
- Pipeline usa `UnifiedTrackingContext`

## Solução Proposta

### 1. Modificar o Backend - Download Use Case
No arquivo `application/download_usecase.go`, adicionar criação de job:

```go
// Após mover o arquivo para Watched, criar job imediatamente
if uc.jobEnqueuer != nil {
    jobID := monitoring.GenerateID()
    job := &monitoring.FileProcessingJob{
        FileID:          jobID,
        FileName:        finalFileName,
        OriginalPath:    finalDestinationPath,
        SourceType:      "google_drive",
        Status:          "queued",
        CreatedAt:       time.Now(),
        Stages:          monitoring.CreateDefaultStages(),
        OverallProgress: 0,
        CurrentStage:    "queued",
    }
    
    // Adicionar ao job tracker
    if jobTracker, ok := uc.jobEnqueuer.(interface{ AddJob(*monitoring.FileProcessingJob) }); ok {
        jobTracker.AddJob(job)
    }
    
    // Enfileirar para processamento
    uc.jobEnqueuer.EnqueueJobCallback(Job{
        FilePath:           finalDestinationPath,
        OriginalFileName:   fileToDownload.Name,
        InternalFileName:   finalFileName,
        ClienteNome:        area.ClientName,
        TicketID:           area.TicketID,
        ClientUploadAreaID: area.ID,
        Source:             "Download Manual via Web",
    })
}
```

### 2. Unificar APIs no Frontend
Modificar `MonitoringPage.tsx` para usar o contexto unificado:

```typescript
// Substituir as chamadas diretas de API por:
const { items, stats } = useUnifiedTracking();

// Calcular dados baseados nos items unificados
const currentProcessing = items.find(item => item.currentStage === 'processing');
const queuedFiles = items.filter(item => item.currentStage === 'queued');
```

### 3. Melhorar UnifiedTrackingContext
Adicionar sincronização mais robusta:

```typescript
const syncWithAPIs = useCallback(async () => {
    try {
        setIsLoading(true);
        
        // Buscar dados de todas as fontes
        const [statusData, monitoringData, clientAreas] = await Promise.all([
            fetchStatusData().catch(() => null),
            fetchFileMonitoringData().catch(() => null),
            fetchAdminClientUploadAreaDetails().catch(() => [])
        ]);

        const unifiedItems: UnifiedTrackingItem[] = [];

        // 1. Priorizar dados do file_monitoring (mais detalhados)
        if (monitoringData) {
            [...monitoringData.activeFiles, ...monitoringData.recentlyCompleted, ...monitoringData.recentlyFailed]
                .forEach(file => {
                    unifiedItems.push(convertFileToUnifiedItem(file));
                });
        }

        // 2. Adicionar dados de status que não estão no monitoring
        if (statusData) {
            // Arquivo em processamento
            if (statusData.currentProcessing && !unifiedItems.some(item => 
                item.fileName === getFileNameFromPath(statusData.currentProcessing) && 
                item.currentStage === 'processing'
            )) {
                unifiedItems.push(createProcessingItem(statusData.currentProcessing));
            }

            // Arquivos na fila
            statusData.queuedFiles?.forEach((filePath, index) => {
                const fileName = getFileNameFromPath(filePath);
                if (!unifiedItems.some(item => item.fileName === fileName && item.currentStage === 'queued')) {
                    unifiedItems.push(createQueuedItem(filePath, index));
                }
            });
        }

        // 3. Adicionar downloads em progresso das áreas de cliente
        clientAreas.forEach(area => {
            // Verificar se há downloads em progresso para esta área
            // (baseado no estado local ou API específica)
        });

        setItems(unifiedItems);
        
    } catch (error) {
        console.error('Erro ao sincronizar tracking unificado:', error);
    } finally {
        setIsLoading(false);
    }
}, []);
```

### 4. Integração com Download de Área Cliente
No `AdminClientAreasPage.tsx`, integrar com o contexto unificado:

```typescript
const handleDownload = async (area: AdminClientUploadAreaDetail) => {
    try {
        // Iniciar tracking unificado ANTES da chamada da API
        const trackingId = startDownload(area.gdrive_folder_name || 'Pasta do Drive', 'drive');
        
        // Executar download real
        const response = await downloadFromDrive(area.upload_area_id);
        
        // O backend agora criará o job automaticamente
        // O UnifiedTrackingContext detectará via polling
        
        showSuccess('Download iniciado com sucesso!');
        
    } catch (error) {
        failItem(trackingId, error?.message || 'Erro no download');
        showError('Erro ao iniciar download: ' + (error?.message || 'Erro desconhecido'));
    }
};
```

## Resultado Esperado

Com essas modificações:

1. **Download de Área Cliente** → Cria job imediatamente → Aparece em **todos** os monitoramentos
2. **Monitoramento Geral** → Usa dados unificados → Mostra mesmos arquivos que Detalhado
3. **Pipeline Unificado** → Mostra fluxo completo: Download → Extração → Validação → Fila → Processamento
4. **Monitoramento Detalhado** → Mantém detalhes específicos mas usa mesma fonte de dados

## Implementação Prioritária

1. **Backend**: Modificar `download_usecase.go` para criar jobs
2. **Frontend**: Fazer `MonitoringPage.tsx` usar `UnifiedTrackingContext`
3. **Contexto**: Melhorar sincronização no `UnifiedTrackingContext`
4. **Integração**: Conectar download de área cliente com tracking unificado