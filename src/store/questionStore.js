import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateQuestions } from '../services/aiService';
import { useAuthStore } from './authStore';

// Helper to get previously asked question hashes to avoid repeats
const getAskedQuestionsCache = () => {
  try {
    return JSON.parse(localStorage.getItem('ossc-asked-questions') || '[]');
  } catch {
    return [];
  }
};

const saveAskedQuestionsCache = (questions) => {
  try {
    const cache = getAskedQuestionsCache();
    const newHashes = questions.map(q => q.question.substring(0, 50).toLowerCase());
    const updated = [...new Set([...cache, ...newHashes])].slice(-500); // Keep last 500
    localStorage.setItem('ossc-asked-questions', JSON.stringify(updated));
  } catch {
    console.warn('Could not save question cache');
  }
};

// Emergency fallback questions - ALWAYS works even when everything else fails
const createEmergencyQuestions = (count, exam, subject, topic, difficulty) => {
  const emergencyBank = [
    { question: 'Which river is known as the "Sorrow of Odisha"?', options: ['Mahanadi', 'Brahmani', 'Baitarani', 'Rushikulya'], correctAnswer: 0, explanation: 'Mahanadi is called the Sorrow of Odisha due to frequent floods.' },
    { question: 'If COMPUTER is coded as RFUVQNPC, how will PRINTER be coded?', options: ['QSJOUFQ', 'SFUOJSQ', 'QSFUOJS', 'OSJUSQF'], correctAnswer: 1, explanation: 'Each letter is shifted by its position in the word and then reversed.' },
    { question: 'If 40% of a number is 64, what is 75% of that number?', options: ['100', '120', '140', '160'], correctAnswer: 1, explanation: 'If 40% = 64, then 100% = 160. So 75% of 160 = 120.' },
    { question: 'Choose the correct synonym of "ELOQUENT":', options: ['Silent', 'Articulate', 'Confused', 'Hesitant'], correctAnswer: 1, explanation: 'Eloquent means fluent or persuasive. Articulate is the closest synonym.' },
    { question: 'Which shortcut key is used to copy selected text?', options: ['Ctrl + V', 'Ctrl + X', 'Ctrl + C', 'Ctrl + P'], correctAnswer: 2, explanation: 'Ctrl + C is the universal shortcut for copying selected content.' },
    { question: 'The Jagannath Temple at Puri was built by which ruler?', options: ['Anantavarman Chodaganga', 'Narasimhadeva I', 'Kapilendra Deva', 'Mukunda Deva'], correctAnswer: 0, explanation: 'Anantavarman Chodaganga of the Eastern Ganga dynasty built the temple in 12th century.' },
    { question: 'Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64', options: ['17', '37', '50', '64'], correctAnswer: 3, explanation: 'The pattern is n² + 1. 64 does not follow this pattern (should be 65).' },
    { question: 'The ratio of two numbers is 3:4. If their HCF is 5, what is their LCM?', options: ['45', '60', '75', '90'], correctAnswer: 1, explanation: 'Numbers are 15 and 20. LCM = (15 × 20) / 5 = 60.' },
    { question: 'One who speaks many languages is called:', options: ['Linguist', 'Polyglot', 'Grammarian', 'Orator'], correctAnswer: 1, explanation: 'Polyglot specifically means a person who knows several languages.' },
    { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Central Program Unit', 'Computer Processing Unit', 'Central Processor Utility'], correctAnswer: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer.' },
    { question: 'Odisha became a separate state on which date?', options: ['1st April 1936', '26th January 1950', '15th August 1947', '1st November 1956'], correctAnswer: 0, explanation: 'Odisha (then Orissa) became a separate province on 1st April 1936.' },
    { question: 'Complete the series: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: 1, explanation: 'Pattern: +4, +6, +8, +10, +12. So 30 + 12 = 42.' },
  ];

  const shuffled = [...emergencyBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, idx) => ({
    id: `emergency_${Date.now()}_${idx}`,
    ...q,
    exam,
    subject,
    topic,
    difficulty,
    language: 'en',
    source: 'Emergency Fallback',
    generatedAt: new Date().toISOString()
  }));
};

