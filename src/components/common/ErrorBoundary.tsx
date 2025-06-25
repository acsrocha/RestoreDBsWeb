import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    
    // Log adicional para debug
    if (error.message.includes('split')) {
      console.error('ERRO DE SPLIT DETECTADO - Verifique se os dados da API estão corretos');
      console.error('Stack trace:', error.stack);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary-fallback" style={{
          padding: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          margin: '10px 0'
        }}>
          <h2 style={{ color: '#d63031' }}>⚠️ Erro no Componente</h2>
          <p>Um erro inesperado ocorreu ao carregar os dados.</p>
          
          {this.state.error?.message.includes('split') && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '10px', 
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <strong>💡 Possível causa:</strong> Dados inválidos recebidos da API.
              <br />Verifique se o serviço backend está funcionando corretamente.
            </div>
          )}
          
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔍 Detalhes técnicos</summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
              {this.state.error?.stack && `\n\nStack:\n${this.state.error.stack}`}
            </pre>
          </details>
          
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Tentar Novamente
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔃 Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 