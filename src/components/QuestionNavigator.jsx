import React from 'react';
import { motion } from 'framer-motion';

const QuestionNavigator = ({
  totalQuestions,
  currentIndex,
  answers,
  onNavigate,
  showStatus = true
}) => {
  const getButtonClass = (index) => {
    const answer = answers[index];
    const isCurrent = index === currentIndex;
    
    if (isCurrent) {
      return 'bg-primary-600 text-white border-primary-600';
    }
    
    if (showStatus && answer !== undefined) {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    
    return 'bg-white text-secondary-600 border-secondary-200 hover:border-primary-400';
  };

  return (
    <div className="card">
      <h4 className="font-semibold text-secondary-700 mb-4">Question Navigator</h4>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(i)}
            className={`
              w-8 h-8 rounded-lg border-2 font-medium text-sm
              transition-all duration-200
              ${getButtonClass(i)}
            `}
          >
            {i + 1}
          </motion.button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-secondary-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-600" />
          <span className="text-xs text-secondary-500">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span className="text-xs text-secondary-500">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-secondary-200" />
          <span className="text-xs text-secondary-500">Not Answered</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
