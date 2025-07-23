// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * @param value O valor a ser debounced
 * @param delay O tempo de espera em milissegundos
 * @returns O valor após o delay
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura o timer para atualizar o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;