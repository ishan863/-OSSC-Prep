import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

const Timer = ({ seconds, isWarning = false, isDanger = false }) => {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (isDanger || seconds <= 60) return 'timer-danger';
    if (isWarning || seconds <= 300) return 'timer-warning';
    return 'text-secondary-700';
  };

  return (
    <motion.div
      animate={isDanger || seconds <= 60 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-soft ${getTimerClass()}`}
    >
      {seconds <= 60 ? (
        <AlertTriangle size={20} className="animate-pulse" />
      ) : (
        <Clock size={20} />
      )}
      <span className="font-mono font-bold text-lg">
        {formatTime(seconds)}
      </span>
    </motion.div>
  );
};

export default Timer;
