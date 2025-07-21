// Script para verificar se o servidor está rodando
import http from 'http';

function checkServer(host, port) {
  console.log(`Verificando servidor em ${host}:${port}...`);
  
  const req = http.request({
    host: host,
    port: port,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Resposta:', data);
      console.log('✅ Servidor está rodando!');
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erro ao conectar com o servidor:', error.message);
    console.log('Verifique se o servidor está rodando na porta correta.');
  });
  
  req.on('timeout', () => {
    console.error('❌ Timeout ao conectar com o servidor');
    req.destroy();
  });
  
  req.end();
}

// Verificar servidor local na porta 8558
checkServer('localhost', 8558);