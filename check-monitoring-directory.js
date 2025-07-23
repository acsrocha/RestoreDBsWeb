// check-monitoring-directory.js
import fetch from 'node-fetch';

async function checkMonitoringDirectory() {
  try {
    console.log('Verificando diretório de monitoramento...');
    
    // Verificar status do backend
    const statusResponse = await fetch('http://localhost:8558/api/status');
    if (!statusResponse.ok) {
      throw new Error(`Erro ao verificar status: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    
    const statusData = await statusResponse.json();
    console.log('Status do backend:', statusData);
    
    // Extrair diretório monitorado da mensagem de atividade recente
    let monitoredDir = null;
    if (statusData.recentActivity && statusData.recentActivity.length > 0) {
      const activityMsg = statusData.recentActivity[0];
      const match = activityMsg.match(/Monitoramento \(Fsnotify\) iniciado para: (.+)$/);
      if (match && match[1]) {
        monitoredDir = match[1];
        console.log(`Diretório monitorado encontrado: ${monitoredDir}`);
      }
    }
    
    if (!monitoredDir) {
      console.log('Não foi possível identificar o diretório monitorado nas mensagens de atividade recente.');
      return;
    }
    
    // Verificar se há arquivos no monitoramento
    const monitoringResponse = await fetch('http://localhost:8558/api/file_monitoring');
    if (!monitoringResponse.ok) {
      throw new Error(`Erro ao verificar monitoramento: ${monitoringResponse.status} ${monitoringResponse.statusText}`);
    }
    
    const monitoringData = await monitoringResponse.json();
    console.log('Dados de monitoramento:');
    console.log(JSON.stringify(monitoringData, null, 2));
    
    // Verificar se os arrays estão presentes e não vazios
    const hasActiveFiles = monitoringData.activeFiles && monitoringData.activeFiles.length > 0;
    const hasCompletedFiles = monitoringData.recentlyCompleted && monitoringData.recentlyCompleted.length > 0;
    const hasFailedFiles = monitoringData.recentlyFailed && monitoringData.recentlyFailed.length > 0;
    
    console.log(`\nArquivos ativos: ${hasActiveFiles ? monitoringData.activeFiles.length : 0}`);
    console.log(`Arquivos concluídos: ${hasCompletedFiles ? monitoringData.recentlyCompleted.length : 0}`);
    console.log(`Arquivos com falha: ${hasFailedFiles ? monitoringData.recentlyFailed.length : 0}`);
    
    if (!hasActiveFiles && !hasCompletedFiles && !hasFailedFiles) {
      console.log('\nNenhum arquivo encontrado no monitoramento. Possíveis causas:');
      console.log('1. Não há arquivos no diretório monitorado');
      console.log('2. O backend não está processando os arquivos corretamente');
      console.log('3. O backend não está registrando os arquivos no sistema de monitoramento');
      console.log('\nRecomendações:');
      console.log('1. Verifique se há arquivos .fbk no diretório monitorado');
      console.log('2. Verifique os logs do backend para erros');
      console.log('3. Tente enviar um arquivo manualmente através da API de upload');
    } else {
      console.log('\nArquivos encontrados no monitoramento. O sistema parece estar funcionando corretamente.');
    }
    
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  }
}

checkMonitoringDirectory();