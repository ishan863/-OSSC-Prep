import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  RotateCcw,
  Home,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuestionStore } from '../store/questionStore';
import { usePracticeStore } from '../store/practiceStore';
import { QuestionCard, Button, ProgressBar, Card, Modal } from '../components';
import { getTopicById, getSubjectById } from '../data/syllabus';
import toast from 'react-hot-toast';

const PracticeSessionPage = () => {
  const { subject, topic } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  
  const { 
    questions, 
    currentQuestion, 
    currentIndex, 
    isGenerating,
    generateNewQuestions,
    setCurrentQuestion,
    nextQuestion,
    previousQuestion,
    resetQuestions
  } = useQuestionStore();

  const {
    answers,
    startSession,
    recordAnswer,
    completeSession,
    resetSession,
    results
  } = usePracticeStore();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const topicInfo = getTopicById(selectedExam, topic);
  const subjectInfo = getSubjectById(selectedExam, subject);
  const difficulty = searchParams.get('difficulty') || 'medium';

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
    return () => {
      resetQuestions();
      resetSession();
    };
  }, [subject, topic]);

  const loadQuestions = async () => {
    try {
      const generatedQuestions = await generateNewQuestions({
        exam: selectedExam,
        subject,
        topic,
        difficulty,
        count: 10,
        language: preferredLanguage
      });

      startSession(generatedQuestions, 'practice', {
        subject,
        topic,
        difficulty
      });
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
      console.error('Load questions error:', error);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (showResult) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      toast.error('Please select an option');
      return;
    }

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    recordAnswer(currentQuestion.id, selectedOption, isCorrect);
    setShowResult(true);

    if (isCorrect) {
      toast.success('Correct! 🎉');
    } else {
      toast.error('Incorrect. Check the explanation.');
    }
  };

  const handleNextQuestion = () => {
    const hasNext = nextQuestion();
    setSelectedOption(null);
    setShowResult(false);

    if (!hasNext) {
      // End of questions
      handleCompleteSession();
    }
  };

  const handlePreviousQuestion = () => {
    previousQuestion();
    const prevAnswer = answers[questions[currentIndex - 1]?.id];
    setSelectedOption(prevAnswer?.selectedOption ?? null);
    setShowResult(!!prevAnswer);
  };

  const handleCompleteSession = async () => {
    setIsCompleting(true);
    try {
      await completeSession(user?.id);
      navigate('/results/latest');
    } catch (error) {
      toast.error('Failed to save results');
      console.error('Complete session error:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    resetQuestions();
    resetSession();
    navigate('/practice');
  };

  const handleLoadMore = async () => {
    try {
      await generateNewQuestions({
        exam: selectedExam,
        subject,
        topic,
        difficulty,
        count: 10,
        language: preferredLanguage
      });
      toast.success('10 more questions loaded!');
    } catch (error) {
      toast.error('Failed to load more questions');
    }
  };

  // Generation progress state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('Initializing AI...');

  // Simulate progress during generation
  useEffect(() => {
    if (isGenerating && questions.length === 0) {
      setGenerationProgress(0);
      setGenerationStatus('Connecting to AI models...');
      
      const progressSteps = [
        { progress: 15, status: 'Connected! Preparing question prompt...', delay: 500 },
        { progress: 30, status: 'Analyzing syllabus topics...', delay: 1000 },
        { progress: 50, status: 'Generating questions with AI...', delay: 2000 },
        { progress: 70, status: 'Creating answer options...', delay: 3500 },
        { progress: 85, status: 'Validating questions...', delay: 5000 },
        { progress: 95, status: 'Almost ready...', delay: 6500 },
      ];
      
      const timeouts = progressSteps.map(step => 
        setTimeout(() => {
          setGenerationProgress(step.progress);
          setGenerationStatus(step.status);
        }, step.delay)
      );
      
      return () => timeouts.forEach(clearTimeout);
    } else if (!isGenerating && questions.length > 0) {
      setGenerationProgress(100);
      setGenerationStatus('Questions ready!');
    }
  }, [isGenerating, questions.length]);

  if (isGenerating && questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full px-6"
        >
          {/* AI Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-secondary-800 mb-2">
            Generating Questions...
          </h2>
          <p className="text-secondary-500 mb-6">
            {generationStatus}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-secondary-100 rounded-full h-3 mb-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${generationProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-secondary-400">
            {generationProgress}% Complete
          </p>

          {/* Tips */}
          <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-700">
              💡 <strong>Tip:</strong> Questions are generated based on OSSC syllabus for {topicInfo?.name || topic}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            No Questions Available
          </h2>
          <p className="text-secondary-500 mb-6">
            Unable to generate questions for this topic. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/practice')}>
              Go Back
            </Button>
            <Button onClick={loadQuestions}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 text-secondary-500 hover:text-secondary-700 mb-2"
          >
            <ArrowLeft size={20} />
            <span>Exit Practice</span>
          </button>
          <h1 className="text-xl font-bold text-secondary-800">
            {topicInfo?.name || 'Practice'}
          </h1>
          <p className="text-secondary-500">
            {subjectInfo?.name} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-primary">
            AI-Generated Practice Questions
          </span>
        </div>
      </motion.div>

      {/* Progress */}
      <Card padding="small">
        <ProgressBar
          current={Object.keys(answers).length}
          total={questions.length}
          showPercentage={true}
        />
      </Card>

      {/* Question Card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedOption={selectedOption}
          onSelectOption={handleSelectOption}
          showResult={showResult}
          isSubmitted={showResult}
          language={preferredLanguage}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentIndex === 0}
          icon={ArrowLeft}
        >
          Previous
        </Button>

        <div className="flex gap-3">
          {!showResult ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              icon={CheckCircle}
            >
              Submit Answer
            </Button>
          ) : (
            <>
              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={handleCompleteSession}
                  isLoading={isCompleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Practice
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Load More */}
      {currentIndex === questions.length - 1 && showResult && (
        <Card className="text-center">
          <p className="text-secondary-600 mb-4">
            Want to practice more on this topic?
          </p>
          <Button
            variant="outline"
            onClick={handleLoadMore}
            isLoading={isGenerating}
            icon={RotateCcw}
          >
            Load 10 More Questions
          </Button>
        </Card>
      )}

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Practice?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowExitModal(false)}>
              Continue Practice
            </Button>
            <Button variant="danger" onClick={confirmExit}>
              Exit
            </Button>
          </>
        }
      >
        <p className="text-secondary-600">
          Your progress in this session will be saved. Are you sure you want to exit?
        </p>
        <div className="mt-4 p-4 bg-secondary-50 rounded-xl">
          <div className="flex justify-between text-sm">
            <span>Questions Answered:</span>
            <span className="font-semibold">{Object.keys(answers).length} / {questions.length}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PracticeSessionPage;
