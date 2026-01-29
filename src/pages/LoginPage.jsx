import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, BookOpen, Award, CheckCircle, UserPlus, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, user, selectedExam, isLoading } = useAuthStore();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && selectedExam) {
      navigate('/dashboard');
    } else if (user && !selectedExam) {
      navigate('/select-exam');
    }
  }, [user, selectedExam, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLoginMode) {
      if (!name.trim() || name.trim().length < 2) {
        newErrors.name = 'Please enter your full name (at least 2 characters)';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      let userData;
      if (isLoginMode) {
        userData = await login(email.trim(), password);
        toast.success(`Welcome back, ${userData.name}! 🎉`);
      } else {
        userData = await register(name.trim(), email.trim(), password);
        toast.success(`Welcome, ${userData.name}! Account created successfully! 🎉`);
      }
      
      if (userData.selectedExam) {
        navigate('/dashboard');
      } else {
        navigate('/select-exam');
      }
    } catch (error) {
      toast.error(error.message || `${isLoginMode ? 'Login' : 'Registration'} failed. Please try again.`);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const features = [
    { icon: BookOpen, title: 'Topic-wise Practice', desc: 'Master each topic with unlimited questions' },
    { icon: Award, title: 'AI-Generated Tests', desc: '100-question mock tests following OSSC pattern' },
    { icon: CheckCircle, title: 'Smart Revision', desc: 'Focus on your weak areas with AI guidance' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container-app min-h-screen min-h-[100dvh] flex items-center justify-center py-4 sm:py-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">RI</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-secondary-800">OSSC Exam Prep</h1>
                  <p className="text-secondary-500">Revenue Inspector & Assistant Inspector</p>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-secondary-800 mb-4 leading-tight">
                Prepare Smarter with
                <span className="gradient-text"> AI-Powered</span> Practice
              </h2>
              
              <p className="text-lg text-secondary-600 mb-8">
                Join thousands of aspirants preparing for OSSC RI exam with our intelligent 
                question generation, personalized practice, and comprehensive analytics.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/50 border border-secondary-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-800">{feature.title}</h3>
                    <p className="text-secondary-500 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login/Register Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="card max-w-md mx-auto lg:mx-0 lg:ml-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg mx-auto mb-3 sm:mb-4">
                  <span className="text-white font-bold text-xl sm:text-2xl">RI</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary-800">OSSC Exam Prep</h1>
                <p className="text-xs sm:text-sm text-secondary-500">Revenue Inspector Exam</p>
              </div>

              {/* Login/Register Tabs */}
              <div className="flex bg-secondary-100 rounded-xl p-1 mb-4 sm:mb-6">
                <button
                  onClick={() => setIsLoginMode(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    isLoginMode 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <LogIn size={16} />
                  Login
                </button>
                <button
                  onClick={() => setIsLoginMode(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    !isLoginMode 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <UserPlus size={16} />
                  Register
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={isLoginMode ? 'login' : 'register'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-secondary-800">
                      {isLoginMode ? 'Welcome Back! 👋' : 'Create Account 🎉'}
                    </h2>
                    <p className="text-secondary-500 mt-1">
                      {isLoginMode 
                        ? 'Login to continue your preparation' 
                        : 'Register to start your OSSC exam preparation'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name field - only for registration */}
                    {!isLoginMode && (
                      <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={User}
                        error={errors.name}
                        required
                      />
                    )}

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Mail}
                      error={errors.email}
                      required
                    />

                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={Lock}
                      error={errors.password}
                      helperText={!isLoginMode ? "Minimum 6 characters" : undefined}
                      required
                    />

                    {/* Confirm Password - only for registration */}
                    {!isLoginMode && (
                      <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={Lock}
                        error={errors.confirmPassword}
                        required
                      />
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      isLoading={isLoading}
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      {isLoginMode ? 'Login & Continue' : 'Create Account'}
                    </Button>
                  </form>

                  {/* Switch Mode Link */}
                  <div className="mt-6 text-center">
                    <p className="text-secondary-600">
                      {isLoginMode ? (
                        <>
                          New user?{' '}
                          <button 
                            onClick={switchMode}
                            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                          >
                            Register here
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{' '}
                          <button 
                            onClick={switchMode}
                            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                          >
                            Login here
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-secondary-100">
                <p className="text-center text-xs sm:text-sm text-secondary-500">
                  By continuing, you agree to our Terms
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  Free
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  No OTP
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  Stay Logged
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
