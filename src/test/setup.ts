import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock para variáveis de ambiente
(window as any).ENV = {
  VITE_APP_RESTOREDB_API_KEY: 'test-api-key'
};

// Mock para matchMedia que não está disponível no JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});