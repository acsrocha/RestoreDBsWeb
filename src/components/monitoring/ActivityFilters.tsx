import React, { useState } from 'react'
import { FiFilter, FiClock, FiX } from 'react-icons/fi'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'

// Registra o locale pt-BR
registerLocale('pt-BR', ptBR)

interface ActivityFiltersProps {
  onSearchChange: (value: string) => void
  onTypeChange: (type: string) => void
  onDateChange: (startDate: string, endDate: string) => void
  selectedTypes: string[]
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  onSearchChange,
  onTypeChange,
  onDateChange,
  selectedTypes
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date)
    onDateChange(
      date ? format(date, 'dd/MM/yyyy HH:mm') : '',
      endDate ? format(endDate, 'dd/MM/yyyy HH:mm') : ''
    )
  }

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date)
    onDateChange(
      startDate ? format(startDate, 'dd/MM/yyyy HH:mm') : '',
      date ? format(date, 'dd/MM/yyyy HH:mm') : ''
    )
  }

  const CustomInput = React.forwardRef<HTMLInputElement, any>(
    ({ value, onClick, onChange, placeholder }, ref) => (
      <div className='date-input-wrapper'>
        <input
          type='text'
          className='custom-date-input'
          value={value}
          onChange={onChange}
          onClick={onClick}
          placeholder={placeholder}
          ref={ref}
          readOnly
        />
        {value && (
          <button
            type='button'
            className='date-clear-button'
            onClick={e => {
              e.stopPropagation()
              onChange({ target: { value: '' } })
            }}
          >
            <FiX />
          </button>
        )}
      </div>
    )
  )

  return (
    <div className='activity-filters'>
      <div className='search-box'>
        <input
          type='text'
          placeholder='Pesquisar nas atividades...'
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className='filters-section'>
        <div className='filters-labels'>
          <div className='filter-group'>
            <FiFilter className='filter-icon' />
            <span>Filtrar por tipo</span>
          </div>
        </div>

        <div className='filters-controls'>
          <div className='filter-buttons'>
            <button
              className={`filter-btn ${
                selectedTypes.includes('success') ? 'active' : ''
              }`}
              onClick={() => onTypeChange('success')}
            >
              Sucesso
            </button>
            <button
              className={`filter-btn ${
                selectedTypes.includes('error') ? 'active' : ''
              }`}
              onClick={() => onTypeChange('error')}
            >
              Erro
            </button>
            <button
              className={`filter-btn ${
                selectedTypes.includes('info') ? 'active' : ''
              }`}
              onClick={() => onTypeChange('info')}
            >
              Info
            </button>
            <button
              className={`filter-btn ${
                selectedTypes.includes('warning') ? 'active' : ''
              }`}
              onClick={() => onTypeChange('warning')}
            >
              Aviso
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityFilters
