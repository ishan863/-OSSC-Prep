// Local Questions Service - Uses pre-generated questions from Groq API
// 2485 unique questions across 6 subjects and 88 topics
// STRICT topic matching - NO mixing of questions between topics

import allQuestionsData from '../data/questions/merged_questions.json';
import topicMapping from '../data/questions/topic_mapping.json';
import { 
  getQuestionTopicsForSyllabusTopic, 
  getSubjectNameFromId,
  SUBJECT_ID_TO_NAME 
} from '../data/topicSyllabusMapping';

// Index for tracking which questions have been used to avoid repetition
const usedQuestionIds = new Set();

// Build question index by ID for fast lookup
const questionIndex = new Map();
allQuestionsData.forEach(q => {
  questionIndex.set(q.id, q);
});

// Parse and normalize a single question
const parseQuestion = (q) => ({
  id: q.id,
  question: q.question,
  options: [
    q.options?.A || q.options?.[0] || '',
    q.options?.B || q.options?.[1] || '',
    q.options?.C || q.options?.[2] || '',
    q.options?.D || q.options?.[3] || ''
  ],
  correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
  explanation: q.explanation || '',
  subject: q.subject,
  topic: q.topic,
  subtopic: q.subtopic,
  difficulty: q.difficulty || 'medium',
  generatedAt: q.generatedAt,
  source: 'Local (Groq)'
});

// Subject name normalization - handles syllabus IDs and name variations
const normalizeSubject = (subject) => {
  if (!subject) return null;
  
  // Check if it's a syllabus ID first (e.g., 'ri-reasoning', 'ai-english')
  if (SUBJECT_ID_TO_NAME[subject]) {
    return getSubjectNameFromId(subject);
  }
  
  const mapping = {
    // Name variations
    'reasoning & mental ability': 'Reasoning & Mental Ability',
    'reasoning and mental ability': 'Reasoning & Mental Ability',
    'reasoning': 'Reasoning & Mental Ability',
    'quantitative aptitude': 'Quantitative Aptitude',
    'quantitative': 'Quantitative Aptitude',
    'english language': 'English Language',
    'english': 'English Language',
    'general knowledge': 'General Knowledge',
    'gk': 'General Knowledge',
    'odisha gk': 'Odisha GK',
    'odia language': 'Odia Language',
    'odia': 'Odia Language'
  };
  
  const key = subject.toLowerCase().trim();
  return mapping[key] || subject;
};

// Find topics matching the syllabus topic ID or name
// Returns array of { subject, topic, count, questionIds } for all matching question topics
const findMatchingTopics = (subject, syllabusTopicIdOrName) => {
  if (!syllabusTopicIdOrName) return [];
  
  const normalizedSubject = normalizeSubject(subject);
  
  // Get the actual question topic names from our syllabus mapping
  const questionTopicNames = getQuestionTopicsForSyllabusTopic(syllabusTopicIdOrName);
  
  console.log(`🔍 Mapping syllabus topic "${syllabusTopicIdOrName}" -> Question topics:`, questionTopicNames);
  
  const matchingTopics = [];
  
  // Search through all subjects in topic mapping
  for (const [mappingSubject, subjectTopics] of Object.entries(topicMapping)) {
    // If subject is specified, only search in that subject
    if (normalizedSubject && !mappingSubject.toLowerCase().includes(normalizedSubject.toLowerCase()) &&
        !normalizedSubject.toLowerCase().includes(mappingSubject.toLowerCase())) {
      continue;
    }
    
    for (const [topicName, data] of Object.entries(subjectTopics)) {
      // Check if this topic matches any of our mapped question topic names
      const isMatch = questionTopicNames.some(qTopic => 
        qTopic.toLowerCase() === topicName.toLowerCase() ||
        topicName.toLowerCase().includes(qTopic.toLowerCase()) ||
        qTopic.toLowerCase().includes(topicName.toLowerCase())
      );
      
      if (isMatch) {
        matchingTopics.push({
          subject: mappingSubject,
          topic: topicName,
          count: data.count,
          questionIds: data.questionIds
        });
      }
    }
  }
  
  return matchingTopics;
};

