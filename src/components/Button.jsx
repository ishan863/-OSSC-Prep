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
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 shadow-soft hover:shadow-lg',
    success: 'bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-soft hover:shadow-lg',
    ghost: 'bg-transparent hover:bg-secondary-100 text-secondary-700 font-medium rounded-xl transition-all duration-200'
  };

  const sizes = {
    small: 'py-2 px-4 text-sm',
    default: 'py-3 px-6',
    large: 'py-4 px-8 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        inline-flex items-center justify-center gap-2
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={20} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={20} />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
