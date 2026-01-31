// Firestore Questions Service - Upload and manage questions in Firestore
// This service handles pushing questions to Firestore and retrieving them

import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

import mergedQuestions from '../data/questions/merged_questions.json';
import topicMapping from '../data/questions/topic_mapping.json';

// Collection names
const COLLECTIONS = {
  QUESTIONS: 'questions',
  METADATA: 'metadata',
  SUBJECTS: 'subjects',
  TOPICS: 'topics'
};

// Get question statistics - Uses topic mapping for accurate counts
export const getQuestionStats = () => {
  const stats = {
    total: mergedQuestions.length,
    bySubject: {},
    byTopic: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 }
  };
  
  // Use topic mapping for accurate subject/topic counts
  for (const [subject, topics] of Object.entries(topicMapping)) {
    let subjectTotal = 0;
    for (const [topic, data] of Object.entries(topics)) {
      stats.byTopic[`${subject} > ${topic}`] = data.count;
      subjectTotal += data.count;
    }
    stats.bySubject[subject] = subjectTotal;
  }
  
  // Count by difficulty from questions
  for (const q of mergedQuestions) {
    const diff = (q.difficulty || 'medium').toLowerCase();
    if (stats.byDifficulty[diff] !== undefined) {
      stats.byDifficulty[diff]++;
    }
  }
  
  return stats;
};

// Get questions by subject
export const getQuestionsBySubject = (subject) => {
  return mergedQuestions.filter(q => {
    const qSubject = (q.subject || '').toLowerCase();
    const searchSubject = subject.toLowerCase();
    return qSubject.includes(searchSubject) || searchSubject.includes(qSubject);
  });
};

// Get questions by topic
export const getQuestionsByTopic = (subject, topic) => {
  return mergedQuestions.filter(q => {
    const matchSubject = !subject || (q.subject || '').toLowerCase().includes(subject.toLowerCase());
    const matchTopic = !topic || (q.topic || '').toLowerCase().includes(topic.toLowerCase());
    return matchSubject && matchTopic;
  });
};

// Get random questions for practice/test
export const getRandomQuestions = (count = 10, options = {}) => {
  const { subject, topic, difficulty, excludeIds = [] } = options;
  
  let filtered = [...mergedQuestions];
  
  // Apply filters
  if (subject) {
    filtered = filtered.filter(q => 
      (q.subject || '').toLowerCase().includes(subject.toLowerCase())
    );
  }
  
  if (topic) {
    filtered = filtered.filter(q => 
      (q.topic || '').toLowerCase().includes(topic.toLowerCase())
    );
  }
  
  if (difficulty) {
    filtered = filtered.filter(q => 
      (q.difficulty || '').toLowerCase() === difficulty.toLowerCase()
    );
  }
  
  // Exclude already used questions
  if (excludeIds.length > 0) {
    filtered = filtered.filter(q => !excludeIds.includes(q.id));
  }
  
  // Shuffle and pick
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Upload questions to Firestore (batch upload)
export const uploadQuestionsToFirestore = async (progressCallback) => {
  const batch = writeBatch(db);
  const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
  
  let uploaded = 0;
  const total = mergedQuestions.length;
  const batchSize = 500; // Firestore batch limit
  
  try {
    for (let i = 0; i < total; i += batchSize) {
      const chunk = mergedQuestions.slice(i, i + batchSize);
      const currentBatch = writeBatch(db);
      
      for (const question of chunk) {
        const docRef = doc(questionsRef, question.id);
        currentBatch.set(docRef, {
          ...question,
          uploadedAt: serverTimestamp()
        });
      }
      
      await currentBatch.commit();
      uploaded += chunk.length;
      
      if (progressCallback) {
        progressCallback({
          uploaded,
          total,
          percentage: Math.round((uploaded / total) * 100)
        });
      }
    }
    
    // Update metadata
    const metadataRef = doc(db, COLLECTIONS.METADATA, 'questions');
    await setDoc(metadataRef, {
      totalQuestions: total,
      lastUpdated: serverTimestamp(),
      subjects: Object.keys(getQuestionStats().bySubject)
    });
    
    return { success: true, uploaded };
  } catch (error) {
    console.error('Error uploading to Firestore:', error);
    return { success: false, error: error.message };
  }
};

// Get all unique subjects
export const getSubjects = () => {
  const subjects = new Set();
  mergedQuestions.forEach(q => {
    if (q.subject) subjects.add(q.subject);
  });
  return Array.from(subjects);
};

// Get topics for a subject
export const getTopicsForSubject = (subject) => {
  const topics = new Set();
  mergedQuestions
    .filter(q => (q.subject || '').toLowerCase().includes(subject.toLowerCase()))
    .forEach(q => {
      if (q.topic) topics.add(q.topic);
    });
  return Array.from(topics);
};

// Format questions for quiz
export const formatQuestionsForQuiz = (questions) => {
  return questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options ? [
      q.options.A || q.options[0],
      q.options.B || q.options[1],
      q.options.C || q.options[2],
      q.options.D || q.options[3]
    ] : [],
    correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
    explanation: q.explanation || '',
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty
  }));
};

export default {
  getQuestionStats,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getRandomQuestions,
  uploadQuestionsToFirestore,
  getSubjects,
  getTopicsForSubject,
  formatQuestionsForQuiz,
  totalQuestions: mergedQuestions.length
};