// Questions Store - Manages question generation and storage
export const useQuestionStore = create(
  persist(
    (set, get) => ({
      questions: [],
      savedQuestions: [], // All saved questions for offline use
      currentQuestion: null,
      currentIndex: 0,
      isLoading: false,
      isGenerating: false,
      error: null,

      // Generate new questions using AI
      generateNewQuestions: async (params) => {
        set({ isGenerating: true, error: null });
        
        const { exam, subject, topic, difficulty, count = 10, language = 'en' } = params;
        
        let generatedQuestions = [];
        
        try {
          // Generate questions using AI (will fallback internally if API fails)
          generatedQuestions = await generateQuestions({
            exam,
            subject,
            topic,
            difficulty,
            count,
            language
          });
          
          console.log(`✅ Got ${generatedQuestions?.length || 0} questions from generateQuestions`);
        } catch (aiError) {
          console.warn('generateQuestions threw error:', aiError.message);
        }

        // GUARANTEED: If still no questions, use any saved questions
        if (!generatedQuestions || generatedQuestions.length === 0) {
          console.log('📦 Using saved questions as last resort...');
          const { savedQuestions } = get();
          
          if (savedQuestions.length > 0) {
            generatedQuestions = savedQuestions
              .sort(() => Math.random() - 0.5)
              .slice(0, count);
            console.log(`📦 Using ${generatedQuestions.length} saved questions`);
          }
        }

        // FINAL SAFETY: If still no questions, create minimal fallback
        if (!generatedQuestions || generatedQuestions.length === 0) {
          console.log('🆘 Creating emergency fallback questions');
          generatedQuestions = createEmergencyQuestions(count, exam, subject, topic, difficulty);
        }

        // Process questions
        const finalQuestions = generatedQuestions.map((q, index) => ({
          id: q.id || `q_${Date.now()}_${index}`,
          ...q,
          exam: q.exam || exam,
          subject: q.subject || subject,
          topic: q.topic || topic,
          difficulty: q.difficulty || difficulty,
          language: q.language || language,
          createdAt: q.createdAt || new Date().toISOString(),
          source: q.source || 'Fallback'
        }));

        // Save to cache
        saveAskedQuestionsCache(finalQuestions);

        // Save to local storage for offline access
        const { savedQuestions } = get();
        const updatedSaved = [...savedQuestions, ...finalQuestions].slice(-200);

        set({ 
          questions: finalQuestions, 
          savedQuestions: updatedSaved,
          currentIndex: 0,
          currentQuestion: finalQuestions[0] || null,
          isGenerating: false,
          error: null
        });

        // Save to Firestore in background (non-blocking)
        finalQuestions.forEach(q => {
          addDoc(collection(db, 'questions'), q).catch(e => 
            console.warn('Firestore save failed:', e)
          );
        });
        
        return finalQuestions;
      },

  // Fetch existing questions from Firestore
  fetchQuestions: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const { exam, subject, topic, difficulty, limitCount = 20 } = params;
      
      let q = query(collection(db, 'questions'));
      
      // Build query with filters
      const conditions = [];
      if (exam) conditions.push(where('exam', '==', exam));
      if (subject) conditions.push(where('subject', '==', subject));
      if (topic) conditions.push(where('topic', '==', topic));
      if (difficulty) conditions.push(where('difficulty', '==', difficulty));
      
      if (conditions.length > 0) {
        q = query(collection(db, 'questions'), ...conditions, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      set({ 
        questions, 
        currentIndex: 0,
        currentQuestion: questions[0] || null,
        isLoading: false 
      });
      
      return questions;
    } catch (error) {
      console.error('Fetch questions error:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Set current question by index
  setCurrentQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ 
        currentIndex: index, 
        currentQuestion: questions[index] 
      });
    }
  },

  // Move to next question
  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ 
        currentIndex: currentIndex + 1, 
        currentQuestion: questions[currentIndex + 1] 
      });
      return true;
    }
    return false;
  },

  // Move to previous question
  previousQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex > 0) {
      set({ 
        currentIndex: currentIndex - 1, 
        currentQuestion: questions[currentIndex - 1] 
      });
      return true;
    }
    return false;
  },

  // Get saved questions by topic (for offline use)
  getSavedQuestionsByTopic: (topic) => {
    const { savedQuestions } = get();
    return savedQuestions.filter(q => q.topic === topic);
  },

  // Get saved questions by subject
  getSavedQuestionsBySubject: (subject) => {
    const { savedQuestions } = get();
    return savedQuestions.filter(q => q.subject === subject);
  },

  // Reset questions
  resetQuestions: () => {
    set({ 
      questions: [], 
      currentQuestion: null, 
      currentIndex: 0,
      error: null 
    });
  },

  // Clear all saved questions
  clearSavedQuestions: () => {
    set({ savedQuestions: [] });
    localStorage.removeItem('ossc-asked-questions');
  },

  // Clear error
  clearError: () => set({ error: null })
}),
{
  name: 'question-storage',
  partialize: (state) => ({
    savedQuestions: state.savedQuestions
  })
}
));

export default useQuestionStore;
