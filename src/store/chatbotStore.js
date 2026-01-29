import { create } from 'zustand';
import { 
  collection, 
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendChatMessage, translateText } from '../services/aiService';

// Helper for local storage chat history
const getChatHistoryLocal = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`ossc-chat-${userId}`) || '[]');
  } catch {
    return [];
  }
};

const saveChatHistoryLocal = (userId, messages) => {
  try {
    localStorage.setItem(`ossc-chat-${userId}`, JSON.stringify(messages.slice(-50)));
  } catch {
    console.warn('Could not save chat history locally');
  }
};

// Chatbot Store - Manages AI chatbot conversations
export const useChatbotStore = create((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,
  error: null,
  conversationId: null,

  // Load chat history for user
  loadChatHistory: async (userId) => {
    if (!userId) return;
    
    set({ isLoading: true });
    
    // Load from local storage first for instant display
    const localMessages = getChatHistoryLocal(userId);
    if (localMessages.length > 0) {
      set({ messages: localMessages, isLoading: false });
      return;
    }
    
    // Initialize with welcome message if no history
    const { initConversation } = get();
    initConversation();
    set({ isLoading: false });
  },

  // Clear chat history
  clearHistory: (userId) => {
    if (userId) {
      localStorage.removeItem(`ossc-chat-${userId}`);
    }
    set({ messages: [], conversationId: null });
    
    // Reinitialize with welcome message
    get().initConversation();
  },

  // Initialize new conversation
  initConversation: () => {
    const conversationId = `conv_${Date.now()}`;
    
    const welcomeMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `ନମସ୍କାର! 🙏 Welcome to OSSC Exam Prep!

I'm your AI tutor, here to help you prepare for the Revenue Inspector (RI) exam. 

Here's what I can help you with:
• 📚 Explain any syllabus topic
• ❓ Generate practice questions
• 🔄 Translate content (English ↔ Odia)
• 📋 Create a personalized study plan
• 💡 Provide exam tips and strategies

Feel free to ask me anything about the OSSC exam!

ମୁଁ ଆପଣଙ୍କୁ RI ପରୀକ୍ଷା ପାଇଁ ପ୍ରସ୍ତୁତ ହେବାରେ ସାହାଯ୍ୟ କରିବି। ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ!`,
      timestamp: new Date().toISOString()
    };

    set({ 
      conversationId,
      messages: [welcomeMessage],
      error: null 
    });

    return conversationId;
  },

  // Send a message and get AI response
  sendMessage: async (content, options = {}) => {
    const { userId, exam = 'RI', language = 'en' } = options;
    const { messages, conversationId } = get();
    
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessagesWithUser = [...messages, userMessage];
    
    set({ 
      messages: updatedMessagesWithUser,
      isTyping: true,
      error: null 
    });

    try {
      // Get AI response
      const aiResponse = await sendChatMessage({
        message: content,
        examType: exam,
        language,
        conversationHistory: messages.slice(-10) // Last 10 messages for context
      });

      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const allMessages = [...get().messages, assistantMessage];
      
      // Save to local storage
      if (userId) {
        saveChatHistoryLocal(userId, allMessages);
      }

      // Store conversation in Firestore (non-blocking)
      if (userId) {
        addDoc(collection(db, 'chat_history'), {
          conversationId,
          userId,
          userMessage: content,
          assistantMessage: aiResponse,
          examType: exam,
          language,
          timestamp: Timestamp.now()
        }).catch(e => console.warn('Chat history save failed:', e));
      }

      set({ 
        messages: allMessages,
        isTyping: false 
      });

      return aiResponse;
    } catch (error) {
      console.error('Send message error:', error);
      
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      };

      set({ 
        messages: [...get().messages, errorMessage],
        isTyping: false,
        error: error.message 
      });

      throw error;
    }
  },

  // Translate text
  translate: async (text, fromLang, toLang) => {
    set({ isTyping: true });
    
    try {
      const translatedText = await translateText(text, fromLang, toLang);
      set({ isTyping: false });
      return translatedText;
    } catch (error) {
      set({ isTyping: false, error: error.message });
      throw error;
    }
  },

  // Quick actions
  quickAction: async (action, userId, examType, language) => {
    const quickMessages = {
      'explain-topic': 'Please explain a topic from the syllabus. Which topic would you like me to explain?',
      'generate-questions': 'I can generate practice questions for you. Which subject and topic would you like questions on?',
      'study-plan': 'I can help create a study plan. How many hours per day can you dedicate to preparation?',
      'exam-tips': 'Here are some important tips for the OSSC RI exam...',
      'translate': 'I can translate between English and Odia. What would you like me to translate?'
    };

    const message = quickMessages[action] || 'How can I help you?';
    return get().sendMessage(message, userId, examType, language);
  },

  // Clear conversation
  clearConversation: () => {
    set({ 
      messages: [],
      conversationId: null,
      error: null 
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useChatbotStore;
