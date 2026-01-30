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
        
        try {
          const { exam, subject, topic, difficulty, count = 10, language = 'en' } = params;
          
          // Generate questions using AI (will fallback internally if API fails)
          let generatedQuestions = [];
          try {
            generatedQuestions = await generateQuestions({
              exam,
              subject,
              topic,
              difficulty,
              count,
              language
            });
          } catch (aiError) {
            console.warn('AI generation failed, questions should be fallback:', aiError);
          }

          // Ensure we always have questions (use saved ones if generation completely fails)
          if (!generatedQuestions || generatedQuestions.length === 0) {
            console.log('📦 No questions from AI, using saved questions...');
            const { savedQuestions } = get();
            const matchingSaved = savedQuestions.filter(q => 
              q.subject === subject || q.exam === exam
            );
            
            if (matchingSaved.length >= count) {
              generatedQuestions = matchingSaved
                .sort(() => Math.random() - 0.5)
                .slice(0, count);
            } else {
              // Return error only if no saved questions either
              set({ isGenerating: false, error: 'No questions available' });
              throw new Error('No questions available');
            }
          }

          // Filter out any duplicate questions
          const askedCache = getAskedQuestionsCache();
          const uniqueQuestions = generatedQuestions.filter(q => {
            const hash = q.question.substring(0, 50).toLowerCase();
            return !askedCache.includes(hash);
          });

          // Use all questions if filtering removed too many
          const finalQuestions = uniqueQuestions.length >= 3 ? uniqueQuestions : generatedQuestions;

          // Add IDs locally (don't wait for Firestore)
          const questionsWithIds = finalQuestions.map((q, index) => ({
            id: q.id || `q_${Date.now()}_${index}`,
            ...q,
            exam,
            subject,
            topic,
            difficulty,
            language,
            createdAt: new Date().toISOString(),
            source: q.source || 'AI-Generated'
          }));

          // Save to cache to prevent future repeats
          saveAskedQuestionsCache(questionsWithIds);

          // Save to local storage for offline access
          const { savedQuestions } = get();
          const updatedSaved = [...savedQuestions, ...questionsWithIds].slice(-200); // Keep last 200

          set({ 
            questions: questionsWithIds, 
            savedQuestions: updatedSaved,
            currentIndex: 0,
            currentQuestion: questionsWithIds[0] || null,
            isGenerating: false 
          });

          // Save to Firestore in background (non-blocking)
          questionsWithIds.forEach(q => {
            addDoc(collection(db, 'questions'), q).catch(e => 
              console.warn('Firestore save failed:', e)
            );
          });
          
          return questionsWithIds;
        } catch (error) {
          console.error('Question generation error:', error);
          set({ isGenerating: false, error: error.message });
          throw error;
        }
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
