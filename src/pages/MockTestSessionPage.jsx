import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMockTestStore } from '../store/mockTestStore';
import { usePracticeStore } from '../store/practiceStore';
import { QuestionCard, QuestionNavigator, Timer, Button, Card, Modal } from '../components';
import toast from 'react-hot-toast';

const MockTestSessionPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user, preferredLanguage } = useAuthStore();
  
  const { 
    currentTest,
    testQuestions,
    timeRemaining,
    startTimer,
    stopTimer,
    isLoading
  } = useMockTestStore();

  const {
    answers,
    startSession,
    recordAnswer,
    completeSession,
    resetSession
  } = usePracticeStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = testQuestions[currentIndex];

  useEffect(() => {
    if (testQuestions.length > 0 && !currentTest?.started) {
      startSession(testQuestions, 'mock', { testId });
      startTimer(handleTimeUp);
    }

    return () => {
      stopTimer();
    };
  }, [testQuestions]);

  useEffect(() => {
    // Load saved answer for current question
    if (currentQuestion && answers[currentQuestion.id]) {
      setSelectedOption(answers[currentQuestion.id].selectedOption);
    } else {
      setSelectedOption(null);
    }
  }, [currentIndex, currentQuestion, answers]);

  const handleTimeUp = useCallback(() => {
    toast.error('Time is up! Submitting your test...');
    handleSubmitTest();
  }, []);

  const handleSelectOption = (optionIndex) => {
    setSelectedOption(optionIndex);
    
    // Auto-save answer
    if (currentQuestion) {
      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      recordAnswer(currentQuestion.id, optionIndex, isCorrect);
    }
  };

  const handleNavigate = (index) => {
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentIndex)) {
      newFlagged.delete(currentIndex);
    } else {
      newFlagged.add(currentIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    stopTimer();

    try {
      const results = await completeSession(user?.id);
      toast.success('Test submitted successfully!');
      navigate(`/results/${results.id}`);
    } catch (error) {
      toast.error('Failed to submit test. Please try again.');
      console.error('Submit test error:', error);
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    stopTimer();
    resetSession();
    navigate('/mock-test');
  };

  const getAnsweredCount = () => Object.keys(answers).length;
  const getUnansweredCount = () => testQuestions.length - getAnsweredCount();

  if (isLoading || testQuestions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-800 mb-2">
            Loading Mock Test...
          </h2>
          <p className="text-secondary-500">
            Preparing your 100-question test
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Timer */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-secondary-50 py-4 -mx-4 px-4 md:-mx-6 md:px-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-secondary-500 hover:text-secondary-700"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <h1 className="font-bold text-secondary-800">Mock Test</h1>
              <p className="text-sm text-secondary-500">
                Question {currentIndex + 1} of {testQuestions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Timer 
              seconds={timeRemaining} 
              isWarning={timeRemaining <= 600}
              isDanger={timeRemaining <= 120}
            />
            <Button
              variant="success"
              onClick={() => setShowSubmitModal(true)}
              icon={CheckCircle}
            >
              Submit Test
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Question Section */}
        <div className="space-y-4">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={testQuestions.length}
              selectedOption={selectedOption}
              onSelectOption={handleSelectOption}
              showResult={false}
              isSubmitted={false}
              language={preferredLanguage}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                icon={ArrowLeft}
              >
                Previous
              </Button>
              <Button
                variant={flaggedQuestions.has(currentIndex) ? 'warning' : 'outline'}
                onClick={handleFlag}
                icon={Flag}
              >
                {flaggedQuestions.has(currentIndex) ? 'Flagged' : 'Flag'}
              </Button>
            </div>
            <Button
              onClick={handleNext}
              disabled={currentIndex === testQuestions.length - 1}
              icon={ArrowRight}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <QuestionNavigator
              totalQuestions={testQuestions.length}
              currentIndex={currentIndex}
              answers={Object.fromEntries(
                Object.entries(answers).map(([key, val]) => [
                  testQuestions.findIndex(q => q.id === key),
                  val
                ])
              )}
              onNavigate={handleNavigate}
            />

            {/* Stats */}
            <Card>
              <h4 className="font-semibold text-secondary-700 mb-3">Test Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Answered</span>
                  <span className="font-semibold text-green-600">{getAnsweredCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Unanswered</span>
                  <span className="font-semibold text-red-600">{getUnansweredCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Flagged</span>
                  <span className="font-semibold text-yellow-600">{flaggedQuestions.size}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Navigator */}
      <div className="lg:hidden">
        <QuestionNavigator
          totalQuestions={testQuestions.length}
          currentIndex={currentIndex}
          answers={Object.fromEntries(
            Object.entries(answers).map(([key, val]) => [
              testQuestions.findIndex(q => q.id === key),
              val
            ])
          )}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Review Answers
            </Button>
            <Button 
              onClick={handleSubmitTest}
              isLoading={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Test
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Are you sure you want to submit the test?
          </p>
          
          <div className="p-4 bg-secondary-50 rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary-600">Total Questions:</span>
              <span className="font-semibold">{testQuestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Answered:</span>
              <span className="font-semibold text-green-600">{getAnsweredCount()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Unanswered:</span>
              <span className="font-semibold text-red-600">{getUnansweredCount()}</span>
            </div>
          </div>

          {getUnansweredCount() > 0 && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-yellow-700">
                  You have {getUnansweredCount()} unanswered questions. Unanswered questions will not be scored.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Test?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowExitModal(false)}>
              Continue Test
            </Button>
            <Button variant="danger" onClick={confirmExit}>
              Exit Without Saving
            </Button>
          </>
        }
      >
        <p className="text-secondary-600">
          If you exit now, your progress will be lost and you'll need to start a new test.
        </p>
        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">
              This action cannot be undone. Consider submitting your test instead to save your progress.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MockTestSessionPage;
