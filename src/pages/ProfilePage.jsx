import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  Award,
  Target,
  Clock,
  Calendar,
  ChevronRight,
  Globe,
  Moon,
  Bell,
  Shield,
  HelpCircle,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Card, Button, Modal, Input } from '../components';
import { saveAPIKey, clearAPIKey, OPENROUTER_CONFIG, isAPIConfigured, getOpenRouterHeaders } from '../config/openrouter.config';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { 
    user, 
    selectedExam, 
    preferredLanguage, 
    setPreferredLanguage,
    logout 
  } = useAuthStore();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // API Testing states
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null); // 'success' | 'error' | null
  const [apiTestMessage, setApiTestMessage] = useState('');
  const [apiCredits, setApiCredits] = useState(null);

  // Check if API key exists on load
  useEffect(() => {
    const storedKey = localStorage.getItem('openrouter_api_key');
    setHasApiKey(!!storedKey && storedKey.length > 10);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveAPIKey = () => {
    if (apiKey && apiKey.startsWith('sk-or-') && apiKey.length > 20) {
      saveAPIKey(apiKey);
      setHasApiKey(true);
      setApiTestResult(null);
      setApiTestMessage('');
      toast.success('API Key saved! Click "Test API" to verify.');
    } else {
      toast.error('Invalid API key. It should start with sk-or-');
    }
  };

  const handleClearAPIKey = () => {
    clearAPIKey();
    setApiKey('');
    setHasApiKey(false);
    setApiTestResult(null);
    setApiTestMessage('');
    setApiCredits(null);
    toast.success('API Key removed');
  };

  // Test API Key function
  const testAPIKey = async () => {
    if (!apiKey || apiKey.length < 20) {
      toast.error('Please enter an API key first');
      return;
    }

    setIsTestingAPI(true);
    setApiTestResult(null);
    setApiTestMessage('Testing connection...');

    try {
      // First, save the key temporarily for testing
      saveAPIKey(apiKey);
      
      // Test with a simple API call
      const response = await axios.post(
        `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'user', content: 'Say "API working" in exactly 2 words.' }
          ],
          max_tokens: 10,
          temperature: 0
        },
        {
          headers: getOpenRouterHeaders(),
          timeout: 30000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        setApiTestResult('success');
        setApiTestMessage('API key is valid and working!');
        setHasApiKey(true);
        
        // Try to get credits/usage info
        try {
          const creditsResponse = await axios.get(
            'https://openrouter.ai/api/v1/auth/key',
            { headers: getOpenRouterHeaders() }
          );
          if (creditsResponse.data) {
            setApiCredits(creditsResponse.data);
          }
        } catch (e) {
          // Credits info not available, that's okay
        }
        
        toast.success('✅ API key verified successfully!');
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      setApiTestResult('error');
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      
      if (status === 401) {
        setApiTestMessage('Invalid API key. Please check and try again.');
      } else if (status === 402) {
        setApiTestMessage('API key has no credits. Get a free key from OpenRouter.');
      } else if (status === 429) {
        setApiTestMessage('Rate limited. Please wait a moment and try again.');
      } else if (error.code === 'ECONNABORTED') {
        setApiTestMessage('Connection timeout. Check your internet connection.');
      } else {
        setApiTestMessage(`Error: ${errorMsg}`);
      }
      
      toast.error('API test failed. Check the error message.');
    } finally {
      setIsTestingAPI(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    setPreferredLanguage(lang);
    toast.success(lang === 'or' ? 'ଭାଷା ଓଡ଼ିଆରେ ପରିବର୍ତ୍ତିତ' : 'Language changed to English');
    setShowLanguageModal(false);
  };

  const stats = user?.stats || {
    totalQuestions: 0,
    correctAnswers: 0,
    mockTestsTaken: 0,
    dailyStreak: 0,
    studyTime: 0
  };

  const settingsItems = [
    {
      icon: Globe,
      title: 'Language',
      subtitle: preferredLanguage === 'or' ? 'ଓଡ଼ିଆ' : 'English',
      onClick: () => setShowLanguageModal(true)
    },
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Daily reminders',
      onClick: () => toast('Coming soon!', { icon: '🔔' })
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      subtitle: 'Coming soon',
      onClick: () => toast('Dark mode coming soon!', { icon: '🌙' })
    },
    {
      icon: Shield,
      title: 'Privacy',
      subtitle: 'Manage your data',
      onClick: () => toast('Privacy settings coming soon!', { icon: '🔒' })
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'FAQs and contact',
      onClick: () => toast('Help center coming soon!', { icon: '❓' })
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <User className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ପ୍ରୋଫାଇଲ୍' : 'Profile'}
            </h1>
            <p className="text-secondary-500">
              Manage your account
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profile Card */}
      <Card className="gradient-bg text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
            <p className="text-primary-100">{user?.phone || 'No phone'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                OSSC {selectedExam}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {preferredLanguage === 'or' ? 'ଓଡ଼ିଆ' : 'English'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            <Target className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary-800">{stats.totalQuestions}</p>
          <p className="text-sm text-secondary-500">Questions Solved</p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Award className="text-green-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary-800">
            {stats.totalQuestions > 0 
              ? Math.round(stats.correctAnswers / stats.totalQuestions * 100) 
              : 0}%
          </p>
          <p className="text-sm text-secondary-500">Accuracy</p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mx-auto mb-3">
            <Calendar className="text-yellow-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary-800">{stats.dailyStreak}</p>
          <p className="text-sm text-secondary-500">Day Streak</p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="text-purple-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary-800">
            {Math.floor((stats.studyTime || 0) / 60)}h
          </p>
          <p className="text-sm text-secondary-500">Study Time</p>
        </Card>
      </div>

      {/* AI API Settings - Prominent Card */}
      <Card className={`border-2 ${hasApiKey ? 'border-green-200 bg-green-50/30' : 'border-primary-200 bg-primary-50/30'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasApiKey ? 'bg-green-100' : 'bg-primary-100'}`}>
              <Key className={hasApiKey ? 'text-green-600' : 'text-primary-600'} size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-secondary-800">AI API Configuration</h3>
                {hasApiKey ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle size={12} /> Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <AlertCircle size={12} /> Not Configured
                  </span>
                )}
              </div>
              <p className="text-secondary-500 text-sm mb-3">
                {hasApiKey 
                  ? 'AI features are enabled. You can update or test your API key anytime.'
                  : 'Add your free OpenRouter API key to enable AI chatbot, explanations & translations.'
                }
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  variant={hasApiKey ? 'outline' : 'primary'}
                  onClick={() => setShowAPIModal(true)}
                  icon={hasApiKey ? Settings : Key}
                >
                  {hasApiKey ? 'Manage API Key' : 'Add API Key'}
                </Button>
                {!hasApiKey && (
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                    Get Free Key
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-secondary-500" size={20} />
          <h3 className="font-bold text-secondary-800">Settings</h3>
        </div>
        
        <div className="divide-y divide-secondary-100">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between py-4 hover:bg-secondary-50 -mx-4 px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                  <item.icon className="text-secondary-600" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-secondary-800">{item.title}</p>
                  <p className="text-sm text-secondary-500">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="text-secondary-400" size={20} />
            </button>
          ))}
        </div>
      </Card>

      {/* Exam Change */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-secondary-800">Current Exam</h3>
            <p className="text-secondary-500">OSSC {selectedExam} Exam</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/select-exam')}
          >
            Change Exam
          </Button>
        </div>
      </Card>

      {/* Logout */}
      <Card className="border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-600">Logout</h3>
            <p className="text-secondary-500">Sign out of your account</p>
          </div>
          <Button
            variant="danger"
            onClick={() => setShowLogoutModal(true)}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </Card>

      {/* App Info */}
      <div className="text-center text-secondary-400 text-sm">
        <p>OSSC Exam Prep v1.0.0</p>
        <p>Made with ❤️ for OSSC aspirants</p>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </>
        }
      >
        <p className="text-secondary-600">
          Are you sure you want to logout? Your progress will be saved.
        </p>
      </Modal>

      {/* Language Modal */}
      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Select Language"
      >
        <div className="space-y-3">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${
              preferredLanguage === 'en' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-secondary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className="font-medium text-secondary-800">English</p>
                <p className="text-sm text-secondary-500">Primary language</p>
              </div>
            </div>
            {preferredLanguage === 'en' && (
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>

          <button
            onClick={() => handleLanguageChange('or')}
            className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${
              preferredLanguage === 'or' 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-secondary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇳</span>
              <div className="text-left">
                <p className="font-medium text-secondary-800">ଓଡ଼ିଆ (Odia)</p>
                <p className="text-sm text-secondary-500">ମାତୃଭାଷା</p>
              </div>
            </div>
            {preferredLanguage === 'or' && (
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>
        </div>
      </Modal>

      {/* API Settings Modal */}
      <Modal
        isOpen={showAPIModal}
        onClose={() => setShowAPIModal(false)}
        title="AI API Settings"
      >
        <div className="space-y-4">
          {/* Status Banner */}
          {apiTestResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex items-start gap-3 ${
                apiTestResult === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {apiTestResult === 'success' ? (
                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              )}
              <div>
                <p className={`font-medium ${apiTestResult === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {apiTestResult === 'success' ? 'API Connected!' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${apiTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {apiTestMessage}
                </p>
                {apiCredits && apiTestResult === 'success' && (
                  <p className="text-sm text-green-600 mt-1">
                    Usage: ${apiCredits.usage?.toFixed(4) || '0.00'} / Limit: ${apiCredits.limit?.toFixed(2) || 'Unlimited'}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Why do I need an API key?</p>
                <p className="text-blue-600">
                  This enables AI-powered features like the chatbot, question explanations, and Odia translations. 
                  Your key is stored locally in your browser only.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiTestResult(null);
                }}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-3 pr-10 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={testAPIKey}
              disabled={!apiKey || apiKey.length < 20 || isTestingAPI}
              className="flex-1"
              icon={isTestingAPI ? Loader2 : RefreshCw}
            >
              {isTestingAPI ? 'Testing...' : 'Test API'}
            </Button>
            <Button
              onClick={handleSaveAPIKey}
              disabled={!apiKey || apiKey.length < 20}
              className="flex-1"
              icon={Check}
            >
              Save Key
            </Button>
          </div>

          {hasApiKey && (
            <Button
              variant="ghost"
              onClick={handleClearAPIKey}
              className="w-full text-red-500 hover:bg-red-50"
              icon={X}
            >
              Remove API Key
            </Button>
          )}

          {/* How to get API key */}
          <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
            <p className="font-medium text-secondary-700">How to get your FREE API key:</p>
            <ol className="text-sm text-secondary-600 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">openrouter.ai</a></li>
              <li>Sign up with Google (free, no credit card)</li>
              <li>Go to "Keys" section in dashboard</li>
              <li>Click "Create Key" button</li>
              <li>Copy the key and paste it above</li>
            </ol>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
            >
              <ExternalLink size={16} />
              Open OpenRouter Keys Page
            </a>
          </div>

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={() => setShowAPIModal(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
