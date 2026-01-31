import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ClipboardList, 
  Award, 
  Calendar,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Key,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  Database
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Card, StatCard, ProgressBar, Modal, Input } from '../components';
import { getSyllabus, getTotalTopicsCount } from '../data/syllabus';
import { getUserStats, getWeakTopics, getRecommendations } from '../services/analyticsService';
import { saveAPIKey, isAPIConfigured } from '../config/openrouter.config';
import { getQuestionStats } from '../services/firestoreQuestionsService';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionBankStats, setQuestionBankStats] = useState(null);
  
  // API Key setup states
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Default true to avoid flash
  const [apiKeyDismissed, setApiKeyDismissed] = useState(false);

  const syllabus = getSyllabus(selectedExam);

  useEffect(() => {
    loadDashboardData();
    // Load question bank stats
    const qStats = getQuestionStats();
    setQuestionBankStats(qStats);
  }, [user?.id]);

  // Check API key status on load
  useEffect(() => {
    const configured = isAPIConfigured();
    setHasApiKey(configured);
    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('api_key_prompt_dismissed');
    setApiKeyDismissed(!!dismissed);
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      const [userStats, weak, recs] = await Promise.all([
        getUserStats(user.id),
        getWeakTopics(user.id),
        getRecommendations(user.id)
      ]);
      
      setStats(userStats);
      setWeakTopics(weak.slice(0, 5));
      setRecommendations(recs.slice(0, 3));
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle API key save
  const handleSaveAPIKey = () => {
    if (apiKey && apiKey.startsWith('sk-or-') && apiKey.length > 20) {
      saveAPIKey(apiKey);
      setHasApiKey(true);
      setShowAPIModal(false);
      toast.success('API Key saved! AI features are now enabled.');
    } else {
      toast.error('Invalid API key. It should start with sk-or-');
    }
  };

  // Dismiss API key prompt
  const dismissAPIPrompt = () => {
    setApiKeyDismissed(true);
    localStorage.setItem('api_key_prompt_dismissed', 'true');
  };

  const quickActions = [
    {
      title: 'Practice Now',
      titleOdia: 'ଅଭ୍ୟାସ କରନ୍ତୁ',
      description: 'Topic-wise practice questions',
      icon: ClipboardList,
      color: 'primary',
      path: '/practice'
    },
    {
      title: 'Mock Test',
      titleOdia: 'ମକ୍ ଟେଷ୍ଟ',
      description: '100 questions, 90 minutes',
      icon: Award,
      color: 'success',
      path: '/mock-test'
    },
    {
      title: 'Daily Test',
      titleOdia: 'ଦୈନିକ ଟେଷ୍ଟ',
      description: '10 quick questions daily',
      icon: Calendar,
      color: 'warning',
      path: '/daily-test'
    },
    {
      title: 'AI Tutor',
      titleOdia: 'AI ଶିକ୍ଷକ',
      description: 'Chat with AI assistant',
      icon: MessageSquare,
      color: 'primary',
      path: '/chatbot'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return preferredLanguage === 'or' ? 'ସୁପ୍ରଭାତ' : 'Good Morning';
    if (hour < 17) return preferredLanguage === 'or' ? 'ଶୁଭ ଅପରାହ୍ନ' : 'Good Afternoon';
    return preferredLanguage === 'or' ? 'ଶୁଭ ସନ୍ଧ୍ୟା' : 'Good Evening';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card gradient-bg text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-primary-100 text-xs sm:text-sm mb-1">{getGreeting()}</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
              {user?.name} 👋
            </h1>
            <p className="text-primary-100 text-sm sm:text-base">
              {selectedExam === 'RI' ? 'Revenue Inspector' : 'Assistant Inspector'} Exam Preparation
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 mt-2 md:mt-0">
            <Button
              variant="secondary"
              onClick={() => navigate('/syllabus')}
              icon={BookOpen}
              className="text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-6"
            >
              <span className="hidden sm:inline">View </span>Syllabus
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Questions Practiced"
          value={stats?.totalQuestions || 0}
          icon={Target}
          color="primary"
        />
        <StatCard
          title="Accuracy"
          value={`${stats?.overallAccuracy || 0}%`}
          icon={TrendingUp}
          color={parseFloat(stats?.overallAccuracy || 0) >= 60 ? 'success' : 'warning'}
        />
        <StatCard
          title="Tests Completed"
          value={stats?.totalAttempts || 0}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Question Bank"
          value={questionBankStats?.total || 0}
          icon={Database}
          color="primary"
        />
      </div>

      {/* Question Bank Stats */}
      {questionBankStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">
              📚 Question Bank: {questionBankStats.total.toLocaleString()} Questions
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(questionBankStats.bySubject)
              .sort((a, b) => b[1] - a[1])
              .map(([subject, count]) => (
                <div key={subject} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-secondary-500 truncate" title={subject}>
                    {subject.replace('and', '&')}
                  </p>
                  <p className="text-lg font-bold text-green-700">{count}</p>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-secondary-800 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                variant="hover"
                onClick={() => navigate(action.path)}
                className="h-full"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${action.color === 'primary' ? 'primary' : action.color === 'success' ? 'green' : 'yellow'}-100 flex items-center justify-center mb-2 sm:mb-4`}>
                  <action.icon className={`text-${action.color === 'primary' ? 'primary' : action.color === 'success' ? 'green' : 'yellow'}-600`} size={20} />
                </div>
                <h3 className="font-semibold text-secondary-800 text-sm sm:text-base mb-0.5 sm:mb-1">{action.title}</h3>
                <p className="text-xs sm:text-sm text-secondary-500 hidden sm:block">{action.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress & Recommendations Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Syllabus Progress */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-800">Syllabus Progress</h3>
            <Button
              variant="ghost"
              size="small"
              onClick={() => navigate('/syllabus')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {syllabus.subjects.slice(0, 4).map((subject, index) => (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">{subject.name}</span>
                  <span className="text-xs text-secondary-500">{subject.topics.length} topics</span>
                </div>
                <ProgressBar
                  current={Math.floor(Math.random() * subject.topics.length)}
                  total={subject.topics.length}
                  showPercentage={false}
                  size="small"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Weak Topics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-800">Focus Areas</h3>
            <Button
              variant="ghost"
              size="small"
              onClick={() => navigate('/wrong-questions')}
            >
              Practice
            </Button>
          </div>
          {weakTopics.length > 0 ? (
            <div className="space-y-3">
              {weakTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <span className="text-sm font-medium text-secondary-700">{topic.topic}</span>
                  <span className="text-xs text-red-600 font-medium">{topic.accuracy}% accuracy</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <Target className="mx-auto mb-3 text-secondary-300" size={40} />
              <p>Start practicing to see your focus areas</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">AI Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  rec.priority === 'high' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <RefreshCw className={rec.priority === 'high' ? 'text-red-500' : 'text-yellow-500'} size={20} />
                  <div>
                    <p className="font-medium text-secondary-800">{rec.message}</p>
                    <Button
                      variant="ghost"
                      size="small"
                      className="mt-2"
                      onClick={() => navigate('/practice')}
                    >
                      Practice Now →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-secondary-800">Recent Activity</h3>
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </Button>
        </div>
        <div className="text-center py-8 text-secondary-500">
          <Clock className="mx-auto mb-3 text-secondary-300" size={40} />
          <p>Your recent test attempts will appear here</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/practice')}
          >
            Start Your First Practice
          </Button>
        </div>
      </Card>

      {/* API Key Setup Banner - Show if no API key and not dismissed */}
      {!hasApiKey && !apiKeyDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40"
        >
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl border-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Key size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">Enable AI Features</h4>
                <p className="text-sm text-primary-100 mb-3">
                  Add your free OpenRouter API key to unlock AI chatbot, explanations & translations
                </p>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setShowAPIModal(true)}
                    className="text-primary-600"
                  >
                    Setup Now
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={dismissAPIPrompt}
                    className="text-white/80 hover:text-white"
                  >
                    Later
                  </Button>
                </div>
              </div>
              <button 
                onClick={dismissAPIPrompt}
                className="text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* API Key Setup Modal */}
      <Modal
        isOpen={showAPIModal}
        onClose={() => setShowAPIModal(false)}
        title="Setup AI API Key"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Why do I need an API key?</p>
                <p className="text-blue-600">
                  This enables AI-powered features like the chatbot, question explanations, and Odia translations. 
                  Your key is stored locally in your browser - never on our servers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-3 pr-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
            <p className="font-medium text-secondary-700">How to get your FREE API key:</p>
            <ol className="text-sm text-secondary-600 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">openrouter.ai</a></li>
              <li>Sign up with Google (free)</li>
              <li>Go to "Keys" section</li>
              <li>Create a new key (no credit required)</li>
              <li>Copy and paste it here</li>
            </ol>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <ExternalLink size={16} />
              Open OpenRouter Keys Page
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAPIModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAPIKey}
              disabled={!apiKey || apiKey.length < 20}
              className="flex-1"
            >
              Save API Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
