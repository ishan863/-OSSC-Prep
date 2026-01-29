import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  BookOpen, 
  Target, 
  ArrowRight,
  Filter,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, Button, Select } from '../components';
import { getSyllabus, DIFFICULTY_LEVELS } from '../data/syllabus';

const PracticePage = () => {
  const navigate = useNavigate();
  const { selectedExam, preferredLanguage } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  
  const syllabus = getSyllabus(selectedExam);

  const subjectOptions = syllabus.subjects.map(s => ({
    value: s.id,
    label: s.name
  }));

  const difficultyOptions = [
    { value: '', label: 'All Difficulties' },
    { value: DIFFICULTY_LEVELS.EASY, label: 'Easy' },
    { value: DIFFICULTY_LEVELS.MEDIUM, label: 'Medium' },
    { value: DIFFICULTY_LEVELS.HARD, label: 'Hard' }
  ];

  const filteredSubjects = selectedSubject 
    ? syllabus.subjects.filter(s => s.id === selectedSubject)
    : syllabus.subjects;

  const handleStartPractice = (subjectId, topicId) => {
    const params = new URLSearchParams();
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
    navigate(`/practice/${subjectId}/${topicId}?${params.toString()}`);
  };

  const handleQuickPractice = () => {
    // Random subject and topic
    const randomSubject = syllabus.subjects[Math.floor(Math.random() * syllabus.subjects.length)];
    const randomTopic = randomSubject.topics[Math.floor(Math.random() * randomSubject.topics.length)];
    navigate(`/practice/${randomSubject.id}/${randomTopic.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <ClipboardList className="text-primary-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ଅଭ୍ୟାସ' : 'Practice'}
            </h1>
            <p className="text-xs sm:text-sm text-secondary-500">
              Choose a topic to start
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleQuickPractice}
          icon={Zap}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-sm sm:text-base"
        >
          Quick Practice
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-secondary-500" />
          <h3 className="font-semibold text-secondary-700">Filters</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Select
            label="Subject"
            options={[{ value: '', label: 'All Subjects' }, ...subjectOptions]}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          />
          <Select
            label="Difficulty"
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          />
        </div>
      </Card>

      {/* Practice Modes Info */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-green-50 border-green-200 p-3 sm:p-6">
          <div className="text-center">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <BookOpen className="text-green-600" size={18} />
            </div>
            <h3 className="font-semibold text-secondary-800 text-xs sm:text-base">Topic-wise</h3>
            <p className="text-[10px] sm:text-sm text-secondary-500 mt-0.5 sm:mt-1 hidden sm:block">Focus on specific topics</p>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200 p-3 sm:p-6">
          <div className="text-center">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Target className="text-blue-600" size={18} />
            </div>
            <h3 className="font-semibold text-secondary-800 text-xs sm:text-base">AI-Generated</h3>
            <p className="text-[10px] sm:text-sm text-secondary-500 mt-0.5 sm:mt-1 hidden sm:block">Unlimited questions</p>
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-200 p-3 sm:p-6">
          <div className="text-center">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <ClipboardList className="text-purple-600" size={18} />
            </div>
            <h3 className="font-semibold text-secondary-800 text-xs sm:text-base">Explanations</h3>
            <p className="text-[10px] sm:text-sm text-secondary-500 mt-0.5 sm:mt-1 hidden sm:block">Learn from questions</p>
          </div>
        </Card>
      </div>

      {/* Subjects & Topics */}
      <div className="space-y-4 sm:space-y-6">
        {filteredSubjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="font-bold text-primary-600 text-sm sm:text-base">{subject.questionCount}</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-secondary-800">{subject.name}</h2>
                  <p className={`text-xs sm:text-sm text-secondary-500 ${preferredLanguage === 'or' ? 'font-odia' : ''}`}>
                    {preferredLanguage === 'or' ? subject.nameOdia : `${subject.topics.length} topics`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {subject.topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleStartPractice(subject.id, topic.id)}
                    className="p-3 sm:p-4 rounded-xl border-2 border-secondary-100 hover:border-primary-400 active:bg-primary-100 hover:bg-primary-50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-secondary-800 group-hover:text-primary-700 text-sm sm:text-base truncate">
                          {topic.name}
                        </h3>
                        <p className={`text-[10px] sm:text-xs text-secondary-500 mt-0.5 sm:mt-1 ${preferredLanguage === 'or' ? 'font-odia' : ''}`}>
                          {preferredLanguage === 'or' ? topic.nameOdia : `${topic.subtopics?.length || 0} subtopics`}
                        </p>
                      </div>
                      <ArrowRight 
                        className="text-secondary-300 group-hover:text-primary-500 transition-colors flex-shrink-0" 
                        size={18} 
                      />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSubjects.length === 0 && (
        <Card className="text-center py-12">
          <BookOpen className="mx-auto text-secondary-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-secondary-700 mb-2">No subjects found</h3>
          <p className="text-secondary-500">Try adjusting your filters</p>
        </Card>
      )}
    </div>
  );
};

export default PracticePage;
