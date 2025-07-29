// Debug simples para verificar a API de monitoramento
const API_URL = 'http://localhost:8080/api/file_monitoring';

async function testAPI() {
  try {
    console.log('🔍 Testando API:', API_URL);
    
    const response = await fetch(API_URL, {
      headers: {
        'X-API-Key': process.env.RESTOREDB_API_KEY || 'sua-chave-aqui'
      }
    });
    
    console.log('📡 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Dados recebidos:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAPI();