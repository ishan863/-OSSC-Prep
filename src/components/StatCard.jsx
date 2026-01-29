import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className = ''
}) => {
  const colors = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-100 text-primary-600',
      text: 'text-primary-600'
    },
    success: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-100 text-yellow-600',
      text: 'text-yellow-600'
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-600'
    }
  };

  const colorConfig = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-secondary-800">{value}</h3>
          {subtitle && (
            <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-secondary-500'
            }`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${colorConfig.icon} flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
