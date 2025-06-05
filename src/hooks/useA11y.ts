import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

interface UseA11yProps {
  onAction?: () => void;
  role?: string;
}

export const useA11y = ({ onAction, role = 'button' }: UseA11yProps = {}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onAction?.();
      }
    },
    [onAction]
  );

  const getA11yProps = () => ({
    role,
    tabIndex: 0,
    onKeyDown: onAction ? handleKeyDown : undefined,
    'aria-disabled': !onAction,
  });

  return {
    getA11yProps,
  };
};

// Constantes para roles ARIA comuns
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LIST: 'list',
  LISTITEM: 'listitem',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  REGION: 'region',
} as const;

// Constantes para labels ARIA comuns
export const ARIA_LABELS = {
  CLOSE: 'Fechar',
  OPEN: 'Abrir',
  NEXT: 'Próximo',
  PREVIOUS: 'Anterior',
  SEARCH: 'Pesquisar',
  LOADING: 'Carregando',
  ERROR: 'Erro',
  SUCCESS: 'Sucesso',
  WARNING: 'Aviso',
  INFO: 'Informação',
} as const; 