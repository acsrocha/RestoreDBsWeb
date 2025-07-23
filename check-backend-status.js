// check-backend-status.js
import fetch from 'node-fetch';

async function checkBackendStatus() {
  try {
    console.log('Verificando status do backend...');
    
    // Verificar endpoint de status
    try {
      const statusResponse = await fetch('http://localhost:8558/api/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Status do backend:', statusData);
      } else {
        console.log(`Endpoint /api/status não disponível: ${statusResponse.status} ${statusResponse.statusText}`);
      }
    } catch (error) {
      console.log('Erro ao verificar endpoint /api/status:', error.message);
    }
    
    // Verificar endpoint de monitoramento
    try {
      const monitoringResponse = await fetch('http://localhost:8558/api/file_monitoring');
      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        console.log('Dados de monitoramento:');
        console.log(JSON.stringify(monitoringData, null, 2));
        
        // Verificar se os arrays estão presentes
        if (!monitoringData.activeFiles || !Array.isArray(monitoringData.activeFiles)) {
          console.error('ERRO: activeFiles não é um array válido');
        } else {
          console.log(`activeFiles: ${monitoringData.activeFiles.length} itens`);
        }
        
        if (!monitoringData.recentlyCompleted || !Array.isArray(monitoringData.recentlyCompleted)) {
          console.error('ERRO: recentlyCompleted não é um array válido');
        } else {
          console.log(`recentlyCompleted: ${monitoringData.recentlyCompleted.length} itens`);
        }
        
        if (!monitoringData.recentlyFailed || !Array.isArray(monitoringData.recentlyFailed)) {
          console.error('ERRO: recentlyFailed não é um array válido');
        } else {
          console.log(`recentlyFailed: ${monitoringData.recentlyFailed.length} itens`);
        }
      } else {
        console.log(`Endpoint /api/file_monitoring não disponível: ${monitoringResponse.status} ${monitoringResponse.statusText}`);
      }
    } catch (error) {
      console.log('Erro ao verificar endpoint /api/file_monitoring:', error.message);
    }
    
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar status do backend:', error);
  }
}

checkBackendStatus();