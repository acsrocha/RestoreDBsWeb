// Script para definir a URL do servidor no localStorage
// Execute este script no console do navegador para configurar a URL do servidor

function setServerUrl(url) {
  localStorage.setItem('restoredb_server_url', url);
  console.log(`URL do servidor definida como: ${url}`);
  console.log('Recarregue a página para aplicar as alterações.');
}

// Exemplo de uso:
// setServerUrl('http://localhost:8080');
// Para limpar:
// setServerUrl('');

// Definir URL para o servidor local na porta 8080
setServerUrl('http://localhost:8080');