import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  ClipboardList, 
  BarChart2, 
  MessageSquare, 
  User, 
  LogOut,
  Menu,
  X,
  Calendar,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, selectedExam, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', labelOdia: 'ଡ୍ୟାସବୋର୍ଡ', icon: Home },
    { path: '/syllabus', label: 'Syllabus', labelOdia: 'ପାଠ୍ୟକ୍ରମ', icon: BookOpen },
    { path: '/practice', label: 'Practice', labelOdia: 'ଅଭ୍ୟାସ', icon: ClipboardList },
    { path: '/mock-test', label: 'Mock Test', labelOdia: 'ମକ୍ ଟେଷ୍ଟ', icon: Award },
    { path: '/daily-test', label: 'Daily Test', labelOdia: 'ଦୈନିକ ଟେଷ୍ଟ', icon: Calendar },
    { path: '/wrong-questions', label: 'Revision', labelOdia: 'ପୁନରାବୃତ୍ତି', icon: RefreshCw },
    { path: '/analytics', label: 'Analytics', labelOdia: 'ବିଶ୍ଳେଷଣ', icon: BarChart2 },
    { path: '/chatbot', label: 'AI Tutor', labelOdia: 'AI ଶିକ୍ଷକ', icon: MessageSquare },
    { path: '/profile', label: 'Profile', labelOdia: 'ପ୍ରୋଫାଇଲ୍', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ item, isMobile = false }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <button
        onClick={() => {
          navigate(item.path);
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={`
          flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200
          ${active 
            ? 'bg-primary-600 text-white shadow-lg' 
            : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
          }
          ${isMobile ? 'text-lg' : ''}
        `}
      >
        <Icon size={isMobile ? 24 : 20} />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Desktop Sidebar */}
      <aside className="sidebar overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <span className="text-white font-bold text-lg">RI</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-secondary-800">OSSC Prep</h1>
                <p className="text-xs text-secondary-500">{selectedExam} Exam</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="pt-4 border-t border-secondary-200 mt-4">
            <div className="px-4 py-2 mb-2">
              <p className="font-medium text-secondary-800 truncate">{user?.name}</p>
              <p className="text-sm text-secondary-500">{user?.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-secondary-200 py-3 px-4 z-50 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RI</span>
            </div>
            <div>
              <h1 className="font-bold text-secondary-800">OSSC Prep</h1>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary-100"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavItem key={item.path} item={item} isMobile />
                ))}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200">
                <div className="mb-3">
                  <p className="font-medium text-secondary-800">{user?.name}</p>
                  <p className="text-sm text-secondary-500">{user?.phone}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main-content pt-16 md:pt-0">
        <div className="container-app py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="flex justify-around items-center">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center gap-1 py-1 px-3 rounded-lg
                  ${active ? 'text-primary-600' : 'text-secondary-500'}
                `}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
