import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold text-secondary-700">Loading...</h2>
        <p className="text-secondary-500 mt-2">OSSC Exam Prep</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
