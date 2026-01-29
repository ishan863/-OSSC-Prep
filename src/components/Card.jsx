import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default',
  onClick,
  className = '',
  padding = 'default'
}) => {
  const variants = {
    default: 'card',
    hover: 'card-hover',
    flat: 'bg-white rounded-2xl border border-secondary-100'
  };

  const paddings = {
    none: 'p-0',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`${variants[variant]} ${paddings[padding]} ${className}`}
    >
      {children}
    </Component>
  );
};

export default Card;
