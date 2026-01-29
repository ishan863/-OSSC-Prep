// OpenRouter API Configuration
// Using FREE models only - Updated June 2025

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  
  // Free models available on OpenRouter (verified working)
  models: {
    // Primary model for question generation - Best quality free model
    primary: 'google/gemini-2.0-flash-exp:free',
    
    // Fallback models (all verified free and working)
    fallback: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-3-27b-it:free',
      'google/gemma-3-12b-it:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
      'qwen/qwen3-4b:free',
      'deepseek/deepseek-r1-0528:free'
    ],
    
    // Model for chatbot (conversational) - Good for chat
    chatbot: 'meta-llama/llama-3.3-70b-instruct:free',
    
    // Model for translations - Multilingual capable
    translation: 'google/gemini-2.0-flash-exp:free'
  },
  
  // Default parameters
  defaultParams: {
    temperature: 0.7,
    max_tokens: 3000,
    top_p: 0.9
  },
  
  // Rate limiting (requests per minute) - Adjusted for free tier
  rateLimit: {
    requestsPerMinute: 10,
    retryDelay: 5000,
    maxRetries: 5
  }
};

// Headers for API requests
export const getOpenRouterHeaders = () => ({
  'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': window.location.origin,
  'X-Title': 'OSSC Exam Prep Platform'
});

export default OPENROUTER_CONFIG;
