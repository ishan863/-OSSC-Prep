import axios from 'axios';
import { OPENROUTER_CONFIG, getOpenRouterHeaders } from '../config/openrouter.config';
import { getSyllabus, getTopicById, getSubjectById } from '../data/syllabus';

// AI Service - Handles all AI-related operations using OpenRouter

// Rate limiting with exponential backoff
let consecutiveFailures = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get all available models in priority order
const getAllModels = () => {
  return [
    OPENROUTER_CONFIG.models.primary,
    ...OPENROUTER_CONFIG.models.fallback
  ];
};

// Single model request with timeout
const tryModelRequest = async (model, messages, options = {}) => {
  const {
    temperature = OPENROUTER_CONFIG.defaultParams.temperature,
    maxTokens = OPENROUTER_CONFIG.defaultParams.max_tokens,
  } = options;

  try {
    console.log(`🚀 Trying model: ${model}`);
    
    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: OPENROUTER_CONFIG.defaultParams.top_p
      },
      { 
        headers: getOpenRouterHeaders(),
        timeout: 45000 // 45 second timeout per model
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (content) {
      console.log(`✅ Success with model: ${model}`);
      return { success: true, content, model };
    }
    
    return { success: false, error: 'Empty response', model };
  } catch (error) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ Model ${model} failed:`, status, errorMessage);
    return { success: false, error: errorMessage, status, model };
  }
};

// FAST parallel model racing - tries multiple models at once and returns first success
const makeAIRequestFast = async (messages, options = {}) => {
  const allModels = getAllModels();
  
  // Try first 3 models in parallel for speed
  const parallelModels = allModels.slice(0, 3);
  console.log('🏃 Racing models:', parallelModels.join(', '));
  
  try {
    // Race first batch
    const results = await Promise.allSettled(
      parallelModels.map(model => tryModelRequest(model, messages, options))
    );
    
    // Find first success
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        consecutiveFailures = 0;
        return result.value.content;
      }
    }
    
    // If all parallel failed, try remaining models sequentially
    console.log('⏳ Parallel models failed, trying remaining models...');
    for (let i = 3; i < allModels.length; i++) {
      const result = await tryModelRequest(allModels[i], messages, options);
      if (result.success) {
        consecutiveFailures = 0;
        return result.content;
      }
      
      // Handle rate limiting
      if (result.status === 429) {
        consecutiveFailures++;
        await sleep(3000 * consecutiveFailures);
      }
    }
  } catch (error) {
    console.error('AI request failed:', error);
  }
  
  throw new Error('All AI models are currently unavailable. Please try again in a few minutes.');
};

// Fallback to sequential for chatbot (to maintain conversation context)
const makeAIRequest = async (messages, options = {}) => {
  const {
    temperature = OPENROUTER_CONFIG.defaultParams.temperature,
    maxTokens = OPENROUTER_CONFIG.defaultParams.max_tokens,
    useParallel = true
  } = options;

  // Use fast parallel for question generation
  if (useParallel) {
    return makeAIRequestFast(messages, { temperature, maxTokens });
  }

  // Sequential for chatbot - try models one by one
  const allModels = getAllModels();
  for (const model of allModels) {
    const result = await tryModelRequest(model, messages, { temperature, maxTokens });
    if (result.success) {
      return result.content;
    }
    if (result.status === 429) {
      await sleep(3000);
    }
  }
  throw new Error('All AI models are currently unavailable. Please try again.');
};

// Generate MCQ questions based on syllabus
export const generateQuestions = async (params) => {
  const { exam, subject, topic, difficulty = 'medium', count = 10, language = 'en' } = params;
  
  const syllabus = getSyllabus(exam);
  const topicInfo = getTopicById(exam, topic);
  const subjectInfo = getSubjectById(exam, subject);
  
  const languageInstruction = language === 'or' 
    ? 'Generate the questions and options in Odia (ଓଡ଼ିଆ) language. Use proper Odia grammar and examination terminology.'
    : 'Generate the questions and options in English.';

  const systemPrompt = `You are an expert OSSC (Odisha Staff Selection Commission) exam question generator. 
You specialize in creating high-quality MCQs for the ${exam} (${exam === 'RI' ? 'Revenue Inspector' : 'Assistant Inspector'}) exam.

RULES:
1. Generate EXACTLY ${count} unique MCQ questions
2. Each question must be relevant to OSSC syllabus
3. Difficulty level: ${difficulty}
4. Subject: ${subjectInfo?.name || subject}
5. Topic: ${topicInfo?.name || topic}
6. Subtopics to cover: ${topicInfo?.subtopics?.join(', ') || 'General'}
7. ${languageInstruction}
8. For Odisha-specific topics, use Odisha context
9. Ensure factual accuracy
10. Each question MUST have exactly 4 options (A, B, C, D)
11. Only ONE correct answer
12. Provide clear explanations

OUTPUT MUST BE VALID JSON:
{
  "questions": [
    {
      "question": "Full question text here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    }
  ]
}

IMPORTANT: correctAnswer is the INDEX (0=A, 1=B, 2=C, 3=D) of the correct option.`;

  const userPrompt = `Generate ${count} ${difficulty}-level MCQ questions:
- Exam: OSSC ${exam}
- Subject: ${subjectInfo?.name || subject}
- Topic: ${topicInfo?.name || topic}
- Language: ${language === 'or' ? 'Odia (ଓଡ଼ିଆ)' : 'English'}

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await makeAIRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.7, maxTokens: 4000 });

    // Parse JSON response - handle markdown code blocks
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const questions = parsed.questions || [];
      
      if (questions.length > 0) {
        // Validate and clean questions
        return questions.map((q, idx) => ({
          id: `ai_${Date.now()}_${idx}`,
          question: q.question || 'Question not available',
          options: Array.isArray(q.options) && q.options.length === 4 
            ? q.options 
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
            ? q.correctAnswer 
            : 0,
          explanation: q.explanation || 'No explanation available',
          difficulty: difficulty,
          topic: topic,
          subject: subject,
          source: 'AI-Generated',
          generatedAt: new Date().toISOString()
        }));
      }
    }
    
    console.error('Failed to parse AI response:', response.substring(0, 200));
    throw new Error('Invalid response format from AI');
  } catch (error) {
    console.error('Generate questions error:', error.message);
    throw error; // Don't use fallback, let the caller handle it
  }
};

// Generate Mock Test (100 questions)
export const generateMockTest = async (params) => {
  const { exam, language = 'en', questionCount = 100 } = params;
  const syllabus = getSyllabus(exam);
  
  const allQuestions = [];
  
  // Distribute questions across subjects based on weightage
  for (const subject of syllabus.subjects) {
    const subjectQuestionCount = Math.round((subject.weightage / 100) * questionCount);
    
    // Select random topics from subject
    const topicsToUse = subject.topics.slice(0, Math.min(5, subject.topics.length));
    const questionsPerTopic = Math.ceil(subjectQuestionCount / topicsToUse.length);
    
    for (const topic of topicsToUse) {
      try {
        const questions = await generateQuestions({
          exam,
          subject: subject.id,
          topic: topic.id,
          difficulty: 'medium',
          count: questionsPerTopic,
          language
        });
        
        allQuestions.push(...questions);
      } catch (error) {
        console.error(`Error generating questions for ${topic.name}:`, error);
      }
      
      // Add delay to avoid rate limiting
      await sleep(3000);
    }
  }
  
  // Shuffle questions
  return shuffleArray(allQuestions).slice(0, questionCount);
};

// Generate Daily Test (10 questions)
export const generateDailyTest = async (params) => {
  const { exam, language = 'en', questionCount = 10, weakTopics = [] } = params;
  const syllabus = getSyllabus(exam);
  
  const allQuestions = [];
  
  // If weak topics exist, focus on them (50% of questions)
  const weakTopicCount = Math.min(Math.floor(questionCount / 2), weakTopics.length * 2);
  const randomTopicCount = questionCount - weakTopicCount;
  
  // Generate questions from weak topics
  for (let i = 0; i < weakTopicCount && i < weakTopics.length; i++) {
    try {
      const questions = await generateQuestions({
        exam,
        subject: '',
        topic: weakTopics[i],
        difficulty: 'medium',
        count: 2,
        language
      });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error generating weak topic questions:`, error);
    }
    await sleep(2000);
  }
  
  // Generate random revision questions
  const randomSubjects = shuffleArray([...syllabus.subjects]).slice(0, 3);
  const questionsPerSubject = Math.ceil(randomTopicCount / randomSubjects.length);
  
  for (const subject of randomSubjects) {
    const randomTopic = subject.topics[Math.floor(Math.random() * subject.topics.length)];
    
    try {
      const questions = await generateQuestions({
        exam,
        subject: subject.id,
        topic: randomTopic.id,
        difficulty: 'medium',
        count: questionsPerSubject,
        language
      });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error generating random questions:`, error);
    }
    await sleep(2000);
  }
  
  return shuffleArray(allQuestions).slice(0, questionCount);
};

