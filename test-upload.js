// test-upload.js
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
  try {
    console.log('Testando upload de arquivo...');
    
    // Inicializar upload
    const initResponse = await fetch('http://localhost:8558/api/upload/large/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: 'teste.fbk',
        file_size: 1024,
        chunk_size: 1024,
        metadata: {
          clienteNome: 'Cliente Teste',
          ticketID: '12345',
          notasTecnico: 'Teste de upload'
        }
      })
    });
    
    if (!initResponse.ok) {
      throw new Error(`Erro na inicialização: ${initResponse.status} ${initResponse.statusText}`);
    }
    
    const initData = await initResponse.json();
    console.log('Resposta da inicialização:', initData);
    
    // Criar um arquivo de teste
    const testFilePath = path.join(process.cwd(), 'teste.fbk');
    fs.writeFileSync(testFilePath, 'Conteúdo de teste para o arquivo de backup');
    
    // Enviar chunk
    const formData = new FormData();
    formData.append('upload_id', initData.upload_id);
    formData.append('chunk_index', '0');
    formData.append('total_chunks', '1');
    formData.append('chunk', fs.createReadStream(testFilePath));
    formData.append('checksum', 'abc123');
    
    const chunkResponse = await fetch('http://localhost:8558/api/upload/large/chunk', {
      method: 'POST',
      body: formData
    });
    
    if (!chunkResponse.ok) {
      throw new Error(`Erro no envio do chunk: ${chunkResponse.status} ${chunkResponse.statusText}`);
    }
    
    const chunkData = await chunkResponse.json();
    console.log('Resposta do envio do chunk:', chunkData);
    
    // Finalizar upload
    const finalizeResponse = await fetch('http://localhost:8558/api/upload/large/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        upload_id: initData.upload_id,
        file_name: 'teste.fbk',
        file_size: 1024,
        metadata: {
          clienteNome: 'Cliente Teste',
          ticketID: '12345',
          notasTecnico: 'Teste de upload'
        }
      })
    });
    
    if (!finalizeResponse.ok) {
      throw new Error(`Erro na finalização: ${finalizeResponse.status} ${finalizeResponse.statusText}`);
    }
    
    const finalizeData = await finalizeResponse.json();
    console.log('Resposta da finalização:', finalizeData);
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    
    // Verificar monitoramento após upload
    console.log('\nVerificando monitoramento após upload...');
    const monitoringResponse = await fetch('http://localhost:8558/api/file_monitoring');
    
    if (!monitoringResponse.ok) {
      throw new Error(`Erro na resposta: ${monitoringResponse.status} ${monitoringResponse.statusText}`);
    }
    
    const monitoringData = await monitoringResponse.json();
    console.log('Resposta do endpoint de monitoramento:');
    console.log(JSON.stringify(monitoringData, null, 2));
    
    console.log('\nTeste concluído!');
  } catch (error) {
    console.error('Erro ao testar o upload:', error);
  }
}

testUpload();