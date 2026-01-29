import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, BookOpen, CheckCircle, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, ProgressBar, Button } from '../components';
import { getSyllabus } from '../data/syllabus';
import { useNavigate } from 'react-router-dom';

const SyllabusPage = () => {
  const navigate = useNavigate();
  const { selectedExam, preferredLanguage } = useAuthStore();
  const [expandedSubject, setExpandedSubject] = useState(null);
  
  const syllabus = getSyllabus(selectedExam);

  const toggleSubject = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const handlePracticeTopic = (subjectId, topicId) => {
    navigate(`/practice/${subjectId}/${topicId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <BookOpen className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-800">
              {preferredLanguage === 'or' ? 'ପାଠ୍ୟକ୍ରମ' : 'Syllabus'}
            </h1>
            <p className="text-secondary-500">
              {syllabus.examName} - Complete Syllabus
            </p>
          </div>
        </div>
      </motion.div>

      {/* Exam Info Card */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{syllabus.totalQuestions}</p>
            <p className="text-sm text-secondary-600">Total Questions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{syllabus.duration} min</p>
            <p className="text-sm text-secondary-600">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{syllabus.totalMarks}</p>
            <p className="text-sm text-secondary-600">Total Marks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">-{syllabus.negativeMarking}</p>
            <p className="text-sm text-secondary-600">Negative Marking</p>
          </div>
        </div>
      </Card>

      {/* Subjects List */}
      <div className="space-y-4">
        {syllabus.subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden" padding="none">
              {/* Subject Header */}
              <button
                onClick={() => toggleSubject(subject.id)}
                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">
                      {subject.questionCount}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-secondary-800 text-lg">
                      {subject.name}
                    </h3>
                    <p className={`text-sm text-secondary-500 ${preferredLanguage === 'or' ? 'font-odia' : ''}`}>
                      {preferredLanguage === 'or' ? subject.nameOdia : `${subject.topics.length} Topics • ${subject.weightage}% Weightage`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block w-32">
                    <ProgressBar
                      current={Math.floor(Math.random() * subject.topics.length)}
                      total={subject.topics.length}
                      showPercentage={false}
                      size="small"
                    />
                  </div>
                  {expandedSubject === subject.id ? (
                    <ChevronDown className="text-secondary-400" size={24} />
                  ) : (
                    <ChevronRight className="text-secondary-400" size={24} />
                  )}
                </div>
              </button>

              {/* Topics List */}
              <AnimatePresence>
                {expandedSubject === subject.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-secondary-100"
                  >
                    <div className="p-4 md:p-6 bg-secondary-50/50">
                      <div className="grid gap-3">
                        {subject.topics.map((topic, topicIndex) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: topicIndex * 0.03 }}
                            className="bg-white rounded-xl p-4 border border-secondary-100 hover:border-primary-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                                    {topicIndex + 1}
                                  </span>
                                  <h4 className="font-medium text-secondary-800">
                                    {topic.name}
                                  </h4>
                                </div>
                                <p className={`text-sm text-secondary-500 ml-8 ${preferredLanguage === 'or' ? 'font-odia' : ''}`}>
                                  {preferredLanguage === 'or' ? topic.nameOdia : ''}
                                </p>
                                
                                {/* Subtopics */}
                                {topic.subtopics && topic.subtopics.length > 0 && (
                                  <div className="mt-2 ml-8 flex flex-wrap gap-2">
                                    {topic.subtopics.map((subtopic, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-secondary-100 rounded-full text-secondary-600"
                                      >
                                        {subtopic}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Difficulty Distribution */}
                                <div className="mt-3 ml-8 flex items-center gap-3 text-xs">
                                  <span className="text-green-600">Easy: {topic.difficulty?.easy || 0}%</span>
                                  <span className="text-yellow-600">Medium: {topic.difficulty?.medium || 0}%</span>
                                  <span className="text-red-600">Hard: {topic.difficulty?.hard || 0}%</span>
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handlePracticeTopic(subject.id, topic.id)}
                                icon={Target}
                              >
                                Practice
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-secondary-800 mb-3">Understanding the Syllabus</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-500 mt-0.5" size={16} />
            <div>
              <p className="font-medium text-secondary-700">Questions Count</p>
              <p className="text-secondary-500">Number in the circle shows expected questions</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Target className="text-primary-500 mt-0.5" size={16} />
            <div>
              <p className="font-medium text-secondary-700">Weightage</p>
              <p className="text-secondary-500">Percentage of total marks for each subject</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="text-yellow-500 mt-0.5" size={16} />
            <div>
              <p className="font-medium text-secondary-700">Difficulty</p>
              <p className="text-secondary-500">Distribution of easy, medium, hard questions</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SyllabusPage;
