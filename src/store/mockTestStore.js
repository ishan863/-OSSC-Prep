import { create } from 'zustand';
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
import { generateMockTest, generateDailyTest } from '../services/aiService';

// Mock Test Store - Manages mock tests and daily tests
export const useMockTestStore = create((set, get) => ({
  availableTests: [],
  currentTest: null,
  testQuestions: [],
  timeRemaining: 0,
  timerInterval: null,
  isLoading: false,
  error: null,

  // Generate a new mock test
  generateMockTest: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const { exam, userId, language = 'en' } = params;
      
      // Generate 100 questions for mock test
      const questions = await generateMockTest({
        exam,
        language,
        questionCount: 100
      });

      const testId = `mock_${Date.now()}`;
      
      // Create mock test document locally
      const mockTestData = {
        type: 'mock',
        exam,
        userId,
        language,
        questionCount: 100,
        duration: 90, // 90 minutes
        createdAt: new Date().toISOString(),
        status: 'pending',
        source: 'AI-Generated Mock Test (OSSC Pattern)'
      };
      
      const test = {
        id: testId,
        ...mockTestData,
        questionsData: questions
      };

      set({ 
        currentTest: test,
        testQuestions: questions,
        timeRemaining: 90 * 60, // 90 minutes in seconds
        isLoading: false 
      });

      // Save to Firestore in background (non-blocking)
      addDoc(collection(db, 'mock_tests'), mockTestData).catch(e => 
        console.warn('Mock test save failed:', e)
      );

      return test;
    } catch (error) {
      console.error('Generate mock test error:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Generate daily mini test (10 questions)
  generateDailyTest: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const { exam, userId, language = 'en', weakTopics = [] } = params;
      
      // Generate 10 questions for daily test
      const questions = await generateDailyTest({
        exam,
        language,
        questionCount: 10,
        weakTopics
      });

      const testId = `daily_${Date.now()}`;

      // Create daily test document locally
      const dailyTestData = {
        type: 'daily',
        exam,
        userId,
        language,
        questionCount: 10,
        duration: 10, // 10 minutes
        createdAt: new Date().toISOString(),
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        source: 'AI-Generated Daily Test'
      };
      
      const test = {
        id: testId,
        ...dailyTestData,
        questionsData: questions
      };

      set({ 
        currentTest: test,
        testQuestions: questions,
        timeRemaining: 10 * 60, // 10 minutes in seconds
        isLoading: false 
      });

      // Save to Firestore in background (non-blocking)
      addDoc(collection(db, 'daily_tests'), dailyTestData).catch(e => 
        console.warn('Daily test save failed:', e)
      );

      return test;
    } catch (error) {
      console.error('Generate daily test error:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Start timer
  startTimer: (onTimeUp) => {
    const { timerInterval } = get();
    
    // Clear existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const interval = setInterval(() => {
      const { timeRemaining } = get();
      
      if (timeRemaining <= 0) {
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
        return;
      }

      set({ timeRemaining: timeRemaining - 1 });
    }, 1000);

    set({ timerInterval: interval });
  },

  // Stop timer
  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  // Fetch available mock tests for user
  fetchAvailableTests: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const q = query(
        collection(db, 'mock_tests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const tests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      set({ availableTests: tests, isLoading: false });
      return tests;
    } catch (error) {
      console.warn('Fetch available tests error:', error);
      set({ isLoading: false, availableTests: [] });
      return [];
    }
  },

  // Check if daily test is available today
  checkDailyTestAvailable: async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const q = query(
        collection(db, 'daily_tests'),
        where('userId', '==', userId),
        where('date', '==', today)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.empty; // Returns true if no test taken today
    } catch (error) {
      console.warn('Check daily test error:', error);
      return true; // Allow test on error
    }
  },

  // Get user's weak topics based on wrong questions
  getWeakTopics: async (userId) => {
    try {
      const q = query(
        collection(db, 'wrong_questions'),
        where('userId', '==', userId),
        where('revisited', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const topicCounts = {};

      querySnapshot.docs.forEach(doc => {
        const { topic } = doc.data();
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });

      // Sort by count and return top 5 weak topics
      return Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);
    } catch (error) {
      console.warn('Get weak topics error:', error);
      return [];
    }
  },

  // Reset test
  resetTest: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    set({
      currentTest: null,
      testQuestions: [],
      timeRemaining: 0,
      timerInterval: null,
      error: null
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useMockTestStore;
