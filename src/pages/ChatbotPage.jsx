import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatbotStore } from '../store/chatbotStore';
import { Card, Button, Input } from '../components';
import toast from 'react-hot-toast';

const ChatbotPage = () => {
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

  useEffect(() => {
    if (user?.id) {
      loadChatHistory(user.id);
    }
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
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'AI ଶିକ୍ଷକ' : 'AI Tutor'}
            </h1>
            <p className="text-sm text-secondary-500">
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
          >
            Clear
          </Button>
        )}
      </motion.div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 flex items-center justify-center mb-4"
              >
                <Bot className="text-primary-600" size={40} />
              </motion.div>
              <h2 className="text-xl font-bold text-secondary-800 mb-2">
                {preferredLanguage === 'or' ? 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ AI ଶିକ୍ଷକ' : 'Hello! I\'m your AI Tutor'}
              </h2>
              <p className="text-secondary-500 mb-6 max-w-md">
                I can explain concepts, solve problems, and help you prepare for the OSSC {selectedExam} exam. Ask me anything!
              </p>
              
              {/* Quick Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickQuestions.map((q, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickQuestion(q.text)}
                    className="p-4 bg-secondary-50 rounded-xl text-left hover:bg-secondary-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                        <q.icon className="text-primary-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-primary-600 font-medium">{q.category}</p>
                        <p className="text-sm text-secondary-700 line-clamp-1">{q.text}</p>
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
        <div className="border-t border-secondary-200 p-4 bg-white">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={preferredLanguage === 'or' ? 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ...' : 'Type your question...'}
              className="flex-1 px-4 py-3 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6"
              icon={isLoading ? Loader2 : Send}
            >
              {isLoading ? '' : 'Send'}
            </Button>
          </div>
          <p className="text-xs text-secondary-400 mt-2 text-center">
            AI responses are generated and may not always be accurate. Verify important information.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ChatbotPage;
