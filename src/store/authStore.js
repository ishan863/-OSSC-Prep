import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple hash function for password (NOT for production - use bcrypt or Firebase Auth in real apps)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Auth Store - Manages user authentication and profile
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      selectedExam: null,
      preferredLanguage: 'en',
      isLoading: false,
      error: null,

      // Initialize auth from localStorage
      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const storedUser = localStorage.getItem('ossc-user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            set({ 
              user: userData,
              selectedExam: userData.selectedExam || null,
              preferredLanguage: userData.preferredLanguage || 'en',
              isLoading: false 
            });
            return;
          }
          set({ user: null, isLoading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, isLoading: false, error: error.message });
        }
      },

      // Register new user with email and password
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Validate inputs
          if (!name || name.trim().length < 2) {
            set({ isLoading: false });
            throw new Error('Please enter a valid name (at least 2 characters)');
          }
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            set({ isLoading: false });
            throw new Error('Please enter a valid email address');
          }
          if (!password || password.length < 6) {
            set({ isLoading: false });
            throw new Error('Password must be at least 6 characters');
          }

          const normalizedEmail = email.trim().toLowerCase();
          const normalizedName = name.trim();

          // Check if email already exists in localStorage
          const allUsers = JSON.parse(localStorage.getItem('ossc-all-users') || '{}');
          if (allUsers[normalizedEmail]) {
            set({ isLoading: false });
            throw new Error('Email already registered. Please login instead.');
          }

          // Create user
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const passwordHash = simpleHash(password);
          
          const userData = {
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            selectedExam: null,
            preferredLanguage: 'en',
            stats: {
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              mockTestsTaken: 0,
              dailyTestsTaken: 0,
              practiceSessionsCompleted: 0,
              dailyStreak: 0,
              lastActiveDate: null,
              studyTime: 0
            }
          };

          const user = { id: userId, ...userData };
          
          // Store user in all-users registry
          allUsers[normalizedEmail] = { id: userId, passwordHash };
          localStorage.setItem('ossc-all-users', JSON.stringify(allUsers));
          
          // Store current user (with full data for local storage)
          localStorage.setItem('ossc-user', JSON.stringify(user));
          localStorage.setItem(`ossc-user-${userId}`, JSON.stringify(user));
          
          set({ 
            user, 
            selectedExam: null,
            preferredLanguage: 'en',
            isLoading: false 
          });

          // Sync to Firestore in background (non-blocking) - exclude passwordHash
          const { passwordHash: _, ...firestoreData } = userData;
          setDoc(doc(db, 'users', userId), firestoreData).catch(e => console.warn('Firestore sync failed:', e));
          
          return user;
        } catch (error) {
          console.error('Register error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Login with email and password
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Validate inputs
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            set({ isLoading: false });
            throw new Error('Please enter a valid email address');
          }
          if (!password || password.length < 6) {
            set({ isLoading: false });
            throw new Error('Password must be at least 6 characters');
          }

          const normalizedEmail = email.trim().toLowerCase();
          const passwordHash = simpleHash(password);

          // Check user registry
          const allUsers = JSON.parse(localStorage.getItem('ossc-all-users') || '{}');
          const userRef = allUsers[normalizedEmail];

          if (!userRef) {
            set({ isLoading: false });
            throw new Error('Email not found. Please register first.');
          }

          if (userRef.passwordHash !== passwordHash) {
            set({ isLoading: false });
            throw new Error('Incorrect password. Please try again.');
          }

          // Get stored user data
          const storedUser = localStorage.getItem(`ossc-user-${userRef.id}`);
          let user;
          
          if (storedUser) {
            user = JSON.parse(storedUser);
            user.lastLogin = new Date().toISOString();
          } else {
            // Fallback - create user data from registry
            user = {
              id: userRef.id,
              email: normalizedEmail,
              name: normalizedEmail.split('@')[0],
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              selectedExam: null,
              preferredLanguage: 'en',
              stats: {
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                mockTestsTaken: 0,
                dailyTestsTaken: 0,
                practiceSessionsCompleted: 0,
                dailyStreak: 0,
                lastActiveDate: null,
                studyTime: 0
              }
            };
          }
          
          // Store as current user
          localStorage.setItem('ossc-user', JSON.stringify(user));
          localStorage.setItem(`ossc-user-${user.id}`, JSON.stringify(user));
          
          set({ 
            user, 
            selectedExam: user.selectedExam || null,
            preferredLanguage: user.preferredLanguage || 'en',
            isLoading: false 
          });

          // Sync to Firestore in background (non-blocking)
          updateDoc(doc(db, 'users', user.id), {
            lastLogin: new Date().toISOString()
          }).catch(e => console.warn('Firestore sync failed:', e));
          
          return user;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Select exam type (RI or AI)
      selectExam: async (examType) => {
        const { user } = get();
        if (!user) return;

        // Update state immediately
        const updatedUser = { ...user, selectedExam: examType };
        localStorage.setItem('ossc-user', JSON.stringify(updatedUser));
        localStorage.setItem(`ossc-user-${user.id}`, JSON.stringify(updatedUser));
        set({ user: updatedUser, selectedExam: examType });

        // Try to update Firestore in background (non-blocking)
        updateDoc(doc(db, 'users', user.id), {
          selectedExam: examType
        }).catch(e => console.warn('Firestore update failed:', e));
      },

      // Set preferred language
      setPreferredLanguage: async (language) => {
        const { user } = get();
        
        try {
          if (user) {
            const updatedUser = { ...user, preferredLanguage: language };
            localStorage.setItem('ossc-user', JSON.stringify(updatedUser));
            localStorage.setItem(`ossc-user-${user.id}`, JSON.stringify(updatedUser));
            set({ user: updatedUser, preferredLanguage: language });
            
            // Sync to Firestore in background
            updateDoc(doc(db, 'users', user.id), {
              preferredLanguage: language
            }).catch(e => console.warn('Could not update Firestore:', e));
          } else {
            set({ preferredLanguage: language });
          }
        } catch (error) {
          console.error('Set language error:', error);
        }
      },

      // Update user stats
      updateStats: async (statsUpdate) => {
        const { user } = get();
        if (!user) return;

        try {
          const currentStats = user.stats || {};
          const updatedStats = {
            ...currentStats,
            ...statsUpdate,
            lastActiveDate: new Date().toISOString()
          };

          const updatedUser = { ...user, stats: updatedStats };
          localStorage.setItem('ossc-user', JSON.stringify(updatedUser));
          localStorage.setItem(`ossc-user-${user.id}`, JSON.stringify(updatedUser));
          set({ user: updatedUser });

          // Sync to Firestore in background
          updateDoc(doc(db, 'users', user.id), {
            stats: updatedStats
          }).catch(e => console.warn('Could not update Firestore:', e));
        } catch (error) {
          console.error('Update stats error:', error);
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('ossc-user');
        localStorage.removeItem('auth-storage');
        set({ 
          user: null, 
          selectedExam: null, 
          preferredLanguage: 'en',
          isLoading: false,
          error: null 
        });
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        preferredLanguage: state.preferredLanguage 
      })
    }
  )
);
