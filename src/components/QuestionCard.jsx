import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  showResult = false,
  isSubmitted = false,
  language = 'en'
}) => {
  const getOptionClass = (index) => {
    if (!showResult) {
      return selectedOption === index
        ? 'question-option selected'
        : 'question-option';
    }

    // Show results
    if (index === question.correctAnswer) {
      return 'question-option correct';
    }
    if (selectedOption === index && selectedOption !== question.correctAnswer) {
      return 'question-option incorrect';
    }
    return 'question-option opacity-60';
  };

  const getOptionIcon = (index) => {
    if (!showResult) return null;

    if (index === question.correctAnswer) {
      return <CheckCircle className="text-green-500" size={20} />;
    }
    if (selectedOption === index && selectedOption !== question.correctAnswer) {
      return <XCircle className="text-red-500" size={20} />;
    }
    return null;
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="badge-primary">
          Question {questionNumber} of {totalQuestions}
        </span>
        {question.difficulty && (
          <span className={`badge ${
            question.difficulty === 'easy' ? 'badge-success' :
            question.difficulty === 'hard' ? 'badge-danger' :
            'badge-warning'
          }`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className={`mb-6 ${language === 'or' ? 'font-odia' : ''}`}>
        <h3 className="text-lg font-medium text-secondary-800 leading-relaxed">
          {question.question}
        </h3>
        {question.topic && (
          <p className="text-sm text-secondary-500 mt-2">
            Topic: {question.topic}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={!isSubmitted ? { scale: 1.01 } : {}}
            whileTap={!isSubmitted ? { scale: 0.99 } : {}}
            onClick={() => !isSubmitted && onSelectOption(index)}
            disabled={isSubmitted}
            className={`${getOptionClass(index)} ${language === 'or' ? 'font-odia' : ''} w-full text-left flex items-center gap-3`}
          >
            <span className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
              ${selectedOption === index 
                ? showResult 
                  ? index === question.correctAnswer 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                  : 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-600'
              }
            `}>
              {optionLabels[index]}
            </span>
            <span className="flex-1">{option}</span>
            {getOptionIcon(index)}
          </motion.button>
        ))}
      </div>

      {/* Explanation (shown after submission) */}
      {showResult && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-primary-600 flex-shrink-0 mt-0.5" size={20} />
            <div className={language === 'or' ? 'font-odia' : ''}>
              <h4 className="font-semibold text-primary-700 mb-2">Explanation</h4>
              <p className="text-secondary-700 leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Source Label */}
      {question.source && (
        <div className="mt-4 pt-4 border-t border-secondary-100">
          <span className="text-xs text-secondary-400">
            {question.source}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default QuestionCard;
