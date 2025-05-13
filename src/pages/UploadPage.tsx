// src/pages/UploadPage.tsx
import React from 'react';
import UploadForm from '../components/upload/UploadForm';
import { FiUploadCloud } from 'react-icons/fi'; // Ícone para o título da página

const UploadPage: React.FC = () => {
  return (
    <div id="view-upload" className="view active"> {/* Garante que a view ocupe o espaço */}
      {/* A classe 'upload-card' já tem 'width: 100%' e 'max-width: 700px' do global.css
          Isso fará com que o card ocupe 100% da largura até um máximo de 700px,
          e então será centralizado devido ao margin: auto.
          A classe 'list-card' também é aplicada para o estilo base do card.
      */}
      <section className="list-card upload-card" id="uploadSection" aria-labelledby="uploadHeader">
        <h2 id="uploadHeader">
          <span className="icon"><FiUploadCloud /></span>
          Upload de Novo Backup para Restauração
        </h2>
        <UploadForm />
      </section>
    </div>
  );
};

export default UploadPage;