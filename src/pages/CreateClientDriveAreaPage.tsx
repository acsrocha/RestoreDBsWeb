// src/pages/CreateClientDriveAreaPage.tsx

import React from 'react';
import CreateClientDriveAreaForm from '../components/clientDriveArea/CreateClientDriveAreaForm';
import { SiGoogledrive } from 'react-icons/si';
import styles from './CreateClientDriveArea.module.css';

const CreateClientDriveAreaPage: React.FC = () => {
  return (
    <div id="view-cdddreate-client-gdrive-area" className="view active">
      <section
        className={styles.clientDriveAreaCard}
        id="createClientDriveAreaSection"
        aria-labelledby="createClientDriveAreaHeader"
      >
        <h2 id="createClientDriveAreaHeader">
          <SiGoogledrive  style={{ fill: '#01c38e' }}/>
          Preparar Área de Upload para Cliente (Google Drive)
        </h2>
        <p className={styles.pageDescription}>
          Preencha os dados abaixo para criar uma pasta no Google Drive com
          permissão de upload para o cliente, que receberá o link por e-mail.
        </p>
        <CreateClientDriveAreaForm />
      </section>
    </div>
  );
};

export default CreateClientDriveAreaPage;