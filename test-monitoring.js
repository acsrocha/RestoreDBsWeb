// Script para testar o monitoramento em tempo real
// Execute com: node test-monitoring.js

const API_BASE_URL = 'http://localhost:8080';
const API_KEY = process.env.RESTOREDB_API_KEY || 'sua-chave-aqui';

async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function testFileMonitoring() {
  console.log('🔍 Testando API de monitoramento de arquivos...\n');
  
  try {
    // Buscar dados de monitoramento
    const monitoringData = await fetchWithAuth(`${API_BASE_URL}/api/file_monitoring`);
    
    console.log('📊 Dados de monitoramento recebidos:');
    console.log(`- Arquivos ativos: ${monitoringData.activeFiles?.length || 0}`);
    console.log(`- Concluídos recentemente: ${monitoringData.recentlyCompleted?.length || 0}`);
    console.log(`- Falhas recentes: ${monitoringData.recentlyFailed?.length || 0}\n`);
    
    // Mostrar detalhes dos arquivos ativos
    if (monitoringData.activeFiles && monitoringData.activeFiles.length > 0) {
      console.log('🔄 Arquivos em processamento:');
      monitoringData.activeFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.fileName}`);
        console.log(`     Status: ${file.status}`);
        console.log(`     Progresso: ${file.overallProgress}%`);
        console.log(`     Estágio atual: ${file.currentStage || 'N/A'}`);
        
        if (file.stages && file.stages.length > 0) {
          console.log('     Estágios:');
          file.stages.forEach((stage, stageIndex) => {
            console.log(`       ${stageIndex + 1}. ${stage.name}: ${stage.status} (${stage.progress}%)`);
            if (stage.steps && stage.steps.length > 0) {
              console.log('         Passos:');
              stage.steps.forEach((step, stepIndex) => {
                const timestamp = new Date(step.timestamp).toLocaleTimeString();
                console.log(`           ${stepIndex + 1}. [${timestamp}] ${step.message} (${step.status})`);
                if (step.details) {
                  console.log(`              Detalhes: ${step.details}`);
                }
              });
            }
          });
        }
        console.log('');
      });
    }
    
    // Mostrar arquivos concluídos
    if (monitoringData.recentlyCompleted && monitoringData.recentlyCompleted.length > 0) {
      console.log('✅ Arquivos concluídos recentemente:');
      monitoringData.recentlyCompleted.forEach((file, index) => {
        const completedAt = file.completedAt ? new Date(file.completedAt).toLocaleString() : 'N/A';
        console.log(`  ${index + 1}. ${file.fileName} - Concluído em: ${completedAt}`);
      });
      console.log('');
    }
    
    // Mostrar arquivos com falha
    if (monitoringData.recentlyFailed && monitoringData.recentlyFailed.length > 0) {
      console.log('❌ Arquivos com falha recentemente:');
      monitoringData.recentlyFailed.forEach((file, index) => {
        const failedAt = file.completedAt ? new Date(file.completedAt).toLocaleString() : 'N/A';
        console.log(`  ${index + 1}. ${file.fileName} - Falhou em: ${failedAt}`);
        if (file.error) {
          console.log(`     Erro: ${file.error}`);
        }
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar monitoramento:', error.message);
  }
}

async function monitorInRealTime() {
  console.log('🔄 Iniciando monitoramento em tempo real...');
  console.log('Pressione Ctrl+C para parar\n');
  
  let previousData = null;
  
  const monitor = async () => {
    try {
      const currentData = await fetchWithAuth(`${API_BASE_URL}/api/file_monitoring`);
      
      // Verificar se houve mudanças
      const currentDataStr = JSON.stringify(currentData);
      if (previousData !== currentDataStr) {
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 Dados atualizados:`);
        
        // Mostrar apenas mudanças significativas
        const activeCount = currentData.activeFiles?.length || 0;
        const completedCount = currentData.recentlyCompleted?.length || 0;
        const failedCount = currentData.recentlyFailed?.length || 0;
        
        console.log(`  Ativos: ${activeCount}, Concluídos: ${completedCount}, Falhas: ${failedCount}`);
        
        // Mostrar progresso dos arquivos ativos
        if (currentData.activeFiles && currentData.activeFiles.length > 0) {
          currentData.activeFiles.forEach(file => {
            console.log(`  📁 ${file.fileName}: ${file.overallProgress}% (${file.currentStage || 'N/A'})`);
          });
        }
        
        console.log('');
        previousData = currentDataStr;
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Erro:`, error.message);
    }
  };
  
  // Executar imediatamente e depois a cada 2 segundos
  await monitor();
  const interval = setInterval(monitor, 2000);
  
  // Parar quando Ctrl+C for pressionado
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando monitoramento...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--realtime') || args.includes('-r')) {
    await monitorInRealTime();
  } else {
    await testFileMonitoring();
    
    console.log('💡 Dica: Use --realtime ou -r para monitoramento contínuo');
    console.log('   Exemplo: node test-monitoring.js --realtime');
  }
}

// Executar
main().catch(console.error);