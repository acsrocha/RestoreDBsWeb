# Notas de Integração com Backend para Upload Robusto

## Erros identificados no backend

```
web\chunked_upload.go:410:22: deps.Cfg.Paths undefined (type config.Config has no field or method Paths)
web\chunked_upload.go:438:34: deps.UploadUseCase.CreateRequest undefined (type *application.UploadBackupUseCase has no field or method CreateRequest)
web\register_handlers_update.go:12:50: deps.Cfg.Paths undefined (type config.Config has no field or method Paths)
web\register_handlers_update.go:38:6: undefined: strings
web\register_handlers_update.go:52:45: undefined: strings
web\register_handlers_update.go:54:44: undefined: strings
web\register_handlers_update.go:56:44: undefined: strings
```

## Correções necessárias no backend

1. Adicionar campo `Paths` à estrutura `config.Config`
2. Adicionar método `CreateRequest` à estrutura `application.UploadBackupUseCase`
3. Importar o pacote `strings` em `register_handlers_update.go`

## Endpoints esperados pelo frontend

O frontend espera os seguintes endpoints para upload em chunks:

- **Inicializar upload**: `POST /api/upload/large/init`
  ```json
  {
    "file_name": "backup.fbk",
    "file_size": 123456789,
    "chunk_size": 26214400,
    "metadata": {
      "clienteNome": "Nome do Cliente",
      "ticketID": "12345",
      "notasTecnico": "Observações"
    }
  }
  ```

- **Enviar chunk**: `POST /api/upload/large/chunk`
  ```
  FormData:
  - upload_id: "abc123"
  - chunk_index: "0"
  - total_chunks: "10"
  - chunk: [binary data]
  - checksum: "md5-hash"
  ```

- **Verificar status**: `GET /api/upload/large/status?uploadId=abc123`

- **Finalizar upload**: `POST /api/upload/large/finalize`
  ```json
  {
    "upload_id": "abc123",
    "file_name": "backup.fbk",
    "file_size": 123456789,
    "metadata": {
      "clienteNome": "Nome do Cliente",
      "ticketID": "12345",
      "notasTecnico": "Observações"
    }
  }
  ```

- **Abortar upload**: `POST /api/upload/large/abort`
  ```json
  {
    "upload_id": "abc123"
  }
  ```

## Formato das respostas esperadas

- **Resposta de inicialização**:
  ```json
  {
    "upload_id": "abc123",
    "chunk_size": 26214400,
    "expires_at": "2023-06-30T15:00:00Z",
    "total_chunks": 10
  }
  ```

- **Resposta de status**:
  ```json
  {
    "upload_id": "abc123",
    "file_name": "backup.fbk",
    "file_size": 123456789,
    "received_chunks": [0, 1, 2],
    "total_chunks": 10,
    "progress": 30,
    "created_at": "2023-06-29T15:00:00Z",
    "expires_at": "2023-06-30T15:00:00Z",
    "status": "uploading"
  }
  ```

- **Resposta de chunk**:
  ```json
  {
    "upload_id": "abc123",
    "chunk_index": 3,
    "received_chunks": 4,
    "total_chunks": 10,
    "progress": 40
  }
  ```

- **Resposta de finalização**:
  ```json
  {
    "upload_id": "abc123",
    "file_name": "backup.fbk",
    "file_size": 123456789,
    "status": "completed",
    "message": "Upload finalizado com sucesso",
    "processed_file_id": "def456"
  }
  ```

## Observações

- O frontend está configurado para usar o modo de simulação enquanto o backend está sendo corrigido
- Para desativar o modo de simulação, altere `SIMULATION_MODE` para `false` no arquivo `src/components/upload/RobustUploadForm.tsx`
- O tamanho padrão de chunk é 25MB, mas pode ser ajustado conforme necessário