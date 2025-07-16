import React, { useState, useEffect } from 'react';
import { FiServer, FiSave, FiRotateCcw, FiGlobe } from 'react-icons/fi';
import { updateCORSConfig, fetchCORSConfig } from '../services/api';

const STORAGE_KEY = 'restoredb_server_url';
const CORS_STORAGE_KEY = 'restoredb_cors_origins';
const DEFAULT_SERVER = 'http://localhost:8558';
const DEFAULT_CORS = 'http://localhost:5173,http://localhost:3000';

const ServerConfigPage: React.FC = () => {
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER;
  });
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [corsOrigins, setCorsOrigins] = useState(() => {
    return localStorage.getItem(CORS_STORAGE_KEY) || DEFAULT_CORS;
  });
  const [inputCors, setInputCors] = useState(corsOrigins);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isApplyingCORS, setIsApplyingCORS] = useState(false);
  const [backendCORS, setBackendCORS] = useState<string>('');

  // Carrega configuração CORS atual do backend
  useEffect(() => {
    const loadBackendCORS = async () => {
      try {
        const config = await fetchCORSConfig();
        setBackendCORS(config.allowed_origins.join(','));
      } catch (error) {
        console.log('Não foi possível carregar CORS do backend:', error);
      }
    };
    loadBackendCORS();
  }, []);

  const handleSave = () => {
    try {
      new URL(inputUrl); // Valida URL
      const cleanUrl = inputUrl.replace(/\/$/, '');
      setServerUrl(cleanUrl);
      localStorage.setItem(STORAGE_KEY, cleanUrl);
      
      // Salva CORS
      setCorsOrigins(inputCors);
      localStorage.setItem(CORS_STORAGE_KEY, inputCors);
      
      setMessage({type: 'success', text: 'Configurações salvas com sucesso!'});
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({type: 'error', text: 'URL inválida!'});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReset = () => {
    setServerUrl(DEFAULT_SERVER);
    setInputUrl(DEFAULT_SERVER);
    setCorsOrigins(DEFAULT_CORS);
    setInputCors(DEFAULT_CORS);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CORS_STORAGE_KEY);
    setMessage({type: 'success', text: 'Configurações resetadas para padrão!'});
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApplyCORS = async () => {
    setIsApplyingCORS(true);
    try {
      const result = await updateCORSConfig(inputCors);
      setBackendCORS(result.allowed_origins.join(','));
      setMessage({type: 'success', text: 'CORS aplicado no backend com sucesso!'});
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({type: 'error', text: `Erro ao aplicar CORS: ${error.message}`});
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsApplyingCORS(false);
    }
  };

  return (
    <div className="grid-view-fixed-header">
      <div className="admin-areas-header">
        <h2><FiServer /> Configuração do Servidor</h2>
      </div>
      
      <div style={{padding: '20px 0'}}>
        <div className="form-group">
          <label htmlFor="server-url">URL do Servidor Backend</label>
          <input
            type="url"
            id="server-url"
            className="form-control"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:8558"
          />
          <small className="field-description">Exemplo: http://192.168.1.100:8558 ou http://servidor.empresa.com:8558</small>
        </div>

        <div className="form-group">
          <label htmlFor="cors-origins">Origens CORS Permitidas</label>
          <input
            type="text"
            id="cors-origins"
            className="form-control"
            value={inputCors}
            onChange={(e) => setInputCors(e.target.value)}
            placeholder="http://localhost:5173,http://localhost:3000"
          />
          <small className="field-description">URLs separadas por vírgula que podem acessar o backend. Inclua a URL do frontend.</small>
        </div>

        {message && (
          <div className={`upload-status-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div style={{display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap'}}>
          <button onClick={handleSave} className="button-primary">
            <FiSave /> Salvar Local
          </button>
          <button 
            onClick={handleApplyCORS} 
            className="button-primary"
            disabled={isApplyingCORS}
            style={{backgroundColor: 'var(--success-color)'}}
          >
            <FiGlobe /> {isApplyingCORS ? 'Aplicando...' : 'Aplicar CORS no Backend'}
          </button>
          <button onClick={handleReset} className="button-secondary">
            <FiRotateCcw /> Resetar Padrão
          </button>
        </div>

        <div style={{marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px'}}>
          <div><strong>Servidor Atual:</strong> {serverUrl}</div>
          <div style={{marginTop: '8px'}}><strong>CORS Local:</strong> {corsOrigins}</div>
          <div style={{marginTop: '8px'}}><strong>CORS no Backend:</strong> {backendCORS || 'Não carregado'}</div>
          <div style={{marginTop: '8px', fontSize: '0.9em', color: 'var(--text-secondary)'}}>
            ✅ Use "Aplicar CORS no Backend" para configurar automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigPage;