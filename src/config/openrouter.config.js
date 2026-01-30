// OpenRouter API Configuration
// Updated January 2026 - Optimized for speed with parallel model racing

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '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',
  
  // Verified working FREE models (January 2026)
  models: {
    // Primary model for question generation - DeepSeek R1T2 Chimera (Best for complex tasks)
    primary: 'tngtech/deepseek-r1t2-chimera:free',
    
    // Fallback models for reliability - ordered by speed/quality
    fallback: [
      'zhipu-ai/glm-4-air:free',              // GLM 4.5 Air - Best for explanations
      'deepseek/deepseek-r1-0528:free',       // DeepSeek R1 - Strong reasoning
      'meta-llama/llama-3.3-70b-instruct:free', // Llama 3.3 - Multilingual
      'google/gemma-3-4b-it:free',            // Gemma 3 - Fast responses
      'microsoft/phi-4:free',                  // Phi-4 - Efficient
      'qwen/qwen-2.5-7b-instruct:free'        // Qwen 2.5 - Good quality
    ],
    
    // Model for chatbot - DeepSeek R1T2 (Best conversational)
    chatbot: 'tngtech/deepseek-r1t2-chimera:free',
    
    // Model for explanations - GLM 4.5 Air (Clear explanations)
    explanation: 'zhipu-ai/glm-4-air:free',
    
    // Model for translations (English ↔ Odia)
    translation: 'zhipu-ai/glm-4-air:free',
    
    // Fast model for quick responses
    fast: 'google/gemma-3-4b-it:free'
  },
  
  // Parallel request models - Race these for fastest response
  parallelModels: [
    'tngtech/deepseek-r1t2-chimera:free',
    'zhipu-ai/glm-4-air:free',
    'deepseek/deepseek-r1-0528:free',
    'meta-llama/llama-3.3-70b-instruct:free'
  ],
  
  // Default parameters - Optimized for question generation
  defaultParams: {
    temperature: 0.7,
    max_tokens: 6000,
    top_p: 0.95
  },
  
  // Rate limiting (requests per minute) - Adjusted for parallel requests
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
