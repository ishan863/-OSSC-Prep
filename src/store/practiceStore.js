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

// Helper to save results locally
const saveResultsLocally = (results) => {
  try {
    const existing = JSON.parse(localStorage.getItem('ossc-practice-results') || '[]');
    const updated = [results, ...existing].slice(0, 50); // Keep last 50 results
    localStorage.setItem('ossc-practice-results', JSON.stringify(updated));
  } catch {
    console.warn('Could not save results locally');
  }
};

const getLocalResults = () => {
  try {
    return JSON.parse(localStorage.getItem('ossc-practice-results') || '[]');
  } catch {
    return [];
  }
};

// Helper to save wrong questions locally
const saveWrongQuestionsLocally = (wrongQuestions, userId) => {
  try {
    const key = `ossc-wrong-questions-${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [...existing, ...wrongQuestions].slice(-100); // Keep last 100
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    console.warn('Could not save wrong questions locally');
  }
};

const getLocalWrongQuestions = (userId) => {
  try {
    const key = `ossc-wrong-questions-${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

// Practice Store - Manages practice sessions and attempts
export const usePracticeStore = create((set, get) => ({
  currentSession: null,
  attempts: [],
  answers: {},
  isSubmitting: false,
  sessionComplete: false,
  results: null,

  // Start a new practice session
  startSession: (questions, sessionType, metadata = {}) => {
    const session = {
      id: `session_${Date.now()}`,
      type: sessionType, // 'practice', 'mock', 'daily'
      questions,
      startTime: new Date().toISOString(),
      metadata,
      questionCount: questions.length
    };

    set({ 
      currentSession: session, 
      answers: {},
      attempts: [],
      sessionComplete: false,
      results: null
    });

    return session;
  },

  // Record an answer
  recordAnswer: (questionId, selectedOption, isCorrect, timeSpent = 0) => {
    const { answers, attempts } = get();
    
    const newAnswer = {
      questionId,
      selectedOption,
      isCorrect,
      timeSpent,
      answeredAt: new Date().toISOString()
    };

    set({
      answers: { ...answers, [questionId]: newAnswer },
      attempts: [...attempts, newAnswer]
    });
  },

  // Update answer (if user changes their answer)
  updateAnswer: (questionId, selectedOption, isCorrect, timeSpent = 0) => {
    const { answers } = get();
    
    const updatedAnswer = {
      ...answers[questionId],
      selectedOption,
      isCorrect,
      timeSpent,
      updatedAt: new Date().toISOString()
    };

    set({
      answers: { ...answers, [questionId]: updatedAnswer }
    });
  },

  // Complete session and calculate results
  completeSession: async (userId) => {
    const { currentSession, answers } = get();
    if (!currentSession) return null;

    set({ isSubmitting: true });

    try {
      const endTime = new Date().toISOString();
      const totalQuestions = currentSession.questions.length;
      
      // Calculate statistics
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let totalTime = 0;
      const wrongQuestions = [];
      const topicWiseStats = {};

      currentSession.questions.forEach((question) => {
        const answer = answers[question.id];
        const topic = question.topic || 'unknown';
        
        // Initialize topic stats
        if (!topicWiseStats[topic]) {
          topicWiseStats[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
        }
        topicWiseStats[topic].total++;

        if (!answer) {
          skipped++;
          topicWiseStats[topic].skipped++;
        } else if (answer.isCorrect) {
          correct++;
          topicWiseStats[topic].correct++;
          totalTime += answer.timeSpent || 0;
        } else {
          wrong++;
          topicWiseStats[topic].wrong++;
          totalTime += answer.timeSpent || 0;
          wrongQuestions.push({
            questionId: question.id,
            question: question.question,
            selectedOption: answer.selectedOption,
            correctOption: question.correctAnswer,
            topic: question.topic,
            subject: question.subject
          });
        }
      });

      const results = {
        sessionId: currentSession.id,
        userId,
        type: currentSession.type,
        metadata: currentSession.metadata,
        startTime: currentSession.startTime,
        endTime,
        totalQuestions,
        attempted: correct + wrong,
        correct,
        wrong,
        skipped,
        accuracy: totalQuestions > 0 ? ((correct / totalQuestions) * 100).toFixed(2) : 0,
        score: correct - (wrong * 0.25), // Negative marking
        totalTime,
        averageTimePerQuestion: (correct + wrong) > 0 ? (totalTime / (correct + wrong)).toFixed(2) : 0,
        topicWiseStats,
        wrongQuestions,
        completedAt: new Date().toISOString()
      };

      // Generate local ID
      results.id = `attempt_${Date.now()}`;

      // Save results locally first
      saveResultsLocally(results);

      set({ 
        sessionComplete: true, 
        results,
        isSubmitting: false 
      });

      // Store attempt in Firestore in background (non-blocking)
      addDoc(collection(db, 'attempts'), results).catch(e => 
        console.warn('Firestore attempt save failed:', e)
      );

      // Store wrong questions for revision (non-blocking)
      if (wrongQuestions.length > 0 && userId) {
        // Save locally first
        const wrongQuestionsWithMeta = wrongQuestions.map(wq => ({
          ...wq,
          id: `wq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          attemptId: results.id,
          addedAt: new Date().toISOString(),
          revisited: false
        }));
        saveWrongQuestionsLocally(wrongQuestionsWithMeta, userId);
        
        // Then try Firestore
        wrongQuestionsWithMeta.forEach(wq => {
          addDoc(collection(db, 'wrong_questions'), wq).catch(e => 
            console.warn('Wrong question save failed:', e)
          );
        });
      }

      return results;
    } catch (error) {
      console.error('Complete session error:', error);
      set({ isSubmitting: false });
      throw error;
    }
  },

  // Get user's practice history
  fetchPracticeHistory: async (userId, limitCount = 20) => {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const firestoreResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Merge with local results
      const localResults = getLocalResults().filter(r => r.userId === userId);
      const allResults = [...firestoreResults, ...localResults];
      
      // Remove duplicates and sort
      const uniqueResults = allResults.reduce((acc, curr) => {
        if (!acc.find(r => r.id === curr.id)) acc.push(curr);
        return acc;
      }, []);
      
      return uniqueResults.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      ).slice(0, limitCount);
    } catch (error) {
      console.warn('Fetch practice history error:', error);
      // Return local results as fallback
      return getLocalResults().filter(r => r.userId === userId).slice(0, limitCount);
    }
  },

  // Get wrong questions for revision
  fetchWrongQuestions: async (userId, topic = null) => {
    try {
      let q;
      if (topic) {
        q = query(
          collection(db, 'wrong_questions'),
          where('userId', '==', userId),
          where('topic', '==', topic),
          where('revisited', '==', false)
        );
      } else {
        q = query(
          collection(db, 'wrong_questions'),
          where('userId', '==', userId),
          where('revisited', '==', false)
        );
      }

      const querySnapshot = await getDocs(q);
      const firestoreQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Merge with local wrong questions
      const localWrongQuestions = getLocalWrongQuestions(userId).filter(q => !q.revisited);
      const allQuestions = [...firestoreQuestions, ...localWrongQuestions];
      
      // Remove duplicates
      const uniqueQuestions = allQuestions.reduce((acc, curr) => {
        if (!acc.find(q => q.id === curr.id || q.questionId === curr.questionId)) acc.push(curr);
        return acc;
      }, []);
      
      if (topic) {
        return uniqueQuestions.filter(q => q.topic === topic);
      }
      return uniqueQuestions;
    } catch (error) {
      console.warn('Fetch wrong questions error:', error);
      // Return local wrong questions as fallback
      const local = getLocalWrongQuestions(userId).filter(q => !q.revisited);
      if (topic) return local.filter(q => q.topic === topic);
      return local;
    }
  },

  // Mark wrong question as revisited
  markAsRevisited: async (userId, wrongQuestionId) => {
    // Update locally first
    try {
      const key = `ossc-wrong-questions-${userId}`;
      const local = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = local.map(q => q.id === wrongQuestionId ? {...q, revisited: true} : q);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    
    // Then try Firestore
    try {
      await updateDoc(doc(db, 'wrong_questions', wrongQuestionId), {
        revisited: true,
        revisitedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Mark as revisited error:', error);
    }
  },

  // Remove wrong question
  removeWrongQuestion: async (userId, questionId) => {
    // Update locally first
    try {
      const key = `ossc-wrong-questions-${userId}`;
      const local = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = local.map(q => q.id === questionId ? {...q, revisited: true} : q);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    
    // Then try Firestore
    try {
      await updateDoc(doc(db, 'wrong_questions', questionId), {
        revisited: true,
        revisitedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Remove wrong question error:', error);
    }
  },

  // Get session results
  getSessionResults: async (sessionId) => {
    // Check local results first
    const localResults = getLocalResults();
    const localResult = localResults.find(r => r.id === sessionId || r.sessionId === sessionId);
    if (localResult) return localResult;
    
    // If not found locally, check current results in state
    const { results } = get();
    if (results && (results.id === sessionId || results.sessionId === sessionId)) {
      return results;
    }
    
    // Special case for 'latest' - return most recent result
    if (sessionId === 'latest') {
      if (results) return results;
      if (localResults.length > 0) return localResults[0];
    }
    
    // Try Firestore
    try {
      const docRef = doc(db, 'attempts', sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.warn('Get session results error:', error);
      return null;
    }
  },

  // Reset session
  resetSession: () => {
    set({
      currentSession: null,
      attempts: [],
      answers: {},
      sessionComplete: false,
      results: null
    });
  }
}));

export default usePracticeStore;
