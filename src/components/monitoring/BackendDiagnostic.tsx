// src/components/monitoring/BackendDiagnostic.tsx
import React, { useState } from 'react';

interface BackendDiagnosticProps {
  onRefresh: () => void;
}

const BackendDiagnostic: React.FC<BackendDiagnosticProps> = ({ onRefresh }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const checkBackendConfig = async () => {
    setIsChecking(true);
    setDiagnosticResult(null);
    setDiagnosticError(null);
    
    try {
      // Verificar status do backend
      const statusResponse = await fetch('/api/status');
      if (!statusResponse.ok) {
        throw new Error(`Erro ao verificar status: ${statusResponse.status} ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('Status do backend:', statusData);
      
      // Verificar monitoramento
      const monitoringResponse = await fetch('/api/file_monitoring');
      if (!monitoringResponse.ok) {
        throw new Error(`Erro ao verificar monitoramento: ${monitoringResponse.status} ${monitoringResponse.statusText}`);
      }
      
      const monitoringData = await monitoringResponse.json();
      console.log('Dados de monitoramento:', monitoringData);
      
      // Analisar configuração
      let result = '## Diagnóstico do Backend ##\n\n';
      
      // Verificar diretório monitorado
      let monitoredDir = null;
      if (statusData.recentActivity && statusData.recentActivity.length > 0) {
        const activityMsg = statusData.recentActivity[0];
        const match = activityMsg.match(/Monitoramento \(Fsnotify\) iniciado para: (.+)$/);
        if (match && match[1]) {
          monitoredDir = match[1];
          result += `✅ Diretório monitorado: ${monitoredDir}\n`;
        } else {
          result += `❌ Não foi possível identificar o diretório monitorado\n`;
        }
      } else {
        result += `❌ Não há mensagens de atividade recente\n`;
      }
      
      // Verificar fila
      if (statusData.queueCount !== undefined) {
        result += `✅ Fila de processamento: ${statusData.queueCount} arquivo(s)\n`;
      } else {
        result += `❌ Não foi possível verificar a fila de processamento\n`;
      }
      
      // Verificar monitoramento do Google Drive
      if (statusData.driveMonitorNextRunEpoch) {
        const nextRun = new Date(statusData.driveMonitorNextRunEpoch * 1000);
        result += `✅ Próxima verificação do Drive: ${nextRun.toLocaleString()}\n`;
        result += `✅ Intervalo de verificação: ${statusData.driveMonitorIntervalMinutes || 0} minutos\n`;
      } else {
        result += `❓ Monitoramento do Google Drive não configurado ou desativado\n`;
      }
      
      // Verificar dados de monitoramento
      const hasActiveFiles = monitoringData.activeFiles && monitoringData.activeFiles.length > 0;
      const hasCompletedFiles = monitoringData.recentlyCompleted && monitoringData.recentlyCompleted.length > 0;
      const hasFailedFiles = monitoringData.recentlyFailed && monitoringData.recentlyFailed.length > 0;
      
      result += `\n## Dados de Monitoramento ##\n`;
      result += `- Arquivos ativos: ${hasActiveFiles ? monitoringData.activeFiles.length : 0}\n`;
      result += `- Arquivos concluídos: ${hasCompletedFiles ? monitoringData.recentlyCompleted.length : 0}\n`;
      result += `- Arquivos com falha: ${hasFailedFiles ? monitoringData.recentlyFailed.length : 0}\n`;
      
      if (!hasActiveFiles && !hasCompletedFiles && !hasFailedFiles) {
        result += `\n⚠️ Nenhum arquivo encontrado no monitoramento.\n`;
        result += `Isso pode indicar que:\n`;
        result += `1. Não há arquivos no diretório monitorado\n`;
        result += `2. O backend não está processando os arquivos corretamente\n`;
        result += `3. O backend não está registrando os arquivos no sistema de monitoramento\n`;
      }
      
      // Recomendações
      result += `\n## Recomendações ##\n`;
      if (!monitoredDir) {
        result += `- Verifique se o diretório de monitoramento está configurado corretamente no backend\n`;
      }
      
      if (!hasActiveFiles && !hasCompletedFiles && !hasFailedFiles) {
        result += `- Tente enviar um arquivo manualmente através da API de upload\n`;
        result += `- Verifique os logs do backend para erros\n`;
        result += `- Verifique se há arquivos .fbk no diretório monitorado\n`;
      }
      
      setDiagnosticResult(result);
    } catch (error) {
      console.error('Erro durante o diagnóstico:', error);
      setDiagnosticError(`Erro durante o diagnóstico: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Diagnóstico do Backend</h3>
      <p>Use esta ferramenta para verificar a configuração do backend e identificar problemas.</p>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={checkBackendConfig}
          disabled={isChecking}
          style={{ padding: '5px 10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}
        >
          {isChecking ? 'Verificando...' : 'Verificar Configuração do Backend'}
        </button>
        
        <button 
          onClick={onRefresh}
          disabled={isChecking}
          style={{ padding: '5px 10px' }}
        >
          Atualizar Dados
        </button>
      </div>
      
      {diagnosticError && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong>Erro:</strong> {diagnosticError}
        </div>
      )}
      
      {diagnosticResult && (
        <div style={{ marginTop: '10px' }}>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap' }}>
            {diagnosticResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BackendDiagnostic;