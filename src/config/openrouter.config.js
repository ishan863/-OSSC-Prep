// OpenRouter API Configuration
// Updated January 2026 - Verified working FREE models

// NEW API Key - January 30, 2026
const API_KEY = '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';

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: API_KEY,
  
  // Verified working FREE models (January 2026) - Exact names from OpenRouter
  models: {
    // Primary model - Meta Llama 3.3 (most stable and reliable)
    primary: 'meta-llama/llama-3.3-70b-instruct:free',
    
    // Fallback models - verified working
    fallback: [
      'deepseek/deepseek-r1-0528:free',           // Strong reasoning
      'nvidia/nemotron-3-nano-30b-a3b:free',      // Fast responses
      'arcee-ai/trinity-large-preview:free',      // Creative writing
      'tngtech/deepseek-r1t-chimera:free',        // Good alternative
      'tngtech/deepseek-r1t2-chimera:free'        // Complex tasks
    ],
    
    // Specific task models - using most reliable
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
