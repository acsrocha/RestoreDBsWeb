import React from 'react'; // Mantido useState se for usar para search futuramente, removido por enquanto
import { FiFilter, FiX } from 'react-icons/fi'; // FiClock removido
// DatePicker e imports relacionados removidos

interface ActivityFiltersProps {
  onSearchChange: (value: string) => void;
  onTypeChange: (type: string) => void;
  // onDateChange: (startDate: string, endDate: string) => void; // Chamada removida, prop pode ser removida se não usada pelo pai
  selectedTypes: string[];
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  onSearchChange,
  onTypeChange,
  // onDateChange, // Removido
  selectedTypes,
}) => {
  // startDate, endDate, handleStartDateChange, handleEndDateChange, CustomInput removidos

  return (
    <div className="activity-filters">
      <div className="search-box">
        <input
          type="text"
          placeholder="Pesquisar nas atividades..."
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="filters-section">
        <div className="filters-labels">
          <div className="filter-group"> {/* Apenas o grupo "Filtrar por tipo" permanece */}
            <FiFilter className="filter-icon" />
            <span>Filtrar por tipo</span>
          </div>
          {/* O grupo do rótulo "Período" foi removido daqui */}
        </div>
        
        <div className="filters-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedTypes.includes('success') ? 'active' : ''}`}
              onClick={() => onTypeChange('success')}
              data-type="success"
            >
              Sucesso
            </button>
            <button
              className={`filter-btn ${selectedTypes.includes('error') ? 'active' : ''}`}
              onClick={() => onTypeChange('error')}
              data-type="error"
            >
              Erro
            </button>
            <button
              className={`filter-btn ${selectedTypes.includes('info') ? 'active' : ''}`}
              onClick={() => onTypeChange('info')}
              data-type="info"
            >
              Info
            </button>
            <button
              className={`filter-btn ${selectedTypes.includes('warning') ? 'active' : ''}`}
              onClick={() => onTypeChange('warning')}
              data-type="warning"
            >
              Aviso
            </button>
          </div>

          {/* A div .period-inputs foi removida daqui */}
        </div>
      </div>
    </div>
  );
};

export default ActivityFilters;