import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading...', subtitle = 'OSSC Exam Prep' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center px-6"
      >
        {/* Animated Logo */}
        <div className="relative mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>
          
          {/* Sparkle effects */}
          <motion.div
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: 0 
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <motion.div
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: 0.5 
            }}
            className="absolute -bottom-1 -left-2"
          >
            <Sparkles className="w-5 h-5 text-primary-400" />
          </motion.div>
        </div>

        {/* Loading spinner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"
        />

        {/* Text */}
        <motion.h2 
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl font-semibold text-secondary-700"
        >
          {message}
        </motion.h2>
        <p className="text-secondary-500 mt-2">{subtitle}</p>

        {/* Loading dots */}
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-2 h-2 bg-primary-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// AI Generation Loading Component
export const AIGeneratingLoader = ({ 
  progress = 0, 
  status = 'Generating...',
  topicName = ''
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full px-6"
      >
        {/* AI Icon with animation */}
        <div className="relative mb-6">
          <motion.div 
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(37, 99, 235, 0.4)',
                '0 0 0 20px rgba(37, 99, 235, 0)',
                '0 0 0 0 rgba(37, 99, 235, 0)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>
          
          {/* AI badge */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md"
          >
            <span className="text-white text-xs font-bold">AI</span>
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-secondary-800 mb-2">
          Generating Questions...
        </h2>
        <p className="text-secondary-500 mb-6">
          {status}
        </p>

        {/* Progress Bar with glow effect */}
        <div className="relative w-full bg-secondary-100 rounded-full h-4 mb-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-blue-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <p className="text-sm text-secondary-400">
          {progress}% Complete
        </p>

        {/* Tips */}
        {topicName && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100"
          >
            <p className="text-sm text-primary-700">
              💡 <strong>Tip:</strong> Questions are generated based on OSSC syllabus for <strong>{topicName}</strong>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
