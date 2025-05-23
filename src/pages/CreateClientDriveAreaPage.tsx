// src/pages/CreateClientDriveAreaPage.tsx
import React from 'react'
import CreateClientDriveAreaForm from '../components/clientDriveArea/CreateClientDriveAreaForm' // Ajuste o caminho se necessário
import { FiUserPlus } from 'react-icons/fi'

const CreateClientDriveAreaPage: React.FC = () => {
  return (
    // Usando a classe 'view active' para ocupar o espaço, como em UploadPage.tsx
    <div id='view-create-client-gdrive-area' className='view active'>
      {/* Usando a nova classe de card para esta seção específica */}
      <section
        className='client-drive-area-card'
        id='createClientDriveAreaSection'
        aria-labelledby='createClientDriveAreaHeader'
      >
        <h2 id='createClientDriveAreaHeader'>
          <FiUserPlus />{' '}
          {/* Ícone consistente com o estilo de outros títulos de list-card */}
          Preparar Área de Upload para Cliente (Google Drive)
        </h2>
        <p className='page-description'>
          Preencha os dados abaixo para criar uma pasta no Google Drive com
          permissão de upload para o cliente, que receberá o link por e-mail.
        </p>
        <CreateClientDriveAreaForm />
      </section>
    </div>
  )
}

export default CreateClientDriveAreaPage
