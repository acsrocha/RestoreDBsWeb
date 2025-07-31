// Script para testar rapidamente a API unificada
// Executar: node verificar_api.js

const http = require('http');

function testarAPI() {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/unified_monitoring',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ API Unificada funcionando!');
                console.log('📊 Estatísticas:', response.stats);
                console.log('🔄 Jobs ativos:', response.activeJobs.length);
                console.log('✅ Jobs concluídos:', response.recentlyCompleted.length);
                console.log('❌ Jobs com falha:', response.recentlyFailed.length);
                
                if (response.stats.total > 0) {
                    console.log('🎉 Dados de teste encontrados!');
                } else {
                    console.log('⚠️  Nenhum dado encontrado - executar SQL de teste');
                }
            } catch (e) {
                console.log('❌ Resposta inválida:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.log('❌ Erro ao conectar:', e.message);
        console.log('💡 Verificar se o backend está rodando na porta 8080');
    });

    req.end();
}

console.log('🔍 Testando API Unificada...');
testarAPI();