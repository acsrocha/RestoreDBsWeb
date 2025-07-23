// test-file-monitoring.js
import fetch from 'node-fetch';

async function testFileMonitoring() {
  try {
    console.log('Testando endpoint de monitoramento de arquivos...');
    
    // Testar o endpoint de monitoramento
    const response = await fetch('http://localhost:8558/api/file_monitoring');
    
    if (!response.ok) {
      throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Resposta do endpoint de monitoramento:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verificar se os arrays estão presentes
    if (!data.activeFiles || !Array.isArray(data.activeFiles)) {
      console.error('ERRO: activeFiles não é um array válido');
    } else {
      console.log(`activeFiles: ${data.activeFiles.length} itens`);
    }
    
    if (!data.recentlyCompleted || !Array.isArray(data.recentlyCompleted)) {
      console.error('ERRO: recentlyCompleted não é um array válido');
    } else {
      console.log(`recentlyCompleted: ${data.recentlyCompleted.length} itens`);
    }
    
    if (!data.recentlyFailed || !Array.isArray(data.recentlyFailed)) {
      console.error('ERRO: recentlyFailed não é um array válido');
    } else {
      console.log(`recentlyFailed: ${data.recentlyFailed.length} itens`);
    }
    
    console.log('\nTeste concluído!');
  } catch (error) {
    console.error('Erro ao testar o endpoint:', error);
  }
}

testFileMonitoring();