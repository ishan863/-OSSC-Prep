import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  current, 
  total, 
  showPercentage = true,
  size = 'default',
  color = 'primary'
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const sizeClasses = {
    small: 'h-1.5',
    default: 'h-2',
    large: 'h-3'
  };

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600'
  };

  return (
    <div className="w-full">
      <div className={`progress-bar ${sizeClasses[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`progress-bar-fill bg-gradient-to-r ${colorClasses[color]}`}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-secondary-500">
            {current} / {total}
          </span>
          <span className="text-xs font-medium text-secondary-600">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
