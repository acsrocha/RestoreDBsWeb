# Teste do Fluxo Unificado - Passo a Passo

## 1. Preparar Backend

### A. Executar SQL no banco:
```bash
# Abrir o banco SQLite
sqlite3 C:\RestoreDBs\data\restoredb.db

# Executar o script TESTE_VALIDACAO.sql
.read TESTE_VALIDACAO.sql
.quit
```

### B. Modificar main.go:
- Adicionar inicialização da tabela conforme `MODIFICACAO_MAIN.go`
- Recompilar: `go build -o RestoreDBs_service.exe .\main.go`

### C. Reiniciar serviço:
```bash
.\RestoreDBs_service.exe -service stop
.\RestoreDBs_service.exe -service start
```

## 2. Testar APIs

### A. Testar API Unificada:
```bash
# Verificar se endpoint responde
curl http://localhost:8080/api/unified_monitoring

# Deve retornar dados de teste com stats e jobs
```

### B. Verificar logs:
- Procurar por "Tabela file_processing_jobs inicializada"
- Verificar se não há erros de SQL

## 3. Testar Frontend

### A. Iniciar frontend:
```bash
cd RestoreDBsWeb
npm run dev
```

### B. Verificar telas:

#### Monitoramento Geral (`/monitoring`):
- ✅ Deve mostrar: 1 processando, 1 na fila, 1 falha
- ✅ Cards devem ter números dos dados de teste
- ✅ Fila deve mostrar "backup_fila.fbk"

#### Monitoramento Detalhado (`/detailed-monitoring`):
- ✅ Deve mostrar jobs ativos: downloading, extracting, queued, processing
- ✅ Deve mostrar concluídos: backup_ok.fbk
- ✅ Deve mostrar falhas: backup_erro.fbk

#### Pipeline Unificado:
- ✅ Deve mostrar arquivos em cada estágio
- ✅ Estatísticas devem bater com dados de teste

## 4. Testar Fluxo Real

### A. Criar área cliente de teste:
1. Ir em "Gerenciar Áreas Cliente"
2. Criar nova área
3. Anotar o ID da área

### B. Testar download:
1. Colocar arquivo na pasta do Drive da área
2. Clicar "Download" na área
3. ✅ Verificar se aparece em todas as telas simultaneamente

### C. Verificar banco:
```sql
-- Ver jobs criados pelo download
SELECT * FROM file_processing_jobs WHERE source_type = 'google_drive' ORDER BY created_at DESC LIMIT 5;
```

## 5. Validações Críticas

### ✅ Sincronização:
- Mesmo arquivo deve aparecer em todas as telas
- Status deve ser consistente entre telas
- Contadores devem bater

### ✅ Fluxo Completo:
- Download → Validação → Fila → Processamento
- Status da área cliente deve atualizar
- Job deve persistir no banco

### ✅ Performance:
- APIs devem responder em < 500ms
- Frontend deve atualizar sem travamentos
- Polling deve funcionar suavemente

## 6. Limpeza (se necessário)

```sql
-- Limpar dados de teste
DELETE FROM file_processing_jobs WHERE id LIKE 'test_%';

-- Limpar jobs antigos (opcional)
DELETE FROM file_processing_jobs WHERE created_at < datetime('now', '-7 days');
```

## 7. Problemas Comuns

### Backend não inicia:
- Verificar se tabela foi criada: `SELECT name FROM sqlite_master WHERE type='table' AND name='file_processing_jobs';`
- Verificar logs de erro

### Frontend não mostra dados:
- Verificar console do navegador
- Testar API diretamente: `http://localhost:8080/api/unified_monitoring`
- Verificar CORS

### Dados não sincronizam:
- Verificar se todas as telas usam mesma API
- Verificar intervalo de polling (2 segundos)
- Verificar se backend está atualizando jobs