// Find exact topic match in question data (backward compatible)
const findExactTopic = (subject, topic) => {
  const matches = findMatchingTopics(subject, topic);
  return matches.length > 0 ? matches[0] : null;
};

// Shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get questions with STRICT topic matching
export const getLocalQuestions = (params) => {
  const { 
    exam = 'RI', 
    subject, 
    topic, 
    difficulty, 
    count = 10,
    excludeIds = [],
    strictTopicMatch = true  // Enforce strict matching by default
  } = params;
  
  const normalizedSubject = normalizeSubject(subject);
  
  console.log('📦 Getting local questions:', { 
    subject: normalizedSubject, 
    topic, 
    difficulty, 
    count,
    strictTopicMatch 
  });
  
  // If topic is specified, use STRICT matching - get ALL matching topics
  if (topic && strictTopicMatch) {
    const matchingTopics = findMatchingTopics(subject, topic);
    
    if (matchingTopics.length > 0) {
      console.log(`📋 Found ${matchingTopics.length} matching topic(s):`);
      matchingTopics.forEach(t => console.log(`   - ${t.topic}: ${t.count} questions`));
      
      // Collect all question IDs from ALL matching topics
      const allQuestionIds = new Set();
      matchingTopics.forEach(topicInfo => {
        topicInfo.questionIds.forEach(id => allQuestionIds.add(id));
      });
      
      // Get questions by ID from all matching topics
      let topicQuestions = Array.from(allQuestionIds)
        .filter(id => !excludeIds.includes(id) && !usedQuestionIds.has(id))
        .map(id => questionIndex.get(id))
        .filter(q => q !== undefined);
      
      // Filter by difficulty if specified
      if (difficulty) {
        const diffFiltered = topicQuestions.filter(q => 
          q.difficulty?.toLowerCase() === difficulty.toLowerCase()
        );
        if (diffFiltered.length > 0) {
          topicQuestions = diffFiltered;
        }
      }
      
      // Shuffle and select
      const shuffled = shuffleArray(topicQuestions);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      
      // Mark as used
      selected.forEach(q => usedQuestionIds.add(q.id));
      
      // Parse and return
      const questions = selected.map(q => ({
        ...parseQuestion(q),
        exam,
        language: 'en'
      }));
      
      console.log(`✅ Returning ${questions.length} questions from ${matchingTopics.length} matching topic(s)`);
      return questions;
    } else {
      console.log(`⚠️ No matching topics found for "${topic}"`);
    }
  }
  
  // Fallback: Filter from all questions (for subject-only or mixed queries)
  let filtered = allQuestionsData.filter(q => {
    // Exclude used questions
    if (excludeIds.includes(q.id) || usedQuestionIds.has(q.id)) {
      return false;
    }
    
    // Filter by subject (STRICT)
    if (normalizedSubject) {
      const qSubject = normalizeSubject(q.subject);
      if (qSubject !== normalizedSubject) {
        return false;
      }
    }
    
    // Filter by topic (STRICT - exact match)
    if (topic && strictTopicMatch) {
      if (q.topic !== topic && q.topic?.toLowerCase() !== topic.toLowerCase()) {
        return false;
      }
    }
    
    // Filter by difficulty
    if (difficulty && q.difficulty?.toLowerCase() !== difficulty.toLowerCase()) {
      return false;
    }
    
    return true;
  });
  
  console.log(`📊 Found ${filtered.length} matching questions`);
  
  // Shuffle and select
  const shuffled = shuffleArray(filtered);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // Mark as used
  selected.forEach(q => usedQuestionIds.add(q.id));
  
  // Parse and return
  const questions = selected.map(q => ({
    ...parseQuestion(q),
    exam,
    language: 'en'
  }));
  
  console.log(`✅ Returning ${questions.length} questions`);
  return questions;
};

// Get all available topics for a subject
export const getTopicsForSubject = (subject) => {
  const normalizedSubject = normalizeSubject(subject);
  const subjectTopics = topicMapping[normalizedSubject];
  
  if (!subjectTopics) return [];
  
  return Object.entries(subjectTopics)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      available: data.questionIds.filter(id => !usedQuestionIds.has(id)).length
    }))
    .sort((a, b) => b.count - a.count);
};

