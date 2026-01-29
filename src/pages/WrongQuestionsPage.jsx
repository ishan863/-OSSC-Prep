import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RotateCcw, 
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePracticeStore } from '../store/practiceStore';
import { Card, Button, QuestionCard, Modal, Select } from '../components';
import { getSyllabus } from '../data/syllabus';
import toast from 'react-hot-toast';

const WrongQuestionsPage = () => {
  const navigate = useNavigate();
  const { user, selectedExam, preferredLanguage } = useAuthStore();
  const { 
    fetchWrongQuestions, 
    removeWrongQuestion,
    startSession,
    recordAnswer,
    completeSession 
  } = usePracticeStore();
  
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionAnswers, setRevisionAnswers] = useState({});
  
  const syllabus = getSyllabus(selectedExam);

  useEffect(() => {
    loadWrongQuestions();
  }, [user?.id]);

  useEffect(() => {
    filterQuestions();
  }, [wrongQuestions, selectedSubject]);

  const loadWrongQuestions = async () => {
    if (!user?.id) return;
    try {
      const questions = await fetchWrongQuestions(user.id);
      setWrongQuestions(questions);
    } catch (error) {
      console.error('Load wrong questions error:', error);
      toast.error('Failed to load wrong questions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    if (selectedSubject === 'all') {
      setFilteredQuestions(wrongQuestions);
    } else {
      setFilteredQuestions(wrongQuestions.filter(q => q.subject === selectedSubject));
    }
  };

  const handleRemoveQuestion = async (questionId) => {
    try {
      await removeWrongQuestion(user.id, questionId);
      setWrongQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Question removed from review list');
    } catch (error) {
      toast.error('Failed to remove question');
    }
  };

  const handleStartRevision = async () => {
    if (filteredQuestions.length === 0) {
      toast.error('No questions to revise');
      return;
    }
    
    setIsRevising(true);
    setRevisionAnswers({});
    setSelectedQuestionIndex(0);
    setShowReviewModal(true);
  };

  const handleSelectOption = (optionIndex) => {
    const currentQuestion = filteredQuestions[selectedQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    setRevisionAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { optionIndex, isCorrect }
    }));
  };

  const handleNextQuestion = () => {
    if (selectedQuestionIndex < filteredQuestions.length - 1) {
      setSelectedQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteRevision = async () => {
    // Remove correctly answered questions from wrong list
    const correctlyAnswered = Object.entries(revisionAnswers)
      .filter(([_, answer]) => answer.isCorrect)
      .map(([questionId, _]) => questionId);
    
    for (const questionId of correctlyAnswered) {
      await removeWrongQuestion(user.id, questionId);
    }
    
    setWrongQuestions(prev => prev.filter(q => !correctlyAnswered.includes(q.id)));
    
    const correctCount = correctlyAnswered.length;
    const totalAnswered = Object.keys(revisionAnswers).length;
    
    toast.success(`Revision complete! ${correctCount}/${totalAnswered} correct. ${correctCount} questions mastered!`);
    setShowReviewModal(false);
    setIsRevising(false);
    setRevisionAnswers({});
  };

  const getSubjectCounts = () => {
    const counts = { all: wrongQuestions.length };
    wrongQuestions.forEach(q => {
      counts[q.subject] = (counts[q.subject] || 0) + 1;
    });
    return counts;
  };

  const subjectCounts = getSubjectCounts();
  const subjectOptions = [
    { value: 'all', label: `All Subjects (${subjectCounts.all || 0})` },
    ...syllabus.subjects.map(s => ({
      value: s.name,
      label: `${s.name} (${subjectCounts[s.name] || 0})`
    }))
  ];

  const currentQuestion = filteredQuestions[selectedQuestionIndex];
  const currentAnswer = currentQuestion ? revisionAnswers[currentQuestion.id] : null;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading wrong questions...</p>
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
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ଭୁଲ ପ୍ରଶ୍ନ' : 'Wrong Questions'}
            </h1>
            <p className="text-secondary-500">
              Review and master your mistakes
            </p>
          </div>
        </div>
      </motion.div>

      {wrongQuestions.length === 0 ? (
        <Card className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="text-green-600" size={40} />
          </motion.div>
          <h2 className="text-xl font-bold text-secondary-800 mb-2">No Wrong Questions!</h2>
          <p className="text-secondary-500 mb-6">
            Great job! You've mastered all the questions you've attempted.
          </p>
          <Button onClick={() => navigate('/practice')}>
            Continue Practicing
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats & Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-red-600">{wrongQuestions.length}</p>
                  <p className="text-red-700">Questions to Review</p>
                </div>
                <XCircle className="text-red-400" size={48} />
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between h-full">
                <div>
                  <h3 className="font-bold text-secondary-800">Start Revision</h3>
                  <p className="text-sm text-secondary-500">Go through all wrong questions</p>
                </div>
                <Button onClick={handleStartRevision} icon={RotateCcw}>
                  Revise Now
                </Button>
              </div>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <div className="flex items-center gap-4">
              <Filter className="text-secondary-400" size={20} />
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                options={subjectOptions}
                className="flex-1"
              />
            </div>
          </Card>

          {/* Questions List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-red-600">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-800 mb-2 line-clamp-2">
                          {question.question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge-primary">{question.subject}</span>
                          <span className="badge-secondary">{question.topic}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => {
                            setSelectedQuestionIndex(index);
                            setIsRevising(false);
                            setShowReviewModal(true);
                          }}
                          icon={Eye}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveQuestion(question.id)}
                          icon={Trash2}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Review/Revision Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          if (isRevising && Object.keys(revisionAnswers).length > 0) {
            handleCompleteRevision();
          } else {
            setShowReviewModal(false);
          }
        }}
        title={isRevising ? 'Revision Mode' : 'Question Details'}
        size="large"
      >
        {currentQuestion && (
          <div className="space-y-4">
            {/* Question Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="small"
                disabled={selectedQuestionIndex === 0}
                onClick={handlePreviousQuestion}
              >
                Previous
              </Button>
              <span className="text-sm text-secondary-600">
                {selectedQuestionIndex + 1} of {filteredQuestions.length}
              </span>
              <Button
                variant="outline"
                size="small"
                disabled={selectedQuestionIndex === filteredQuestions.length - 1}
                onClick={handleNextQuestion}
              >
                Next
              </Button>
            </div>

            {/* Question Card */}
            <QuestionCard
              question={currentQuestion}
              questionNumber={selectedQuestionIndex + 1}
              totalQuestions={filteredQuestions.length}
              selectedOption={isRevising ? currentAnswer?.optionIndex : currentQuestion.userAnswer}
              onSelectOption={isRevising ? handleSelectOption : undefined}
              showResult={!isRevising || currentAnswer !== undefined}
              isSubmitted={!isRevising || currentAnswer !== undefined}
              language={preferredLanguage}
            />

            {/* Revision Progress */}
            {isRevising && (
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                <div className="text-sm text-secondary-600">
                  Answered: {Object.keys(revisionAnswers).length}/{filteredQuestions.length}
                </div>
                <div className="flex gap-2">
                  <span className="text-sm text-green-600">
                    ✓ {Object.values(revisionAnswers).filter(a => a.isCorrect).length} correct
                  </span>
                  <span className="text-sm text-red-600">
                    ✗ {Object.values(revisionAnswers).filter(a => !a.isCorrect).length} wrong
                  </span>
                </div>
              </div>
            )}

            {/* Complete Button */}
            {isRevising && Object.keys(revisionAnswers).length === filteredQuestions.length && (
              <Button
                onClick={handleCompleteRevision}
                className="w-full"
                icon={CheckCircle}
              >
                Complete Revision
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WrongQuestionsPage;
