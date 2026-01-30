// OpenRouter API Configuration
// Updated January 2026 - Verified working FREE models

// API Key - Hardcoded for production reliability
const API_KEY = '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';

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || API_KEY,
  
  // Verified working FREE models (January 2026) - Exact names from OpenRouter
  models: {
    // Primary model - DeepSeek R1T2 Chimera (best for complex tasks)
    primary: 'tngtech/deepseek-r1t2-chimera:free',
    
    // Fallback models - verified working
    fallback: [
      'meta-llama/llama-3.3-70b-instruct:free',   // Most stable, multilingual
      'deepseek/deepseek-r1-0528:free',           // Strong reasoning
      'nvidia/nemotron-3-nano-30b-a3b:free',      // Fast responses
      'arcee-ai/trinity-large-preview:free',      // Creative writing
      'tngtech/deepseek-r1t-chimera:free',        // Good alternative
      'z-ai/glm-4.5-air:free'                     // GLM model
    ],
    
    // Specific task models
    chatbot: 'meta-llama/llama-3.3-70b-instruct:free',
    explanation: 'meta-llama/llama-3.3-70b-instruct:free',
    translation: 'meta-llama/llama-3.3-70b-instruct:free',
    fast: 'nvidia/nemotron-3-nano-30b-a3b:free'
  },
  
  // Parallel request models - Race these for fastest response
  parallelModels: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1-0528:free',
    'nvidia/nemotron-3-nano-30b-a3b:free'
  ],
  
  // Default parameters
  defaultParams: {
    temperature: 0.7,
    max_tokens: 6000,
    top_p: 0.95
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: 30,
    retryDelay: 1500,
    maxRetries: 5
  }
};

// Headers for API requests
export const getOpenRouterHeaders = () => ({
  'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ossc-exam-prep.web.app',
  'X-Title': 'OSSC Exam Prep Platform'
});

// Check if API key is configured
export const isAPIConfigured = () => {
  return OPENROUTER_CONFIG.apiKey && OPENROUTER_CONFIG.apiKey.length > 10;
};

export default OPENROUTER_CONFIG;
