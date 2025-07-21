// Script para testar a conexão com o backend
// Execute este script no console do navegador

async function testBackendConnection() {
  console.log('Testando conexão com o backend...');
  
  try {
    // Teste 1: Verificar se o servidor está respondendo
    console.log('Teste 1: Verificando se o servidor está respondendo...');
    const response = await fetch('/api/health');
    
    if (!response.ok) {
      console.error(`Erro: Servidor respondeu com status ${response.status}`);
      console.log('Resposta:', await response.text());
    } else {
      console.log('✅ Servidor está respondendo!');
      console.log('Resposta:', await response.json());
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com o servidor:', error);
  }
  
  try {
    // Teste 2: Verificar se o servidor está aceitando uploads
    console.log('\nTeste 2: Verificando se o servidor aceita uploads...');
    
    // Criar um pequeno arquivo de teste
    const testFile = new File(['teste'], 'teste.fbk', { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('backupFile', testFile);
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Status:', uploadResponse.status);
    console.log('Resposta:', await uploadResponse.text());
    
    if (uploadResponse.ok) {
      console.log('✅ Servidor está aceitando uploads!');
    } else {
      console.error('❌ Servidor não está aceitando uploads.');
    }
  } catch (error) {
    console.error('❌ Erro ao testar upload:', error);
  }
}

// Executar o teste
testBackendConnection();