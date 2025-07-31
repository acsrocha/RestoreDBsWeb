// Script para testar rapidamente se o sistema está funcionando
const http = require('http');

console.log('🔍 Testando sistema RestoreDB...\n');

// Teste 1: Verificar se backend está rodando
function testarBackend() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8558,
            path: '/api/status',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Backend rodando na porta 8080');
                    try {
                        const response = JSON.parse(data);
                        console.log(`📊 Arquivos na fila: ${response.queueCount || 0}`);
                        console.log(`🔄 Processando: ${response.currentProcessing || 'Nenhum'}`);
                    } catch (e) {
                        console.log('⚠️  Backend respondeu mas JSON inválido');
                    }
                } else {
                    console.log(`❌ Backend erro: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', () => {
            console.log('❌ Backend não está rodando na porta 8558');
            console.log('💡 Execute: RestoreDBs_service.exe');
            resolve();
        });
        
        req.end();
    });
}

// Teste 2: Verificar nova API unificada
function testarAPIUnificada() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8558,
            path: '/api/unified_monitoring',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ API Unificada funcionando!');
                    try {
                        const response = JSON.parse(data);
                        console.log(`📈 Total jobs: ${response.stats?.total || 0}`);
                        console.log(`🔄 Ativos: ${response.stats?.processing || 0}`);
                        console.log(`⏳ Na fila: ${response.stats?.queued || 0}`);
                        console.log(`✅ Concluídos: ${response.stats?.completed || 0}`);
                        console.log(`❌ Falhas: ${response.stats?.failed || 0}`);
                    } catch (e) {
                        console.log('⚠️  API respondeu mas JSON inválido');
                    }
                } else {
                    console.log(`❌ API Unificada erro: ${res.statusCode}`);
                    console.log('💡 Tabela file_processing_jobs pode não existir');
                }
                resolve();
            });
        });
        
        req.on('error', () => {
            console.log('❌ Não foi possível conectar à API Unificada');
            resolve();
        });
        
        req.end();
    });
}

async function executarTestes() {
    await testarBackend();
    console.log('');
    await testarAPIUnificada();
    
    console.log('\n🎯 Próximos passos:');
    console.log('1. Se backend não estiver rodando: RestoreDBs_service.exe');
    console.log('2. Se API Unificada falhar: Executar SQL para criar tabela');
    console.log('3. Testar frontend: npm run dev');
    console.log('\n📋 Para criar tabela manualmente:');
    console.log('   Execute: TESTE_SIMPLES.sql no banco SQLite');
}

executarTestes();