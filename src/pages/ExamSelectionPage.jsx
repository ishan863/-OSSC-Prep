import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, FileText, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Card } from '../components';
import { EXAM_TYPES } from '../data/syllabus';
import toast from 'react-hot-toast';

const ExamSelectionPage = () => {
  const navigate = useNavigate();
  const { user, selectExam, selectedExam } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if exam already selected
  React.useEffect(() => {
    if (selectedExam) {
      navigate('/dashboard');
    }
  }, [selectedExam, navigate]);

  const handleSelectExam = async (examType) => {
    setIsLoading(true);
    try {
      await selectExam(examType);
      toast.success(`${examType} exam selected! Let's start preparing.`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to select exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exams = [
    {
      type: EXAM_TYPES.RI,
      title: 'Revenue Inspector',
      titleOdia: 'ରାଜସ୍ୱ ନିରୀକ୍ଷକ',
      description: 'OSSC Revenue Inspector (RI) examination for Odisha state government recruitment.',
      features: [
        '100 MCQ Questions',
        '90 Minutes Duration',
        '0.25 Negative Marking',
        '6 Subjects Covered'
      ],
      subjects: [
        'Reasoning & Mental Ability',
        'Quantitative Aptitude',
        'English Language',
        'Odia Language',
        'General Knowledge',
        'Odisha GK'
      ],
      available: true,
      popular: true
    },
    {
      type: EXAM_TYPES.AI,
      title: 'Assistant Inspector',
      titleOdia: 'ସହକାରୀ ନିରୀକ୍ଷକ',
      description: 'OSSC Assistant Inspector (AI) examination - Coming Soon!',
      features: [
        '100 MCQ Questions',
        '90 Minutes Duration',
        '0.25 Negative Marking',
        'Similar to RI Pattern'
      ],
      subjects: [
        'Reasoning & Mental Ability',
        'Quantitative Aptitude',
        'English Language',
        'Odia Language',
        'General Knowledge',
        'Odisha GK'
      ],
      available: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
      <div className="container-app">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-secondary-800 mb-2">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-secondary-600 text-lg">
            Select the exam you want to prepare for
          </p>
        </motion.div>

        {/* Exam Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {exams.map((exam, index) => (
            <motion.div
              key={exam.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`card relative overflow-hidden ${
                !exam.available ? 'opacity-70' : ''
              }`}>
                {/* Popular Badge */}
                {exam.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="badge-success">
                      🔥 Most Popular
                    </span>
                  </div>
                )}
                
                {/* Coming Soon Badge */}
                {exam.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="badge-warning">
                      🚀 Coming Soon
                    </span>
                  </div>
                )}

                {/* Exam Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary-600">{exam.type}</span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-secondary-800 mb-1">
                  {exam.title}
                </h2>
                <p className="text-secondary-500 font-odia mb-4">
                  {exam.titleOdia}
                </p>

                {/* Description */}
                <p className="text-secondary-600 mb-6">
                  {exam.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {exam.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-secondary-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Subjects Preview */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-secondary-700 mb-2">Subjects:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.slice(0, 4).map((subject, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-secondary-100 rounded-full text-secondary-600">
                        {subject}
                      </span>
                    ))}
                    {exam.subjects.length > 4 && (
                      <span className="text-xs px-2 py-1 bg-secondary-100 rounded-full text-secondary-600">
                        +{exam.subjects.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  fullWidth
                  variant={exam.available ? 'primary' : 'secondary'}
                  disabled={!exam.available || isLoading}
                  onClick={() => handleSelectExam(exam.type)}
                  icon={ArrowRight}
                  iconPosition="right"
                  isLoading={isLoading}
                >
                  {exam.available ? 'Start Preparation' : 'Coming Soon'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mt-12 text-center"
        >
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="text-primary-600" size={20} />
              <span className="font-semibold text-primary-700">Why Choose OSSC Exam Prep?</span>
            </div>
            <p className="text-secondary-600">
              Our AI-powered platform generates unlimited practice questions following the exact 
              OSSC pattern. Get personalized recommendations, track your progress, and focus on 
              your weak areas to maximize your score.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamSelectionPage;
