import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  ArrowLeft,
  RotateCcw,
  Home,
  Loader2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePracticeStore } from '../store/practiceStore';
import { Card, Button, QuestionCard, Modal } from '../components';

const ResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, preferredLanguage, updateStats } = useAuthStore();
  const { getSessionResults } = usePracticeStore();
  
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      // Try to get results from location state first (passed from session)
      if (location.state?.results) {
        setResults(location.state.results);
      } else {
        // Fetch from database
        const data = await getSessionResults(sessionId);
        setResults(data);
      }
    } catch (error) {
      console.error('Load results error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (percentage) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return { title: 'Excellent! 🏆', message: 'Outstanding performance! Keep it up!' };
    if (percentage >= 80) return { title: 'Great Job! 🌟', message: 'You\'re doing really well!' };
    if (percentage >= 70) return { title: 'Good Work! 👍', message: 'Solid performance, keep practicing!' };
    if (percentage >= 60) return { title: 'Not Bad! 💪', message: 'You\'re on the right track.' };
    if (percentage >= 50) return { title: 'Keep Trying! 📚', message: 'More practice will help.' };
    return { title: 'Don\'t Give Up! 💡', message: 'Review the concepts and try again.' };
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-800 mb-2">Results Not Found</h2>
          <p className="text-secondary-500 mb-6">Unable to find results for this session</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const {
    totalQuestions = 0,
    correct = 0,
    wrong = 0,
    unanswered = 0,
    accuracy = 0,
    timeTaken = 0,
    questions = [],
    subjectWise = {},
    type = 'practice'
  } = results;

  const percentage = parseFloat(accuracy) || (correct / totalQuestions * 100) || 0;
  const scoreInfo = getScoreMessage(percentage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-secondary-500 hover:text-secondary-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`bg-gradient-to-r ${getScoreGradient(percentage)} text-white overflow-hidden relative`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
          
          <div className="relative z-10 text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.3 }}
              className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
            >
              <Trophy size={48} />
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-2">{scoreInfo.title}</h1>
            <p className="text-white/80 mb-6">{scoreInfo.message}</p>
            
            <div className="text-6xl font-bold mb-2">
              {percentage.toFixed(1)}%
            </div>
            <p className="text-white/80">
              {correct} out of {totalQuestions} correct
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-sm text-secondary-500">Correct</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
              <XCircle className="text-red-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-red-600">{wrong}</p>
            <p className="text-sm text-secondary-500">Wrong</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{unanswered}</p>
            <p className="text-sm text-secondary-500">Skipped</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="text-blue-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}
            </p>
            <p className="text-sm text-secondary-500">Time Taken</p>
          </Card>
        </motion.div>
      </div>

      {/* Subject Wise Analysis */}
      {Object.keys(subjectWise).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-primary-600" size={20} />
              <h3 className="font-bold text-secondary-800">Subject-wise Performance</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(subjectWise).map(([subject, data]) => {
                const subjectPercentage = data.total > 0 ? (data.correct / data.total * 100) : 0;
                return (
                  <div key={subject} className="p-4 bg-secondary-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-secondary-800">{subject}</span>
                      <span className={`font-bold ${getScoreColor(subjectPercentage)}`}>
                        {subjectPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-secondary-500">
                        {data.correct}/{data.total} correct
                      </span>
                    </div>
                    <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subjectPercentage}%` }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className={`h-full ${
                          subjectPercentage >= 80 ? 'bg-green-500' :
                          subjectPercentage >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Review Questions Button */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-secondary-800">Review Answers</h3>
                <p className="text-sm text-secondary-500">
                  Go through each question with explanations
                </p>
              </div>
              <Button 
                onClick={() => setShowQuestionsModal(true)}
                icon={Eye}
              >
                Review All
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          icon={Home}
        >
          Dashboard
        </Button>
        
        {type === 'practice' && (
          <Button
            variant="outline"
            onClick={() => navigate('/practice')}
            icon={RotateCcw}
          >
            Practice More
          </Button>
        )}
        
        {type === 'mock' && (
          <Button
            onClick={() => navigate('/mock-test')}
            icon={Target}
          >
            Try Another Test
          </Button>
        )}
        
        {wrong > 0 && (
          <Button
            onClick={() => navigate('/wrong-questions')}
            className="bg-red-500 hover:bg-red-600"
          >
            Review Wrong Answers
          </Button>
        )}
      </motion.div>

      {/* Questions Review Modal */}
      <Modal
        isOpen={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        title="Review Questions"
        size="large"
      >
        <div className="space-y-4">
          {/* Question Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="small"
              disabled={selectedQuestionIndex === 0}
              onClick={() => setSelectedQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-secondary-600">
              {selectedQuestionIndex + 1} of {questions.length}
            </span>
            <Button
              variant="outline"
              size="small"
              disabled={selectedQuestionIndex === questions.length - 1}
              onClick={() => setSelectedQuestionIndex(prev => prev + 1)}
            >
              Next
            </Button>
          </div>

          {/* Question */}
          {questions[selectedQuestionIndex] && (
            <QuestionCard
              question={questions[selectedQuestionIndex]}
              questionNumber={selectedQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedOption={questions[selectedQuestionIndex].userAnswer}
              showResult={true}
              isSubmitted={true}
              language={preferredLanguage}
            />
          )}

          {/* Quick Jump */}
          <div className="flex flex-wrap gap-2 mt-4">
            {questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setSelectedQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  index === selectedQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : q.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : q.userAnswer !== undefined
                    ? 'bg-red-100 text-red-700'
                    : 'bg-secondary-100 text-secondary-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResultsPage;
