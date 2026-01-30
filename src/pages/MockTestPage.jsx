import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Clock, 
  Play,
  History,
  Target,
  AlertTriangle,
  Loader2,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMockTestStore } from '../store/mockTestStore';
import { usePracticeStore } from '../store/practiceStore';
import { Card, Button, Modal } from '../components';
import { getSyllabus } from '../data/syllabus';
import { fireConfetti } from '../utils/animations';
import toast from 'react-hot-toast';

const MockTestPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const { generateMockTest, isLoading, availableTests, fetchAvailableTests } = useMockTestStore();
  const { fetchPracticeHistory } = usePracticeStore();
  
  const [showStartModal, setShowStartModal] = useState(false);
  const [previousTests, setPreviousTests] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  
  const syllabus = getSyllabus(selectedExam);

  useEffect(() => {
    loadPreviousTests();
  }, [user?.id]);

  // Simulate progress during generation
  useEffect(() => {
    if (isLoading) {
      setGenerationProgress(0);
      setGenerationStatus('Initializing AI models...');
      
      const progressSteps = [
        { progress: 10, status: 'Connected to AI...', delay: 1000 },
        { progress: 25, status: 'Generating Reasoning questions...', delay: 3000 },
        { progress: 40, status: 'Generating Quantitative questions...', delay: 8000 },
        { progress: 55, status: 'Generating English questions...', delay: 15000 },
        { progress: 70, status: 'Generating General Knowledge questions...', delay: 22000 },
        { progress: 85, status: 'Generating Odia Language questions...', delay: 30000 },
        { progress: 95, status: 'Finalizing mock test...', delay: 40000 },
      ];
      
      const timeouts = progressSteps.map(step => 
        setTimeout(() => {
          setGenerationProgress(step.progress);
          setGenerationStatus(step.status);
        }, step.delay)
      );
      
      return () => timeouts.forEach(clearTimeout);
    }
  }, [isLoading]);

  const loadPreviousTests = async () => {
    if (!user?.id) return;
    try {
      const history = await fetchPracticeHistory(user.id, 10);
      setPreviousTests(history.filter(h => h.type === 'mock'));
    } catch (error) {
      console.error('Load history error:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStartTest = async () => {
    setShowStartModal(false);
    try {
      toast.loading('Generating 100 questions...', { id: 'mock-gen' });
      
      const test = await generateMockTest({
        exam: selectedExam,
        userId: user?.id,
        language: preferredLanguage
      });
      
      toast.success(`Mock test ready with ${test.questionsData?.length || 100} questions!`, { id: 'mock-gen' });
      fireConfetti.stars();
      
      // Small delay for celebration
      setTimeout(() => {
        navigate(`/mock-test/${test.id}`);
      }, 500);
    } catch (error) {
      toast.error('Failed to generate mock test. Please try again.', { id: 'mock-gen' });
      console.error('Generate mock test error:', error);
    }
  };

  const testInfo = [
    { label: 'Total Questions', value: '100', icon: Target },
    { label: 'Duration', value: '90 Minutes', icon: Clock },
    { label: 'Negative Marking', value: '-0.25', icon: AlertTriangle },
    { label: 'Total Marks', value: '100', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Award className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ମକ୍ ଟେଷ୍ଟ' : 'Mock Test'}
            </h1>
            <p className="text-secondary-500">
              Full-length AI-generated test following OSSC pattern
            </p>
          </div>
        </div>
      </motion.div>

      {/* Test Info Card */}
      <Card className="gradient-bg text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">OSSC {selectedExam} Mock Test</h2>
          <p className="text-primary-100">AI-Generated Mock Test (OSSC Pattern)</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {testInfo.map((info, index) => (
            <div key={index} className="text-center p-4 bg-white/10 rounded-xl">
              <info.icon className="mx-auto mb-2" size={24} />
              <p className="text-2xl font-bold">{info.value}</p>
              <p className="text-sm text-primary-100">{info.label}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => setShowStartModal(true)}
            size="large"
            className="bg-white text-primary-600 hover:bg-primary-50"
            icon={Play}
          >
            Start Mock Test
          </Button>
        </div>
      </Card>

      {/* Subject Distribution */}
      <Card>
        <h3 className="font-bold text-secondary-800 mb-4">Subject Distribution</h3>
        <div className="space-y-3">
          {syllabus.subjects.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span className="font-bold text-primary-600">{subject.questionCount}</span>
                </div>
                <div>
                  <p className="font-medium text-secondary-800">{subject.name}</p>
                  <p className="text-xs text-secondary-500">{subject.weightage}% weightage</p>
                </div>
              </div>
              <span className="badge-primary">{subject.questionCount} Qs</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <h3 className="font-bold text-secondary-800 mb-4">Test Instructions</h3>
        <ul className="space-y-2 text-secondary-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>The test contains 100 multiple choice questions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>You will have 90 minutes to complete the test.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Each correct answer carries 1 mark.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Each wrong answer deducts 0.25 marks (negative marking).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Questions left unanswered will not be marked.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>You can navigate between questions using the question palette.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>The test will auto-submit when time is up.</span>
          </li>
        </ul>
      </Card>

      {/* Previous Tests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-secondary-800">Previous Mock Tests</h3>
          <History className="text-secondary-400" size={20} />
        </div>
        
        {isLoadingHistory ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          </div>
        ) : previousTests.length > 0 ? (
          <div className="space-y-3">
            {previousTests.map((test, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors"
                onClick={() => navigate(`/results/${test.id}`)}
              >
                <div>
                  <p className="font-medium text-secondary-800">Mock Test #{previousTests.length - index}</p>
                  <p className="text-sm text-secondary-500">
                    {new Date(test.endTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${parseFloat(test.accuracy) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {test.accuracy}%
                  </p>
                  <p className="text-sm text-secondary-500">
                    {test.correct}/{test.totalQuestions} correct
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            <Award className="mx-auto mb-3 text-secondary-300" size={40} />
            <p>No mock tests taken yet</p>
            <p className="text-sm">Take your first mock test to see your results here</p>
          </div>
        )}
      </Card>

      {/* Start Test Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Ready to Start?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowStartModal(false)}>
              Not Yet
            </Button>
            <Button 
              onClick={handleStartTest}
              isLoading={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Test
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            You are about to start a 100-question mock test. Make sure you:
          </p>
          <ul className="space-y-2 text-secondary-600">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
              Have 90 minutes of uninterrupted time
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
              Are in a quiet environment
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
              Have a stable internet connection
            </li>
          </ul>
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-yellow-700">
                Once started, the timer cannot be paused. The test will auto-submit when time is up.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MockTestPage;
