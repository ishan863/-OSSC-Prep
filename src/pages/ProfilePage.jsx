import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, Button, Modal } from '../components';
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
      onClick: () => toast.info('Coming soon!')
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      subtitle: 'Coming soon',
      onClick: () => toast.info('Dark mode coming soon!')
    },
    {
      icon: Shield,
      title: 'Privacy',
      subtitle: 'Manage your data',
      onClick: () => toast.info('Privacy settings coming soon!')
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'FAQs and contact',
      onClick: () => toast.info('Help center coming soon!')
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
    </div>
  );
};

export default ProfilePage;
