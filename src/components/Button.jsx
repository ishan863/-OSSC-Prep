import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = ''
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 shadow-soft hover:shadow-lg active:scale-[0.98]',
    success: 'bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-soft hover:shadow-lg active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-secondary-100 active:bg-secondary-200 text-secondary-700 font-medium rounded-xl transition-all duration-200'
  };

  const sizes = {
    small: 'py-2 px-3 text-sm min-h-[40px]',
    default: 'py-2.5 sm:py-3 px-4 sm:px-6 min-h-[44px] sm:min-h-[48px]',
    large: 'py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg min-h-[52px]'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        inline-flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full"
          />
          <span className="text-sm sm:text-base">Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