// AI Chatbot - Send message and get response
export const sendChatMessage = async (params) => {
  const { message, examType = 'RI', language = 'en', conversationHistory = [] } = params;
  
  const languageNote = language === 'or' 
    ? 'Respond in Odia (ଓଡ଼ିଆ) language when appropriate. Use proper Odia grammar.'
    : 'Respond in English.';

  const systemPrompt = `You are an expert OSSC exam tutor specializing in ${examType} (${examType === 'RI' ? 'Revenue Inspector' : 'Assistant Inspector'}) exam preparation.

YOUR ROLE:
- Help students prepare for OSSC exams
- Explain syllabus topics clearly
- Answer doubts about exam pattern, topics, and strategies
- Provide study tips and motivation
- Explain answers to questions
- ${languageNote}

IMPORTANT:
- Be concise but thorough
- Use examples when helpful
- Focus on OSSC-relevant content
- Be encouraging and supportive`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  try {
    const response = await makeAIRequest(messages, { 
      temperature: 0.7, 
      maxTokens: 1000
    });
    
    return response;
  } catch (error) {
    console.error('Chatbot error:', error);
    return language === 'or' 
      ? 'ଦୁଃଖିତ, ଏହି ସମୟରେ ଉତ୍ତର ଦେବାରେ ଅସମର୍ଥ। ଦୟାକରି ପୁଣିଥରେ ଚେଷ୍ଟା କରନ୍ତୁ।'
      : 'Sorry, I am unable to respond at this time. Please try again in a moment.';
  }
};

// Translate text between English and Odia
export const translateText = async (params) => {
  const { text, fromLanguage = 'en', toLanguage = 'or' } = params;
  
  const languagePair = fromLanguage === 'en' 
    ? 'English to Odia (ଓଡ଼ିଆ)'
    : 'Odia (ଓଡ଼ିଆ) to English';

  const systemPrompt = `You are a professional translator specializing in ${languagePair} translation.
Translate the given text accurately, preserving the meaning and tone.
For technical or exam-related terms, use appropriate terminology.
Return ONLY the translated text, nothing else.`;

  try {
    const response = await makeAIRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ], { temperature: 0.3, maxTokens: 1000 });
    
    return response.trim();
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original if translation fails
  }
};

// Generate explanation for a question
export const generateExplanation = async (params) => {
  const { question, correctAnswer, language = 'en' } = params;
  
  const languageNote = language === 'or' 
    ? 'Explain in Odia (ଓଡ଼ିଆ) language.'
    : 'Explain in English.';

  const systemPrompt = `You are an OSSC exam expert. Provide clear, educational explanations for exam questions.
${languageNote}
Keep explanations concise but thorough.`;

  const userPrompt = `Explain why "${correctAnswer}" is the correct answer for this question:

Question: ${question}

Provide a clear explanation that helps the student understand the concept.`;

  try {
    const response = await makeAIRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.5, maxTokens: 500 });
    
    return response;
  } catch (error) {
    console.error('Explanation generation error:', error);
    return language === 'or'
      ? 'ବ୍ୟାଖ୍ୟା ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ପୁଣିଥରେ ଚେଷ୍ଟା କରନ୍ତୁ।'
      : 'Explanation could not be generated. Please try again.';
  }
};

// Utility function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default {
  generateQuestions,
  generateMockTest,
  generateDailyTest,
  sendChatMessage,
  translateText,
  generateExplanation
};
