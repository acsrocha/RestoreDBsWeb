// test-upload-monitoring.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Função para criar um arquivo de teste
function createTestFile(filePath, size) {
  const buffer = Buffer.alloc(size, 'A');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Função para esperar um tempo específico
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUploadAndMonitoring() {
  try {
    console.log('Iniciando teste de upload e monitoramento...');
    
    // Criar arquivo de teste
    const testFilePath = path.join(process.cwd(), 'teste.fbk');
    createTestFile(testFilePath, 1024 * 10); // 10KB
    console.log(`Arquivo de teste criado: ${testFilePath}`);
    
    // Verificar estado inicial do monitoramento
    console.log('\nVerificando estado inicial do monitoramento...');
    const initialMonitoring = await fetch('http://localhost:8558/api/file_monitoring');
    const initialData = await initialMonitoring.json();
    console.log('Estado inicial:', initialData);
    
    // Enviar arquivo para o endpoint de upload simples
    console.log('\nEnviando arquivo para restauração...');
    const formData = new FormData();
    formData.append('file', new Blob([fs.readFileSync(testFilePath)]), 'teste.fbk');
    formData.append('clienteNome', 'Cliente Teste');
    formData.append('ticketID', '12345');
    
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
    console.log('\nAguardando processamento do arquivo...');
    await sleep(2000);
    
    // Verificar estado do monitoramento após upload
    console.log('\nVerificando estado do monitoramento após upload...');
    const afterMonitoring = await fetch('http://localhost:8558/api/file_monitoring');
    const afterData = await afterMonitoring.json();
    console.log('Estado após upload:', afterData);
    
    // Verificar se o arquivo apareceu no monitoramento
    const hasNewFile = 
      (afterData.activeFiles?.length > initialData.activeFiles?.length) ||
      (afterData.recentlyCompleted?.length > initialData.recentlyCompleted?.length) ||
      (afterData.recentlyFailed?.length > initialData.recentlyFailed?.length);
    
    if (hasNewFile) {
      console.log('\n✅ SUCESSO: O arquivo apareceu no monitoramento!');
    } else {
      console.log('\n❌ FALHA: O arquivo não apareceu no monitoramento.');
      console.log('Isso pode indicar um problema no backend ou na integração com o sistema de monitoramento.');
    }
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log(`\nArquivo de teste removido: ${testFilePath}`);
    
    console.log('\nTeste concluído!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testUploadAndMonitoring();