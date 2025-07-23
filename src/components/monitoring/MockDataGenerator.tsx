// src/components/monitoring/MockDataGenerator.tsx
import React, { useState } from 'react';
import type { FileProcessingDetail, FileProcessingStage, FileProcessingStep } from '../../types/fileMonitoring';

interface MockDataGeneratorProps {
  onGenerateData: (data: FileProcessingDetail) => void;
}

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onGenerateData }) => {
  const [fileName, setFileName] = useState('teste.fbk');
  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed'>('processing');

  const generateMockData = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const mockStep1: FileProcessingStep = {
      id: 'step1',
      timestamp: fiveMinutesAgo.toISOString(),
      status: 'completed',
      message: 'Arquivo recebido',
      details: 'Arquivo recebido com sucesso',
      duration: 1000
    };
    
    const mockStep2: FileProcessingStep = {
      id: 'step2',
      timestamp: new Date(fiveMinutesAgo.getTime() + 1 * 60 * 1000).toISOString(),
      status: 'completed',
      message: 'Validação concluída',
      details: 'Arquivo validado com sucesso',
      duration: 2000
    };
    
    const mockStep3: FileProcessingStep = {
      id: 'step3',
      timestamp: new Date(fiveMinutesAgo.getTime() + 2 * 60 * 1000).toISOString(),
      status: status === 'processing' ? 'in_progress' : status === 'completed' ? 'completed' : 'failed',
      message: status === 'failed' ? 'Falha na restauração' : 'Restauração em andamento',
      details: status === 'failed' ? 'Erro ao restaurar o banco de dados' : 'Restaurando banco de dados',
      duration: status === 'completed' ? 3000 : undefined
    };
    
    const mockStage1: FileProcessingStage = {
      id: 'stage1',
      name: 'Recebimento',
      description: 'Recebimento do arquivo',
      status: 'completed',
      startTime: fiveMinutesAgo.toISOString(),
      endTime: new Date(fiveMinutesAgo.getTime() + 1 * 60 * 1000).toISOString(),
      steps: [mockStep1],
      progress: 100
    };
    
    const mockStage2: FileProcessingStage = {
      id: 'stage2',
      name: 'Validação',
      description: 'Validação do arquivo',
      status: 'completed',
      startTime: new Date(fiveMinutesAgo.getTime() + 1 * 60 * 1000).toISOString(),
      endTime: new Date(fiveMinutesAgo.getTime() + 2 * 60 * 1000).toISOString(),
      steps: [mockStep2],
      progress: 100
    };
    
    const mockStage3: FileProcessingStage = {
      id: 'stage3',
      name: 'Restauração',
      description: 'Restauração do banco de dados',
      status: status === 'processing' ? 'in_progress' : status === 'completed' ? 'completed' : 'failed',
      startTime: new Date(fiveMinutesAgo.getTime() + 2 * 60 * 1000).toISOString(),
      endTime: status === 'processing' ? undefined : now.toISOString(),
      steps: [mockStep3],
      progress: status === 'processing' ? 50 : 100
    };
    
    const mockData: FileProcessingDetail = {
      fileId: `mock-${Date.now()}`,
      fileName: fileName,
      originalPath: `D:\\RestoresdbRepo\\Backups_Fila\\${fileName}`,
      sourceType: 'upload',
      status: status,
      createdAt: fiveMinutesAgo.toISOString(),
      startedAt: fiveMinutesAgo.toISOString(),
      completedAt: status === 'processing' ? undefined : now.toISOString(),
      stages: [mockStage1, mockStage2, mockStage3],
      overallProgress: status === 'processing' ? 70 : 100,
      currentStage: status === 'processing' ? 'stage3' : undefined,
      error: status === 'failed' ? 'Erro ao restaurar o banco de dados' : undefined
    };
    
    onGenerateData(mockData);
  };

  return (
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Gerador de Dados de Teste</h3>
      <p>Use esta ferramenta para gerar dados de teste para o monitoramento.</p>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Nome do arquivo:
          <input 
            type="text" 
            value={fileName} 
            onChange={(e) => setFileName(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Status:
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="queued">Na fila</option>
            <option value="processing">Em processamento</option>
            <option value="completed">Concluído</option>
            <option value="failed">Falha</option>
          </select>
        </label>
      </div>
      
      <button 
        onClick={generateMockData}
        style={{ padding: '5px 10px' }}
      >
        Gerar Dados de Teste
      </button>
    </div>
  );
};

export default MockDataGenerator;