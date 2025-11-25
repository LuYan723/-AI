import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-midnight-900 text-white hover:bg-midnight-800 shadow-lg shadow-midnight-900/20 border border-transparent",
    secondary: "bg-white text-midnight-700 border border-midnight-200 hover:border-midnight-300 hover:bg-midnight-50 shadow-sm",
    accent: "bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:shadow-glow hover:to-gold-500 border border-transparent",
    ghost: "text-midnight-600 hover:bg-midnight-50 hover:text-midnight-900",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="tracking-wide">处理中...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};