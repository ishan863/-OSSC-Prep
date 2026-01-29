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
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Card, StatCard, ProgressBar } from '../components';
import { getSyllabus, getTotalTopicsCount } from '../data/syllabus';
import { getUserStats, getWeakTopics, getRecommendations } from '../services/analyticsService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const syllabus = getSyllabus(selectedExam);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

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
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card gradient-bg text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm mb-1">{getGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {user?.name} 👋
            </h1>
            <p className="text-primary-100">
              {selectedExam === 'RI' ? 'Revenue Inspector' : 'Assistant Inspector'} Exam Preparation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/syllabus')}
              icon={BookOpen}
            >
              View Syllabus
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="Correct Answers"
          value={stats?.correctAnswers || 0}
          icon={Award}
          color="primary"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-secondary-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className={`w-12 h-12 rounded-xl bg-${action.color === 'primary' ? 'primary' : action.color === 'success' ? 'green' : 'yellow'}-100 flex items-center justify-center mb-4`}>
                  <action.icon className={`text-${action.color === 'primary' ? 'primary' : action.color === 'success' ? 'green' : 'yellow'}-600`} size={24} />
                </div>
                <h3 className="font-semibold text-secondary-800 mb-1">{action.title}</h3>
                <p className="text-sm text-secondary-500">{action.description}</p>
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
    </div>
  );
};

export default DashboardPage;
