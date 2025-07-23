# Guia de Solução de Problemas - Monitoramento de Arquivos

Este guia ajudará você a resolver problemas comuns relacionados ao monitoramento de arquivos no sistema RestoreDBs.

## Problema: Arquivos não aparecem no painel de monitoramento

Se você enviou um banco de dados para restauração e ele não aparece no painel de monitoramento, siga estas etapas para diagnosticar e resolver o problema:

### 1. Verificar se o backend está funcionando corretamente

- Clique no botão "Verificar API Diretamente" na seção de diagnóstico
- Verifique se a resposta contém os arrays `activeFiles`, `recentlyCompleted` e `recentlyFailed`
- Se a API retornar erro, verifique se o backend está em execução na porta 8558

### 2. Verificar se o backend está configurado corretamente

- Use o componente "Diagnóstico do Backend" para verificar a configuração do backend
- Verifique se o diretório de monitoramento está configurado corretamente
- Verifique se há arquivos na fila de processamento

### 3. Testar o upload de um arquivo

- Clique no botão "Teste de Diagnóstico" para enviar um arquivo de teste
- Verifique se o arquivo aparece no painel de monitoramento
- Se o arquivo não aparecer, verifique os logs do backend para erros

### 4. Verificar o diretório monitorado

- Execute o script `check-monitoring-directory.js` para verificar o diretório monitorado
- Verifique se há arquivos .fbk no diretório
- Verifique se o backend tem permissões para acessar o diretório

### 5. Usar dados de teste para verificar o frontend

- Use o componente "Gerador de Dados de Teste" para gerar dados de teste
- Verifique se os dados de teste aparecem corretamente no painel
- Se os dados de teste aparecerem, mas os dados reais não, o problema está no backend

## Soluções Comuns

### O backend não está registrando os arquivos no sistema de monitoramento

- Verifique se o backend está implementando corretamente o endpoint `/api/file_monitoring`
- Verifique se o backend está registrando os arquivos enviados para restauração
- Verifique os logs do backend para erros relacionados ao monitoramento

### O frontend não está recebendo os dados do backend

- Verifique se o proxy CORS está configurado corretamente no arquivo `vite.config.ts`
- Verifique se o frontend está fazendo a requisição corretamente
- Use as ferramentas de desenvolvedor do navegador para verificar se há erros de rede

### O frontend não está exibindo os dados recebidos

- Verifique se os dados estão sendo recebidos corretamente no console do navegador
- Verifique se os componentes estão renderizando corretamente
- Use o componente "Gerador de Dados de Teste" para verificar se o frontend está funcionando

## Verificação Final

Se você seguiu todas as etapas acima e ainda está tendo problemas, tente:

1. Reiniciar o backend
2. Limpar o cache do navegador
3. Verificar se há atualizações disponíveis para o sistema
4. Entrar em contato com o suporte técnico