// Get questions by subject for practice mode
export const getQuestionsBySubject = (subjectId, count = 10) => {
  return getLocalQuestions({ subject: subjectId, count, strictTopicMatch: false });
};

// Get questions by specific topic (STRICT)
export const getQuestionsByTopic = (subject, topic, count = 10) => {
  return getLocalQuestions({ 
    subject, 
    topic, 
    count, 
    strictTopicMatch: true 
  });
};

// Get questions for mock test (mixed subjects based on syllabus weightage)
export const getMockTestQuestions = (exam = 'RI', totalQuestions = 100) => {
  console.log(`📝 Generating mock test: ${exam}, ${totalQuestions} questions`);
  
  // Question distribution based on syllabus weightage
  const distribution = [
    { subject: 'Reasoning and Mental Ability', percentage: 0.25 },
    { subject: 'Quantitative Aptitude', percentage: 0.25 },
    { subject: 'English Language', percentage: 0.15 },
    { subject: 'General Knowledge', percentage: 0.15 },
    { subject: 'Odisha GK', percentage: 0.10 },
    { subject: 'Odia Language', percentage: 0.10 }
  ];
  
  let mockQuestions = [];
  const usedIds = [];
  
  for (const { subject, percentage } of distribution) {
    const count = Math.round(totalQuestions * percentage);
    const subjectQuestions = getLocalQuestions({ 
      exam, 
      subject, 
      count, 
      excludeIds: usedIds,
      strictTopicMatch: false  // Allow mixed topics within subject
    });
    
    mockQuestions = [...mockQuestions, ...subjectQuestions];
    subjectQuestions.forEach(q => usedIds.push(q.id));
  }
  
  // Shuffle final list
  return shuffleArray(mockQuestions).slice(0, totalQuestions);
};

// Get daily practice questions
export const getDailyQuestions = (exam = 'RI', count = 10) => {
  const subjects = [
    'Reasoning and Mental Ability',
    'Quantitative Aptitude',
    'English Language',
    'General Knowledge',
    'Odisha GK',
    'Odia Language'
  ];
  
  const dayIndex = new Date().getDay();
  const todaySubject = subjects[dayIndex % subjects.length];
  
  console.log(`📅 Daily practice: ${todaySubject}`);
  
  return getLocalQuestions({ 
    exam, 
    subject: todaySubject, 
    count,
    strictTopicMatch: false 
  });
};

// Reset used questions
export const resetUsedQuestions = () => {
  usedQuestionIds.clear();
  console.log('🔄 Reset used questions tracker');
};

// Get question statistics
export const getQuestionStats = () => {
  const stats = {
    total: allQuestionsData.length,
    used: usedQuestionIds.size,
    available: allQuestionsData.length - usedQuestionIds.size,
    bySubject: {},
    byTopic: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 }
  };
  
  // Count from topic mapping
  for (const [subject, topics] of Object.entries(topicMapping)) {
    let subjectTotal = 0;
    for (const [topic, data] of Object.entries(topics)) {
      stats.byTopic[`${subject} > ${topic}`] = data.count;
      subjectTotal += data.count;
    }
    stats.bySubject[subject] = subjectTotal;
  }
  
  // Count by difficulty
  allQuestionsData.forEach(q => {
    const diff = (q.difficulty || 'medium').toLowerCase();
    if (stats.byDifficulty[diff] !== undefined) {
      stats.byDifficulty[diff]++;
    }
  });
  
  return stats;
};

// Get topic count for a specific subject and topic
export const getTopicQuestionCount = (subject, topic) => {
  const topicInfo = findExactTopic(subject, topic);
  return topicInfo ? topicInfo.count : 0;
};

// Reload questions
export const reloadQuestions = () => {
  usedQuestionIds.clear();
  console.log(`🔄 Reloaded ${allQuestionsData.length} questions`);
  return allQuestionsData.length;
};

export default {
  getLocalQuestions,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getTopicsForSubject,
  getMockTestQuestions,
  getDailyQuestions,
  resetUsedQuestions,
  getQuestionStats,
  getTopicQuestionCount,
  reloadQuestions
};
