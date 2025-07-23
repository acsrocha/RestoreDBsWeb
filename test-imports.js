// test-imports.js
// Este script verifica se os arquivos estão sendo importados corretamente

import * as fileMonitoringTypes from './src/types/fileMonitoring.js';
import * as fileMonitoringApi from './src/services/fileMonitoringApi.js';
import * as mockFileMonitoring from './src/services/mockFileMonitoring.js';

console.log('Verificando importações...');

// Verificar tipos
console.log('Tipos disponíveis em fileMonitoring.ts:');
console.log(Object.keys(fileMonitoringTypes));

// Verificar API
console.log('Funções disponíveis em fileMonitoringApi.ts:');
console.log(Object.keys(fileMonitoringApi));

// Verificar mock
console.log('Funções disponíveis em mockFileMonitoring.ts:');
console.log(Object.keys(mockFileMonitoring));

console.log('Verificação concluída!');