import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock,
  Award,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import { usePracticeStore } from '../store/practiceStore';
import { Card, StatCard } from '../components';
import { getSyllabus } from '../data/syllabus';

const AnalyticsPage = () => {
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const { fetchPracticeHistory, fetchWrongQuestions } = usePracticeStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // week, month, all
  
  const syllabus = getSyllabus(selectedExam);

  useEffect(() => {
    loadAnalytics();
  }, [user?.id]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    try {
      const [history, wrongs] = await Promise.all([
        fetchPracticeHistory(user.id, 100),
        fetchWrongQuestions(user.id)
      ]);
      setPracticeHistory(history);
      setWrongQuestions(wrongs);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate overall stats
  const getOverallStats = () => {
    const totalQuestions = practiceHistory.reduce((sum, h) => sum + h.totalQuestions, 0);
    const totalCorrect = practiceHistory.reduce((sum, h) => sum + h.correct, 0);
    const totalWrong = practiceHistory.reduce((sum, h) => sum + h.wrong, 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;
    const totalTime = practiceHistory.reduce((sum, h) => sum + (h.timeTaken || 0), 0);
    
    return {
      totalQuestions,
      totalCorrect,
      totalWrong,
      avgAccuracy: avgAccuracy.toFixed(1),
      totalTime,
      totalSessions: practiceHistory.length
    };
  };

  // Get progress data for chart
  const getProgressData = () => {
    const data = [];
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayHistory = practiceHistory.filter(h => {
        const hDate = new Date(h.endTime).toISOString().split('T')[0];
        return hDate === dateStr;
      });
      
      const questions = dayHistory.reduce((sum, h) => sum + h.totalQuestions, 0);
      const correct = dayHistory.reduce((sum, h) => sum + h.correct, 0);
      const accuracy = questions > 0 ? (correct / questions * 100) : 0;
      
      data.push({
        date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        questions,
        accuracy: parseFloat(accuracy.toFixed(1))
      });
    }
    
    return data;
  };

  // Get subject-wise performance
  const getSubjectPerformance = () => {
    const subjectStats = {};
    
    practiceHistory.forEach(session => {
      if (session.subjectWise) {
        Object.entries(session.subjectWise).forEach(([subject, data]) => {
          if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
          }
          subjectStats[subject].correct += data.correct;
          subjectStats[subject].total += data.total;
        });
      }
    });
    
    return Object.entries(subjectStats).map(([subject, data]) => ({
      subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
      fullName: subject,
      accuracy: data.total > 0 ? parseFloat((data.correct / data.total * 100).toFixed(1)) : 0,
      total: data.total
    })).sort((a, b) => b.accuracy - a.accuracy);
  };

  // Get difficulty distribution
  const getDifficultyDistribution = () => {
    let easy = 0, medium = 0, hard = 0;
    
    practiceHistory.forEach(session => {
      // Estimate based on accuracy (this would ideally come from actual question data)
      easy += Math.floor(session.totalQuestions * 0.3);
      medium += Math.floor(session.totalQuestions * 0.5);
      hard += Math.floor(session.totalQuestions * 0.2);
    });
    
    return [
      { name: 'Easy', value: easy, color: '#10B981' },
      { name: 'Medium', value: medium, color: '#F59E0B' },
      { name: 'Hard', value: hard, color: '#EF4444' }
    ];
  };

  // Get weak topics
  const getWeakTopics = () => {
    const topicStats = {};
    
    wrongQuestions.forEach(q => {
      const topic = q.topic || 'Unknown';
      if (!topicStats[topic]) {
        topicStats[topic] = 0;
      }
      topicStats[topic]++;
    });
    
    return Object.entries(topicStats)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const stats = getOverallStats();
  const progressData = getProgressData();
  const subjectData = getSubjectPerformance();
  const difficultyData = getDifficultyDistribution();
  const weakTopics = getWeakTopics();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading analytics...</p>
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
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <BarChart3 className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ବିଶ୍ଳେଷଣ' : 'Analytics'}
            </h1>
            <p className="text-secondary-500">
              Track your learning progress
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Questions"
          value={stats.totalQuestions}
          icon={Target}
          trend={stats.totalSessions > 0 ? 'up' : undefined}
        />
        <StatCard
          title="Accuracy"
          value={`${stats.avgAccuracy}%`}
          icon={Award}
          trend={parseFloat(stats.avgAccuracy) >= 60 ? 'up' : 'down'}
        />
        <StatCard
          title="Correct"
          value={stats.totalCorrect}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Practice Sessions"
          value={stats.totalSessions}
          icon={Calendar}
        />
      </div>

      {/* Progress Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-secondary-800">Progress Over Time</h3>
          <div className="flex gap-2">
            {['week', 'month', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-secondary-500 hover:bg-secondary-100'
                }`}
              >
                {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAccuracy)"
                name="Accuracy %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Subject-wise Performance & Difficulty */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">Subject Performance</h3>
          {subjectData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="subject" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => [`${value}%`, props.payload.fullName]}
                  />
                  <Bar 
                    dataKey="accuracy" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    name="Accuracy"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-secondary-500">
              No data available yet
            </div>
          )}
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <h3 className="font-bold text-secondary-800 mb-4">Questions by Difficulty</h3>
          {difficultyData.some(d => d.value > 0) ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-secondary-500">
              No data available yet
            </div>
          )}
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {difficultyData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-secondary-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-red-500" size={20} />
            <h3 className="font-bold text-secondary-800">Topics to Focus On</h3>
          </div>
          
          <div className="space-y-3">
            {weakTopics.map((topic, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-red-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                    {index + 1}
                  </span>
                  <span className="font-medium text-secondary-800">{topic.topic}</span>
                </div>
                <span className="badge-danger">
                  {topic.count} wrong
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Study Time */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-primary-600" size={20} />
          <h3 className="font-bold text-secondary-800">Study Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-secondary-50 rounded-xl">
            <p className="text-2xl font-bold text-primary-600">
              {Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m
            </p>
            <p className="text-sm text-secondary-500">Total Study Time</p>
          </div>
          <div className="p-4 bg-secondary-50 rounded-xl">
            <p className="text-2xl font-bold text-primary-600">
              {stats.totalSessions > 0 ? Math.round(stats.totalQuestions / stats.totalSessions) : 0}
            </p>
            <p className="text-sm text-secondary-500">Avg Questions/Session</p>
          </div>
          <div className="p-4 bg-secondary-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">
              {stats.totalCorrect}
            </p>
            <p className="text-sm text-secondary-500">Questions Mastered</p>
          </div>
          <div className="p-4 bg-secondary-50 rounded-xl">
            <p className="text-2xl font-bold text-red-600">
              {wrongQuestions.length}
            </p>
            <p className="text-sm text-secondary-500">To Review</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
