
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'number' | 'operator' | 'action' | 'equal';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'number', className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'operator':
        return 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/30';
      case 'action':
        return 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border-rose-500/30';
      case 'equal':
        return 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 border-transparent';
      default:
        return 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center text-xl font-medium py-4 rounded-2xl border transition-all duration-200 
        active:scale-95 select-none ${getVariantStyles()} ${className}
      `}
    >
      {label}
    </button>
  );
};

export default Button;
