import React from 'react';
import { useA11y } from '../../hooks/useA11y';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({ 
  targetId, 
  label = 'Pular para o conteúdo principal' 
}) => {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { getA11yProps } = useA11y({ 
    onAction: handleClick,
    role: 'link'
  });

  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      {...getA11yProps()}
    >
      {label}
    </a>
  );
};

export default SkipLink; 