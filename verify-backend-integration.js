// verify-backend-integration.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para criar um arquivo de teste
function createTestFile(name, size) {
  const filePath = path.join(__dirname, name);
  const buffer = Buffer.alloc(size, 'A');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Função para esperar um tempo específico
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyBackendIntegration() {
  try {
    console.log('Verificando integração do backend...');
    
    // Verificar status inicial
    console.log('\nVerificando status inicial do backend...');
    const statusResponse = await fetch('http://localhost:8558/api/status');
    if (!statusResponse.ok) {
      throw new Error(`Erro ao verificar status: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    
    const statusData = await statusResponse.json();
    console.log('Status do backend:', statusData);
    
    // Verificar monitoramento inicial
    console.log('\nVerificando monitoramento inicial...');
    const initialMonitoringResponse = await fetch('http://localhost:8558/api/file_monitoring');
    if (!initialMonitoringResponse.ok) {
      throw new Error(`Erro ao verificar monitoramento: ${initialMonitoringResponse.status} ${initialMonitoringResponse.statusText}`);
    }
    
    const initialMonitoringData = await initialMonitoringResponse.json();
    console.log('Dados de monitoramento iniciais:');
    console.log(JSON.stringify(initialMonitoringData, null, 2));
    
    // Criar arquivo de teste
    const testFileName = `teste-${Date.now()}.fbk`;
    const testFilePath = createTestFile(testFileName, 1024 * 10); // 10KB
    console.log(`\nArquivo de teste criado: ${testFilePath}`);
    
    // Enviar arquivo para o endpoint de upload
    console.log('\nEnviando arquivo para restauração...');
    
    // Criar FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('clienteNome', 'Teste de Integração');
    formData.append('ticketID', `TEST-${Date.now()}`);
    
    const uploadResponse = await fetch('http://localhost:8558/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Erro no upload: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('Resultado do upload:', uploadResult);
    
    // Esperar um pouco para o backend processar
    console.log('\nAguardando processamento do arquivo (5 segundos)...');
    await sleep(5000);
    
    // Verificar monitoramento após upload
    console.log('\nVerificando monitoramento após upload...');
    const finalMonitoringResponse = await fetch('http://localhost:8558/api/file_monitoring');
    if (!finalMonitoringResponse.ok) {
      throw new Error(`Erro ao verificar monitoramento: ${finalMonitoringResponse.status} ${finalMonitoringResponse.statusText}`);
    }
    
    const finalMonitoringData = await finalMonitoringResponse.json();
    console.log('Dados de monitoramento finais:');
    console.log(JSON.stringify(finalMonitoringData, null, 2));
    
    // Verificar se o arquivo apareceu no monitoramento
    const initialActiveCount = initialMonitoringData.activeFiles?.length || 0;
    const initialCompletedCount = initialMonitoringData.recentlyCompleted?.length || 0;
    const initialFailedCount = initialMonitoringData.recentlyFailed?.length || 0;
    
    const finalActiveCount = finalMonitoringData.activeFiles?.length || 0;
    const finalCompletedCount = finalMonitoringData.recentlyCompleted?.length || 0;
    const finalFailedCount = finalMonitoringData.recentlyFailed?.length || 0;
    
    const hasNewFile = 
      finalActiveCount > initialActiveCount ||
      finalCompletedCount > initialCompletedCount ||
      finalFailedCount > initialFailedCount;
    
    if (hasNewFile) {
      console.log('\n✅ SUCESSO: O arquivo apareceu no monitoramento!');
      
      // Verificar em qual categoria o arquivo apareceu
      if (finalActiveCount > initialActiveCount) {
        console.log('O arquivo está na categoria "Arquivos em Processamento"');
      }
      
      if (finalCompletedCount > initialCompletedCount) {
        console.log('O arquivo está na categoria "Arquivos Concluídos Recentemente"');
      }
      
      if (finalFailedCount > initialFailedCount) {
        console.log('O arquivo está na categoria "Arquivos com Falha"');
      }
    } else {
      console.log('\n❌ FALHA: O arquivo não apareceu no monitoramento.');
      console.log('Isso pode indicar um problema na integração entre o upload e o sistema de monitoramento.');
      console.log('\nPossíveis causas:');
      console.log('1. O backend não está registrando os arquivos no sistema de monitoramento');
      console.log('2. O backend não está processando os arquivos corretamente');
      console.log('3. Há um atraso maior que o esperado no processamento');
      
      console.log('\nRecomendações:');
      console.log('1. Verifique os logs do backend para erros');
      console.log('2. Aumente o tempo de espera e tente novamente');
      console.log('3. Verifique se o endpoint /api/file_monitoring está implementado corretamente');
    }
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log(`\nArquivo de teste removido: ${testFilePath}`);
    
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  }
}

verifyBackendIntegration();