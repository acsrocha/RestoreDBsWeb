// src/pages/RobustUploadPage.tsx
import React from 'react';
import RobustUploadForm from '../components/upload/RobustUploadForm';
import ConnectionStatus from '../components/common/ConnectionStatus';

// Importar estilos
import '../styles/components/ConnectionStatus.css';

const RobustUploadPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload (50GB+)</h1>
        <p className="page-description">
          Use esta página para enviar arquivos de backup grandes (50GB-200GB) com suporte a pausa, retomada e recuperação de falhas.
        </p>
      </div>

      <div className="card">
        <div className="card-content">
          <ConnectionStatus />
          <RobustUploadForm />
        </div>
      </div>

      <div className="info-section">
        <h3>Informações Importantes</h3>
        <div className="connection-notice">
          <strong>Upload em Partes</strong> - Este sistema divide arquivos grandes em partes menores para upload confiável.
          <br/>
          <small>Você pode pausar e retomar o upload a qualquer momento sem perder o progresso.</small>
        </div>
        <ul>
          <li>
            <strong>Tamanho máximo:</strong> Arquivos de até 200GB são suportados
          </li>
          <li>
            <strong>Recuperação automática:</strong> Se o navegador fechar ou a conexão cair, o upload pode ser retomado
          </li>
          <li>
            <strong>Tempo de expiração:</strong> Uploads incompletos ficam disponíveis por até 7 dias para retomada
          </li>
          <li>
            <strong>Tipos de arquivo:</strong> Apenas arquivos .fbk, .gbk e .bt são aceitos
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RobustUploadPage;