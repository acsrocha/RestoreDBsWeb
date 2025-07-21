// Script para testar os endpoints do backend
// Execute com: node test-endpoints.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8558';
const API_KEY = 'sua_api_key_aqui'; // Substitua pela sua API Key

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Testando ${method} ${url}...`);
  
  const headers = {
    'X-API-Key': API_KEY
  };
  
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log('Resposta:', JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('Resposta (texto):', text);
      }
    } else {
      const text = await response.text();
      console.log('Erro:', text);
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
  
  console.log('-----------------------------------');
}

async function runTests() {
  // Testar endpoint de debug para listar rotas
  await testEndpoint('/api/debug/routes');
  
  // Testar endpoint de status
  await testEndpoint('/api/status');
  
  // Testar endpoint de inicialização de upload
  await testEndpoint('/api/upload/large/init', 'POST', {
    file_name: 'teste.fbk',
    file_size: 1024 * 1024 * 10, // 10MB
    chunk_size: 1024 * 1024, // 1MB
    metadata: {
      clienteNome: 'Cliente Teste',
      ticketID: '12345',
      notasTecnico: 'Teste de upload'
    }
  });
}

runTests().catch(console.error);