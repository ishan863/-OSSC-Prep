import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot,
  User,
  Loader2,
  Trash2,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Sparkles,
  Key,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatbotStore } from '../store/chatbotStore';
import { Card, Button, Input } from '../components';
import { isAPIConfigured } from '../config/openrouter.config';
import toast from 'react-hot-toast';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearHistory,
    loadChatHistory 
  } = useChatbotStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [hasAPIKey, setHasAPIKey] = useState(true); // Default true to avoid flash

  useEffect(() => {
    if (user?.id) {
      loadChatHistory(user.id);
    }
    // Check API key status
    setHasAPIKey(isAPIConfigured());
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    
    try {
      await sendMessage(message, {
        userId: user?.id,
        exam: selectedExam,
        language: preferredLanguage
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearHistory(user?.id);
    toast.success('Chat history cleared');
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const quickQuestions = [
    {
      icon: BookOpen,
      text: 'Explain the Land Acquisition Act',
      category: 'Laws'
    },
    {
      icon: HelpCircle,
      text: 'What are the duties of a Revenue Inspector?',
      category: 'Role'
    },
    {
      icon: Lightbulb,
      text: 'Give me tips for reasoning questions',
      category: 'Tips'
    },
    {
      icon: Sparkles,
      text: 'Explain Odisha geography in Odia',
      category: 'Odia'
    }
  ];

  return (
    <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-3 sm:mb-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'AI ଶିକ୍ଷକ' : 'AI Tutor'}
            </h1>
            <p className="text-xs sm:text-sm text-secondary-500 hidden sm:block">
              Ask me anything about OSSC exams
            </p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="small"
            onClick={handleClearChat}
            icon={Trash2}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </motion.div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-mobile">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 flex items-center justify-center mb-3 sm:mb-4"
              >
                <Bot className="text-primary-600" size={32} />
              </motion.div>
              <h2 className="text-lg sm:text-xl font-bold text-secondary-800 mb-1 sm:mb-2">
                {preferredLanguage === 'or' ? 'ନମସ୍କାର!' : 'Hello! I\'m your AI Tutor'}
              </h2>
              <p className="text-xs sm:text-sm text-secondary-500 mb-4 sm:mb-6 max-w-md">
                Ask me anything about OSSC {selectedExam} exam!
              </p>

              {/* API Key Warning */}
              {!hasAPIKey && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-lg mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Key className="text-yellow-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-800 mb-1">API Key Required</h3>
                      <p className="text-sm text-yellow-700 mb-3">
                        Add your free OpenRouter API key to enable AI chatbot features.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => navigate('/profile')}
                          icon={Settings}
                        >
                          Setup in Profile
                        </Button>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} />
                          Get Free Key
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Quick Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
                {quickQuestions.map((q, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickQuestion(q.text)}
                    className="p-3 sm:p-4 bg-secondary-50 rounded-xl text-left hover:bg-secondary-100 active:bg-secondary-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                        <q.icon className="text-primary-600" size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-primary-600 font-medium">{q.category}</p>
                        <p className="text-xs sm:text-sm text-secondary-700 truncate">{q.text}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary-600' 
                        : 'bg-gradient-to-r from-primary-500 to-blue-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="text-white" size={16} />
                      ) : (
                        <Bot className="text-white" size={16} />
                      )}
                    </div>
                    
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-secondary-100 text-secondary-800 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      {message.timestamp && (
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-primary-200' : 'text-secondary-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('en', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="text-white" size={16} />
                    </div>
                    <div className="p-4 bg-secondary-100 rounded-2xl rounded-tl-none">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                        <span className="text-sm text-secondary-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-secondary-200 p-3 sm:p-4 bg-white safe-area-bottom">
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={preferredLanguage === 'or' ? 'ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ...' : 'Type your question...'}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 sm:px-6 min-w-[48px]"
              icon={isLoading ? Loader2 : Send}
            >
              <span className="hidden sm:inline">{isLoading ? '' : 'Send'}</span>
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-secondary-400 mt-2 text-center hidden sm:block">
            AI responses are generated and may not always be accurate.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ChatbotPage;
