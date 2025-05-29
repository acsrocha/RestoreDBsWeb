// src/components/common/DriveCycleIndicator.tsx
import React, { useMemo } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface DriveCycleIndicatorProps {
  cycleDurationMinutes: number;
  timeLeftSeconds: number; // Prop para receber o tempo restante atual
}

const DriveCycleIndicator: React.FC<DriveCycleIndicatorProps> = ({
  cycleDurationMinutes,
  timeLeftSeconds,
}) => {
  // A lógica do timer (useState, useEffect) foi completamente removida.
  // O componente agora é 'burro', apenas exibe o que recebe.

  const cycleDurationSeconds = useMemo(() => {
    // Retorna 1 se a duração for 0 para evitar divisão por zero
    return cycleDurationMinutes > 0 ? cycleDurationMinutes * 60 : 1;
  }, [cycleDurationMinutes]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  const radius = 22;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // O cálculo agora usa diretamente as props recebidas
  const progress = timeLeftSeconds / cycleDurationSeconds;
  const strokeDashoffset = circumference * (1 - progress);
  const tooltipText = `Próxima verificação em ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary-color)' }}
      title={tooltipText}
    >
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          <circle stroke="var(--border-color-light, var(--border-color))" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke="var(--accent-color, var(--primary-accent-color))"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset: strokeDashoffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 2px var(--accent-color, var(--primary-accent-color)))' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <FiRefreshCw size={16} style={{ animation: timeLeftSeconds > 0 ? 'spin 2s linear infinite' : 'none', color: timeLeftSeconds > 0 ? 'var(--accent-color, var(--primary-accent-color))' : 'var(--text-disabled-color, #888)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.3' }}>
        <span style={{ fontSize: '0.9em', fontWeight: 600, color: 'var(--text-color)', fontVariantNumeric: 'tabular-nums' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span style={{ fontSize: '0.75em', color: 'var(--text-secondary-color)' }}>
            Próxima Verificação
        </span>
      </div>
    </div>
  );
};

export default DriveCycleIndicator;