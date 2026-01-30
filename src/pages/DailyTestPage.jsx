import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Play,
  CheckCircle,
  Target,
  Zap,
  Loader2,
  Sparkles,
  TrendingUp,
  Brain
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMockTestStore } from '../store/mockTestStore';
import { usePracticeStore } from '../store/practiceStore';
import { Card, Button } from '../components';
import { fireConfetti } from '../utils/animations';
import toast from 'react-hot-toast';

const DailyTestPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const { generateDailyTest, checkDailyTestAvailable, getWeakTopics, isLoading } = useMockTestStore();
  const { fetchPracticeHistory } = usePracticeStore();
  
  const [canTakeTest, setCanTakeTest] = useState(true);
  const [previousTests, setPreviousTests] = useState([]);
  const [streak, setStreak] = useState(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);

  useEffect(() => {
    checkAvailability();
    loadPreviousTests();
  }, [user?.id]);

  const checkAvailability = async () => {
    if (!user?.id) return;
    try {
      const available = await checkDailyTestAvailable(user.id);
      setCanTakeTest(available);
    } catch (error) {
      console.error('Check availability error:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const loadPreviousTests = async () => {
    if (!user?.id) return;
    try {
      const history = await fetchPracticeHistory(user.id, 30);
      const dailyTests = history.filter(h => h.type === 'daily');
      setPreviousTests(dailyTests);
      
      // Calculate streak
      calculateStreak(dailyTests);
    } catch (error) {
      console.error('Load history error:', error);
    }
  };

  const calculateStreak = (tests) => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedTests = tests.sort((a, b) => 
      new Date(b.endTime) - new Date(a.endTime)
    );

    for (let i = 0; i < sortedTests.length; i++) {
      const testDate = new Date(sortedTests[i].endTime);
      testDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - testDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak || daysDiff === currentStreak + 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const handleStartTest = async () => {
    try {
      toast.loading('Generating your personalized daily test...', { id: 'daily-gen' });
      
      const weakTopics = await getWeakTopics(user?.id);
      
      const test = await generateDailyTest({
        exam: selectedExam,
        userId: user?.id,
        language: preferredLanguage,
        weakTopics
      });
      
      toast.success('Daily test ready! Let\'s go! 🚀', { id: 'daily-gen' });
      fireConfetti.success();
      navigate(`/mock-test/${test.id}`);
    } catch (error) {
      toast.error('Failed to generate daily test. Please try again.', { id: 'daily-gen' });
      console.error('Generate daily test error:', error);
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completed = previousTests.some(t => {
        const testDate = new Date(t.endTime).toISOString().split('T')[0];
        return testDate === dateStr;
      });
      days.push({
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        completed
      });
    }
    return days;
  };

  if (isCheckingAvailability) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Checking today's test availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Calendar className="text-yellow-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ଦୈନିକ ଟେଷ୍ଟ' : 'Daily Test'}
            </h1>
            <p className="text-secondary-500">
              10 quick questions every day
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Card */}
      <Card className={canTakeTest ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-green-50 border-green-200'}>
        {canTakeTest ? (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4"
            >
              <Zap className="text-yellow-600" size={40} />
            </motion.div>
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              Today's Test is Ready!
            </h2>
            <p className="text-secondary-600 mb-6">
              Take your daily test to maintain your streak and strengthen weak areas
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
              <div className="text-center p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-primary-600">10</p>
                <p className="text-xs text-secondary-500">Questions</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-primary-600">10</p>
                <p className="text-xs text-secondary-500">Minutes</p>
              </div>
              <div className="text-center p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-primary-600">Mix</p>
                <p className="text-xs text-secondary-500">Topics</p>
              </div>
            </div>

            <Button
              onClick={handleStartTest}
              isLoading={isLoading}
              size="large"
              icon={Play}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Start Daily Test
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="text-green-600" size={40} />
            </motion.div>
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              Today's Test Completed! 🎉
            </h2>
            <p className="text-secondary-600 mb-4">
              Great job! Come back tomorrow for your next daily challenge.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/practice')}
            >
              Continue Practicing
            </Button>
          </div>
        )}
      </Card>

      {/* Streak & Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Streak */}
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">Your Streak 🔥</h3>
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-primary-600">{streak}</p>
            <p className="text-secondary-500">days in a row</p>
          </div>
          
          {/* Weekly Calendar */}
          <div className="flex justify-between gap-2">
            {getLast7Days().map((day, index) => (
              <div key={index} className="text-center flex-1">
                <p className="text-xs text-secondary-500 mb-1">{day.day}</p>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                  day.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-secondary-100 text-secondary-400'
                }`}>
                  {day.completed ? '✓' : '○'}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Why Daily Tests */}
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">Why Daily Tests?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Target className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="font-medium text-secondary-800">Targeted Practice</p>
                <p className="text-sm text-secondary-500">Questions focus on your weak areas</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Clock className="text-green-600" size={16} />
              </div>
              <div>
                <p className="font-medium text-secondary-800">Quick & Effective</p>
                <p className="text-sm text-secondary-500">Just 10 minutes of your day</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Zap className="text-yellow-600" size={16} />
              </div>
              <div>
                <p className="font-medium text-secondary-800">Build Consistency</p>
                <p className="text-sm text-secondary-500">Daily practice leads to success</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      {/* Recent Daily Tests */}
      {previousTests.length > 0 && (
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">Recent Daily Tests</h3>
          <div className="space-y-3">
            {previousTests.slice(0, 5).map((test, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => navigate(`/results/${test.id}`)}
              >
                <div>
                  <p className="font-medium text-secondary-800">
                    {new Date(test.endTime).toLocaleDateString('en', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {test.correct}/{test.totalQuestions} correct
                  </p>
                </div>
                <div className={`text-2xl font-bold ${
                  parseFloat(test.accuracy) >= 70 ? 'text-green-600' : 
                  parseFloat(test.accuracy) >= 50 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {test.accuracy}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyTestPage;
