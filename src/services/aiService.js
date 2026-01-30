import axios from 'axios';
import { OPENROUTER_CONFIG, getOpenRouterHeaders, isAPIConfigured } from '../config/openrouter.config';
import { getSyllabus, getTopicById, getSubjectById } from '../data/syllabus';

// AI Service - Optimized with parallel model racing for speed

// Track API failures to skip AI when it keeps failing
let consecutiveAPIFailures = 0;
let lastSuccessfulAPICall = 0;
const MAX_FAILURES_BEFORE_FALLBACK = 5;
const RETRY_AFTER_MS = 30000; // Retry AI after 30 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if we should skip AI and use fallback directly
const shouldUseFallbackDirectly = () => {
  if (consecutiveAPIFailures >= MAX_FAILURES_BEFORE_FALLBACK) {
    const timeSinceLastSuccess = Date.now() - lastSuccessfulAPICall;
    if (timeSinceLastSuccess < RETRY_AFTER_MS) {
      console.log(`⚡ Skipping AI (${consecutiveAPIFailures} failures), using fallback directly`);
      return true;
    }
    consecutiveAPIFailures = 0;
  }
  return false;
};

// Get parallel models for racing
const getParallelModels = () => {
  return OPENROUTER_CONFIG.parallelModels || [
    OPENROUTER_CONFIG.models.primary,
    ...OPENROUTER_CONFIG.models.fallback.slice(0, 3)
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
        timeout: 90000 // 90 second timeout for longer responses
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (content && content.trim().length > 10) {
      console.log(`✅ Success with model: ${model}`);
      consecutiveAPIFailures = 0;
      lastSuccessfulAPICall = Date.now();
      return { success: true, content, model };
    }
    
    return { success: false, error: 'Empty or invalid response', model };
  } catch (error) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ Model ${model} failed:`, status, errorMessage);
    return { success: false, error: errorMessage, status, model };
  }
};

// PARALLEL model racing - runs all models simultaneously, first wins
const makeParallelAIRequest = async (messages, options = {}) => {
  if (!isAPIConfigured()) {
    console.warn('OpenRouter API key not configured');
    throw new Error('API_NOT_CONFIGURED');
  }

  const models = getParallelModels();
  console.log(`🏁 Racing ${models.length} models in parallel...`);
  
  // Create abort controller to cancel slower requests
  const controller = new AbortController();
  
  const racePromises = models.map(async (model) => {
    try {
      const response = await axios.post(
        `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature: options.temperature || OPENROUTER_CONFIG.defaultParams.temperature,
          max_tokens: options.maxTokens || OPENROUTER_CONFIG.defaultParams.max_tokens,
          top_p: OPENROUTER_CONFIG.defaultParams.top_p
        },
        { 
          headers: getOpenRouterHeaders(),
          timeout: 90000,
          signal: controller.signal
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (content && content.trim().length > 20) {
        console.log(`🏆 Winner: ${model}`);
        controller.abort(); // Cancel other requests
        return { success: true, content, model };
      }
      return { success: false, model };
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return { success: false, cancelled: true, model };
      }
      return { success: false, error: error.message, model };
    }
  });

  // Wait for first successful response
  const results = await Promise.allSettled(racePromises);
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      consecutiveAPIFailures = 0;
      lastSuccessfulAPICall = Date.now();
      return result.value.content;
    }
  }

  consecutiveAPIFailures++;
  throw new Error('All parallel models failed');
};

// Sequential fallback for when parallel fails
const makeSequentialRequest = async (messages, options = {}) => {
  const allModels = [
    OPENROUTER_CONFIG.models.primary,
    ...OPENROUTER_CONFIG.models.fallback
  ].slice(0, 4);
  
  for (const model of allModels) {
    const result = await tryModelRequest(model, messages, options);
    if (result.success) {
      return result.content;
    }
    if (result.status === 402 || result.status === 401) break;
    await sleep(500);
  }
  
  throw new Error('All models failed');
};

// Main AI request - tries parallel first, then sequential
const makeAIRequest = async (messages, options = {}) => {
  try {
    return await makeParallelAIRequest(messages, options);
  } catch (error) {
    console.log('⚠️ Parallel request failed, trying sequential...');
    return await makeSequentialRequest(messages, options);
  }
};

// Parse JSON from AI response - handles various formats
const parseJSONResponse = (response) => {
  let jsonStr = response;
  
  // Remove markdown code blocks if present
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }
  
  // Try to find JSON object
  const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch (e) {
      console.warn('Failed to parse JSON object:', e);
    }
  }
  
  // Try to find JSON array
  const jsonArrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    try {
      return { questions: JSON.parse(jsonArrayMatch[0]) };
    } catch (e) {
      console.warn('Failed to parse JSON array:', e);
    }
  }
  
  throw new Error('Could not parse JSON from response');
};

// Comprehensive question bank for fallback
const QUESTION_BANK = {
  // Reasoning questions
  'reasoning': [
    { question: 'If COMPUTER is coded as RFUVQNPC, how will PRINTER be coded?', options: ['QSJOUFQ', 'SFUOJSQ', 'QSFUOJS', 'OSJUSQF'], correctAnswer: 1, explanation: 'Each letter is shifted by its position in the word and then reversed.' },
    { question: 'Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64', options: ['17', '37', '50', '64'], correctAnswer: 3, explanation: 'The pattern is n² + 1. 64 does not follow this pattern (should be 65).' },
    { question: 'Looking at a photograph, Ravi said, "She is the daughter of my grandfather\'s only son." How is the girl related to Ravi?', options: ['Sister', 'Cousin', 'Mother', 'Aunt'], correctAnswer: 0, explanation: 'Grandfather\'s only son is Ravi\'s father. Daughter of father is sister.' },
    { question: 'A man walks 5 km South, turns left, walks 3 km, turns left again and walks 5 km. In which direction is he now from start?', options: ['North', 'South', 'East', 'West'], correctAnswer: 2, explanation: 'After walking South, East, and North, he ends up East of the starting point.' },
    { question: 'In a row of 40 children, M is 13th from the left. What is M\'s position from the right?', options: ['26th', '27th', '28th', '29th'], correctAnswer: 2, explanation: 'Position from right = Total - Position from left + 1 = 40 - 13 + 1 = 28.' },
    { question: 'If DELHI is coded as 73541, how will HIDE be coded?', options: ['4173', '4137', '1437', '5. 1473'], correctAnswer: 0, explanation: 'D=7, E=3, L=5, H=4, I=1. So HIDE = 4173.' },
    { question: 'Complete the series: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: 1, explanation: 'Pattern: +4, +6, +8, +10, +12. So 30 + 12 = 42.' },
    { question: 'Pointing to a man, a woman said, "His mother is the only daughter of my mother." How is the woman related to the man?', options: ['Aunt', 'Mother', 'Sister', 'Grandmother'], correctAnswer: 1, explanation: 'The only daughter of my mother is myself. So the woman is the man\'s mother.' },
    { question: 'If South-East becomes North, then what will North-East become?', options: ['South', 'West', 'North-West', 'South-West'], correctAnswer: 1, explanation: 'If SE→N (135° rotation), then NE→W following the same rotation.' },
    { question: 'Find the missing number: 8, 27, 64, 125, ?', options: ['196', '216', '256', '289'], correctAnswer: 1, explanation: 'Pattern: 2³, 3³, 4³, 5³, 6³ = 216.' },
    { question: 'All roses are flowers. Some flowers are red. Conclusion: Some roses are red.', options: ['Definitely True', 'Definitely False', 'Probably True', 'Cannot be determined'], correctAnswer: 3, explanation: 'We cannot determine this as the relationship between roses and red flowers is not established.' },
    { question: 'If A is the brother of B, C is the sister of A, D is the brother of E, E is the daughter of B. Who is the uncle of D?', options: ['A', 'B', 'C', 'Cannot be determined'], correctAnswer: 0, explanation: 'A is the brother of B, and D is B\'s grandchild. So A is the uncle of D.' }
  ],
  
  // Quantitative Aptitude questions
  'quantitative': [
    { question: 'If 40% of a number is 64, what is 75% of that number?', options: ['100', '120', '140', '160'], correctAnswer: 1, explanation: 'If 40% = 64, then 100% = 160. So 75% of 160 = 120.' },
    { question: 'The ratio of two numbers is 3:4. If their HCF is 5, what is their LCM?', options: ['45', '60', '75', '90'], correctAnswer: 1, explanation: 'Numbers are 15 and 20. LCM = (15 × 20) / 5 = 60.' },
    { question: 'A train 150m long crosses a platform in 25 seconds at 54 km/h. What is the length of the platform?', options: ['175m', '200m', '225m', '250m'], correctAnswer: 2, explanation: 'Speed = 54 × 5/18 = 15 m/s. Distance = 15 × 25 = 375m. Platform = 375 - 150 = 225m.' },
    { question: 'If the cost price of 10 articles equals the selling price of 8 articles, what is the profit percentage?', options: ['20%', '25%', '30%', '35%'], correctAnswer: 1, explanation: 'CP of 10 = SP of 8. Profit = (10-8)/8 × 100 = 25%.' },
    { question: 'A sum becomes ₹1331 in 3 years at 10% compound interest. What is the principal?', options: ['₹900', '₹1000', '₹1100', '₹1200'], correctAnswer: 1, explanation: 'P(1.1)³ = 1331. P × 1.331 = 1331. P = ₹1000.' },
    { question: 'A can do a work in 15 days and B in 20 days. If they work together for 4 days, what fraction of work is left?', options: ['8/15', '7/15', '1/2', '11/15'], correctAnswer: 0, explanation: 'Combined work per day = 1/15 + 1/20 = 7/60. In 4 days = 28/60 = 7/15. Left = 8/15.' },
    { question: 'The average of 5 numbers is 42. If one number is excluded, the average becomes 40. What is the excluded number?', options: ['46', '48', '50', '52'], correctAnswer: 2, explanation: 'Sum = 42 × 5 = 210. New sum = 40 × 4 = 160. Excluded = 210 - 160 = 50.' },
    { question: 'A shopkeeper sells an article at 20% profit. If he had bought it at 10% less and sold for ₹18 less, he would have gained 25%. Find the cost price.', options: ['₹150', '₹180', '₹200', '₹220'], correctAnswer: 1, explanation: 'Let CP = x. 1.2x - 18 = 0.9x × 1.25. Solving: x = ₹180.' },
    { question: 'The simple interest on a sum for 4 years at 5% p.a. is ₹1200. What is the compound interest for 2 years at the same rate?', options: ['₹615', '₹630', '₹645', '₹660'], correctAnswer: 0, explanation: 'P = 1200/(4×0.05) = 6000. CI = 6000[(1.05)² - 1] = 6000 × 0.1025 = 615.' },
    { question: 'Two pipes can fill a tank in 12 and 15 hours respectively. A third pipe empties it in 20 hours. How long to fill if all work together?', options: ['8 hours', '10 hours', '12 hours', '15 hours'], correctAnswer: 1, explanation: 'Net rate = 1/12 + 1/15 - 1/20 = (5+4-3)/60 = 6/60 = 1/10. Time = 10 hours.' },
    { question: 'What is the square root of 7056?', options: ['82', '84', '86', '88'], correctAnswer: 1, explanation: '84 × 84 = 7056.' },
    { question: 'If x + 1/x = 5, find x² + 1/x²', options: ['21', '23', '25', '27'], correctAnswer: 1, explanation: '(x + 1/x)² = x² + 2 + 1/x² = 25. So x² + 1/x² = 23.' }
  ],
  
  // English questions
  'english': [
    { question: 'Choose the correct synonym of "ELOQUENT":', options: ['Silent', 'Articulate', 'Confused', 'Hesitant'], correctAnswer: 1, explanation: 'Eloquent means fluent or persuasive. Articulate is the closest synonym.' },
    { question: 'Choose the correct antonym of "ABUNDANT":', options: ['Plentiful', 'Scarce', 'Sufficient', 'Ample'], correctAnswer: 1, explanation: 'Abundant means existing in large quantities. Scarce means insufficient.' },
    { question: 'Identify the error: "Each of the students have submitted their assignment."', options: ['Each of', 'have submitted', 'their', 'assignment'], correctAnswer: 1, explanation: '"Each" is singular and takes singular verb. Correct: "has submitted".' },
    { question: 'One who speaks many languages is called:', options: ['Linguist', 'Polyglot', 'Grammarian', 'Orator'], correctAnswer: 1, explanation: 'Polyglot specifically means a person who knows several languages.' },
    { question: 'The idiom "to beat around the bush" means:', options: ['To hunt animals', 'To avoid the main topic', 'To work hard', 'To travel far'], correctAnswer: 1, explanation: 'This idiom means to avoid talking about the main subject directly.' },
    { question: 'Choose the correctly spelt word:', options: ['Occurence', 'Occurrence', 'Occurrance', 'Occurance'], correctAnswer: 1, explanation: 'Occurrence is the correct spelling with double r and single n.' },
    { question: 'The passive voice of "Someone has stolen my watch" is:', options: ['My watch is stolen by someone', 'My watch has been stolen', 'My watch was stolen', 'My watch had been stolen'], correctAnswer: 1, explanation: 'Present perfect active becomes present perfect passive.' },
    { question: '"She is too weak to walk." The underlined phrase is:', options: ['Noun phrase', 'Adjective phrase', 'Adverb phrase', 'Infinitive phrase'], correctAnswer: 3, explanation: 'To walk is an infinitive phrase modifying the adjective weak.' },
    { question: 'Choose the correct preposition: "I have been waiting ___ you for two hours."', options: ['to', 'for', 'with', 'at'], correctAnswer: 1, explanation: '"Wait for someone" is the correct phrase.' },
    { question: 'The plural of "crisis" is:', options: ['Crisises', 'Crises', 'Crisies', 'Crisis'], correctAnswer: 1, explanation: 'Crisis follows Greek plural pattern: crisis → crises.' },
    { question: 'Select the correct sentence:', options: ['He is elder than me', 'He is elder to me', 'He is older than me', 'Both B and C are correct'], correctAnswer: 3, explanation: 'Elder is used with "to" for family relations, older with "than" for age comparison.' },
    { question: 'A person who loves books is called:', options: ['Bibliophile', 'Philologist', 'Bibliographer', 'Lexicographer'], correctAnswer: 0, explanation: 'Bibliophile comes from Greek biblion (book) + philos (loving).' }
  ],
  
  // General Knowledge (Odisha focused)
  'gk': [
    { question: 'Which river is known as the "Sorrow of Odisha"?', options: ['Mahanadi', 'Brahmani', 'Baitarani', 'Rushikulya'], correctAnswer: 0, explanation: 'Mahanadi is called the Sorrow of Odisha due to frequent floods.' },
    { question: 'The Jagannath Temple at Puri was built by which ruler?', options: ['Anantavarman Chodaganga', 'Narasimhadeva I', 'Kapilendra Deva', 'Mukunda Deva'], correctAnswer: 0, explanation: 'Anantavarman Chodaganga of the Eastern Ganga dynasty built the temple in 12th century.' },
    { question: 'Which lake in Odisha is Asia\'s largest brackish water lagoon?', options: ['Ansupa Lake', 'Chilika Lake', 'Kanjia Lake', 'Tampara Lake'], correctAnswer: 1, explanation: 'Chilika Lake is Asia\'s largest brackish water lagoon, spread over 1100 sq km.' },
    { question: 'Odisha became a separate state on which date?', options: ['1st April 1936', '26th January 1950', '15th August 1947', '1st November 1956'], correctAnswer: 0, explanation: 'Odisha (then Orissa) became a separate province on 1st April 1936.' },
    { question: 'The famous Konark Sun Temple was built during the reign of:', options: ['Anantavarman Chodaganga', 'Narasimhadeva I', 'Kapilendra Deva', 'Bhanu Deva'], correctAnswer: 1, explanation: 'Narasimhadeva I of the Eastern Ganga dynasty built the Konark Temple in 13th century.' },
    { question: 'Which is the highest peak in Odisha?', options: ['Deomali', 'Mahendragiri', 'Malayagiri', 'Meghasani'], correctAnswer: 0, explanation: 'Deomali (1672m) in Koraput district is the highest peak in Odisha.' },
    { question: 'The famous Rath Yatra of Puri takes place in which month (Hindu calendar)?', options: ['Chaitra', 'Vaishakha', 'Ashadha', 'Kartika'], correctAnswer: 2, explanation: 'The Rath Yatra takes place on Ashadha Shukla Dwitiya.' },
    { question: 'Which district of Odisha has the largest forest cover?', options: ['Mayurbhanj', 'Keonjhar', 'Sundargarh', 'Kandhamal'], correctAnswer: 0, explanation: 'Mayurbhanj has the largest forest cover in Odisha.' },
    { question: 'Simlipal National Park is famous for:', options: ['Elephants', 'Tigers', 'One-horned Rhinos', 'Lions'], correctAnswer: 1, explanation: 'Simlipal is one of the tiger reserves in India under Project Tiger.' },
    { question: 'The first newspaper in Odia language was:', options: ['Utkal Dipika', 'Sambad Bahika', 'Asha', 'Prajatantra'], correctAnswer: 0, explanation: 'Utkal Dipika was started in 1866 by Gauri Shankar Ray.' },
    { question: 'Which ruler founded the Bhoi dynasty of Odisha?', options: ['Mukunda Deva', 'Ramachandra Deva', 'Govinda Vidyadhara', 'Prataparudra Deva'], correctAnswer: 2, explanation: 'Govinda Vidyadhara established the Bhoi dynasty in 1541.' },
    { question: 'The Hirakud Dam is built on which river?', options: ['Mahanadi', 'Brahmani', 'Baitarani', 'Subarnarekha'], correctAnswer: 0, explanation: 'Hirakud Dam is built on the Mahanadi River and is one of the longest dams in the world.' }
  ],
  
  // Computer Knowledge
  'computer': [
    { question: 'Which shortcut key is used to copy selected text?', options: ['Ctrl + V', 'Ctrl + X', 'Ctrl + C', 'Ctrl + P'], correctAnswer: 2, explanation: 'Ctrl + C is the universal shortcut for copying selected content.' },
    { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Central Program Unit', 'Computer Processing Unit', 'Central Processor Utility'], correctAnswer: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer.' },
    { question: 'Which of the following is not an operating system?', options: ['Windows', 'Linux', 'Oracle', 'macOS'], correctAnswer: 2, explanation: 'Oracle is a database management system, not an operating system.' },
    { question: 'What is the full form of RAM?', options: ['Read Access Memory', 'Random Access Memory', 'Rapid Access Memory', 'Read And Modify'], correctAnswer: 1, explanation: 'RAM stands for Random Access Memory, the temporary working memory.' },
    { question: 'Which protocol is used for sending emails?', options: ['HTTP', 'FTP', 'SMTP', 'TCP'], correctAnswer: 2, explanation: 'SMTP (Simple Mail Transfer Protocol) is used for sending emails.' },
    { question: 'What is the extension of MS Word document?', options: ['.xls', '.ppt', '.docx', '.pdf'], correctAnswer: 2, explanation: '.docx is the extension for Microsoft Word documents.' },
    { question: 'Which of the following is an input device?', options: ['Monitor', 'Printer', 'Keyboard', 'Speaker'], correctAnswer: 2, explanation: 'Keyboard is an input device used to enter data into the computer.' },
    { question: '1 GB is equal to:', options: ['1024 KB', '1024 MB', '1024 TB', '1024 Bytes'], correctAnswer: 1, explanation: '1 GB = 1024 MB.' },
    { question: 'HTML stands for:', options: ['Hyper Text Markup Language', 'High Text Markup Language', 'Hyper Text Machine Language', 'High Tech Markup Language'], correctAnswer: 0, explanation: 'HTML is Hyper Text Markup Language used for web pages.' },
    { question: 'Which function key refreshes the page in a browser?', options: ['F1', 'F3', 'F5', 'F7'], correctAnswer: 2, explanation: 'F5 is used to refresh or reload the current page.' },
    { question: 'The brain of a computer is:', options: ['Monitor', 'CPU', 'RAM', 'Hard Disk'], correctAnswer: 1, explanation: 'CPU is called the brain as it processes all instructions.' },
    { question: 'Which shortcut key is used to undo an action?', options: ['Ctrl + Y', 'Ctrl + Z', 'Ctrl + U', 'Ctrl + R'], correctAnswer: 1, explanation: 'Ctrl + Z is used to undo the last action.' }
  ]
};

// Generate fallback questions when AI fails
const generateFallbackQuestions = (params) => {
  const { exam, subject, topic, difficulty = 'medium', count = 10 } = params;
  const topicInfo = getTopicById(exam, topic);
  const subjectInfo = getSubjectById(exam, subject);
  
  // Determine which question set to use based on subject ID
  let questionSet = [];
  const subjectLower = (subject || '').toLowerCase();
  
  if (subjectLower.includes('reasoning') || subjectLower.includes('mental')) {
    questionSet = QUESTION_BANK.reasoning;
  } else if (subjectLower.includes('quantitative') || subjectLower.includes('math') || subjectLower.includes('arithmetic')) {
    questionSet = QUESTION_BANK.quantitative;
  } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
    questionSet = QUESTION_BANK.english;
  } else if (subjectLower.includes('gk') || subjectLower.includes('general') || subjectLower.includes('odisha') || subjectLower.includes('current')) {
    questionSet = QUESTION_BANK.gk;
  } else if (subjectLower.includes('computer') || subjectLower.includes('it')) {
    questionSet = QUESTION_BANK.computer;
  } else {
    // Use all questions mixed
    questionSet = [
      ...QUESTION_BANK.reasoning,
      ...QUESTION_BANK.quantitative,
      ...QUESTION_BANK.english,
      ...QUESTION_BANK.gk,
      ...QUESTION_BANK.computer
    ];
  }
  
  // Shuffle and select required count
  const shuffled = [...questionSet].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // If we need more questions than available, repeat with different IDs
  while (selected.length < count) {
    const extra = shuffled.slice(0, count - selected.length);
    selected.push(...extra);
  }
  
  return selected.slice(0, count).map((q, idx) => ({
    id: `fallback_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty,
    topic,
    topicName: topicInfo?.name || topic,
    subject,
    subjectName: subjectInfo?.name || subject,
    exam,
    language: 'en',
    source: 'Pre-defined Questions',
    generatedAt: new Date().toISOString()
  }));
};

// Generate MCQ questions based on syllabus - Optimized for large batches
export const generateQuestions = async (params, onProgress = null) => {
  const { exam, subject, topic, difficulty = 'medium', count = 10, language = 'en' } = params;
  
  const topicInfo = getTopicById(exam, topic);
  const subjectInfo = getSubjectById(exam, subject);
  
  // ALWAYS prepare fallback questions first as safety net
  const fallbackQuestions = generateFallbackQuestions(params);
  console.log(`📦 Prepared ${fallbackQuestions.length} fallback questions as safety net`);
  
  // Check if we should skip AI (too many failures)
  if (shouldUseFallbackDirectly()) {
    console.log('⚡ Using fallback questions immediately (API issues)');
    return fallbackQuestions;
  }
  
  // Check if API is configured
  if (!isAPIConfigured()) {
    console.log('⚠️ API key not configured, using fallback questions');
    return fallbackQuestions;
  }
  
  const languageInstruction = language === 'or' 
    ? 'Generate the questions and options in Odia (ଓଡ଼ିଆ) language.'
    : 'Generate the questions and options in English.';

  // For large counts (>20), batch the requests
  if (count > 20) {
    try {
      return await generateLargeBatch(params, onProgress);
    } catch (e) {
      console.log('Large batch failed, using fallback');
      return fallbackQuestions;
    }
  }

  const systemPrompt = `You are an expert OSSC ${exam} exam question generator.

Generate exactly ${count} unique MCQ questions for:
- Subject: ${subjectInfo?.name || subject}
- Topic: ${topicInfo?.name || topic}
- Difficulty: ${difficulty}
- ${languageInstruction}

IMPORTANT: Return ONLY valid JSON in this exact format:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]}

- Each question must be unique and exam-relevant
- correctAnswer is 0-3 (index of correct option)
- Options must be 4 different answers
- Explanation should be clear and educational
- No markdown, no code blocks, just pure JSON`;

  try {
    console.log(`📝 Generating ${count} questions for ${topicInfo?.name || topic}...`);
    if (onProgress) onProgress(10);
    
    const response = await makeAIRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} unique MCQ questions now. Return only JSON.` }
    ], { temperature: 0.8, maxTokens: count * 400 });

    if (onProgress) onProgress(80);
    
    const parsed = parseJSONResponse(response);
    const questions = parsed.questions || [];
    
    if (questions.length === 0) {
      console.warn('AI returned no questions, using fallback');
      return fallbackQuestions;
    }
    
    console.log(`✅ Successfully generated ${questions.length} AI questions`);
    if (onProgress) onProgress(100);
    
    // Validate and clean questions
    return questions.map((q, idx) => {
      let correctAnswer = q.correctAnswer;
      if (typeof correctAnswer === 'string') {
        correctAnswer = ['a', 'b', 'c', 'd'].indexOf(correctAnswer.toLowerCase());
      }
      if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
        correctAnswer = 0;
      }
      
      let options = q.options;
      if (!Array.isArray(options) || options.length !== 4) {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
      
      return {
        id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        question: String(q.question || 'Question not available'),
        options: options.map(opt => String(opt || 'Option')),
        correctAnswer,
        explanation: String(q.explanation || 'No explanation available'),
        difficulty,
        topic,
        topicName: topicInfo?.name || topic,
        subject,
        subjectName: subjectInfo?.name || subject,
        exam,
        language,
        source: 'AI-Generated',
        generatedAt: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Generate questions error:', error.message);
    console.log('📦 Returning fallback questions...');
    // ALWAYS return fallback - never throw
    return fallbackQuestions;
  }
};

// Generate large batch of questions (50-100+) using parallel requests
const generateLargeBatch = async (params, onProgress = null) => {
  const { exam, subject, topic, difficulty = 'medium', count = 100, language = 'en' } = params;
  
  const topicInfo = getTopicById(exam, topic);
  const subjectInfo = getSubjectById(exam, subject);
  
  console.log(`🚀 Generating ${count} questions in parallel batches...`);
  
  // Split into batches of 20 questions each
  const batchSize = 20;
  const numBatches = Math.ceil(count / batchSize);
  const allQuestions = [];
  
  const languageInstruction = language === 'or' 
    ? 'Generate in Odia (ଓଡ଼ିଆ) language.'
    : 'Generate in English.';

  // Create batch requests in parallel (max 3 concurrent)
  const batchPromises = [];
  
  for (let i = 0; i < numBatches; i++) {
    const batchCount = Math.min(batchSize, count - (i * batchSize));
    const batchNum = i + 1;
    
    const systemPrompt = `You are an OSSC ${exam} exam question generator (Batch ${batchNum}/${numBatches}).

Generate exactly ${batchCount} unique MCQ questions for:
- Subject: ${subjectInfo?.name || subject}
- Topic: ${topicInfo?.name || topic}  
- Difficulty: ${difficulty}
- ${languageInstruction}

Return ONLY JSON: {"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]}
Make questions different from other batches. Focus on variety.`;

    const batchPromise = (async () => {
      try {
        await sleep(i * 1000); // Stagger requests by 1 second
        
        const response = await makeAIRequest([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate batch ${batchNum}: ${batchCount} unique questions. Return JSON only.` }
        ], { temperature: 0.85 + (i * 0.02), maxTokens: batchCount * 400 });
        
        const parsed = parseJSONResponse(response);
        return parsed.questions || [];
      } catch (error) {
        console.error(`Batch ${batchNum} failed:`, error.message);
        // Return fallback questions for this batch
        return generateFallbackQuestions({ ...params, count: batchCount }).slice(0, batchCount);
      }
    })();
    
    batchPromises.push(batchPromise);
  }
  
  // Process batches with progress updates
  let completed = 0;
  for (let i = 0; i < batchPromises.length; i++) {
    const batchQuestions = await batchPromises[i];
    allQuestions.push(...batchQuestions);
    completed++;
    
    if (onProgress) {
      onProgress(Math.round((completed / numBatches) * 100));
    }
    console.log(`✅ Batch ${completed}/${numBatches} complete (${allQuestions.length} questions)`);
  }
  
  // Validate and format all questions
  return allQuestions.slice(0, count).map((q, idx) => {
    let correctAnswer = q.correctAnswer;
    if (typeof correctAnswer === 'string') {
      correctAnswer = ['a', 'b', 'c', 'd'].indexOf(correctAnswer.toLowerCase());
    }
    if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
      correctAnswer = 0;
    }
    
    let options = q.options;
    if (!Array.isArray(options) || options.length !== 4) {
      options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }
    
    return {
      id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      question: String(q.question || 'Question not available'),
      options: options.map(opt => String(opt || 'Option')),
      correctAnswer,
      explanation: String(q.explanation || 'No explanation available'),
      difficulty,
      topic,
      topicName: topicInfo?.name || topic,
      subject,
      subjectName: subjectInfo?.name || subject,
      exam,
      language,
      source: 'AI-Generated',
      generatedAt: new Date().toISOString()
    };
  });
};

// Generate Mock Test (100 questions) - Optimized with parallel generation
export const generateMockTest = async (params, onProgress = null) => {
  const { exam, language = 'en', questionCount = 100 } = params;
  const syllabus = getSyllabus(exam);
  
  console.log(`📋 Generating Mock Test with ${questionCount} questions using parallel requests...`);
  
  if (onProgress) onProgress(5);
  
  // Calculate questions per subject based on weightage
  const subjectQuestions = syllabus.subjects.map(subject => ({
    subject,
    count: Math.max(5, Math.round((subject.weightage / 100) * questionCount))
  }));
  
  // Generate all subjects in parallel
  const subjectPromises = subjectQuestions.map(async ({ subject, count }, idx) => {
    const topicsToUse = subject.topics.slice(0, Math.min(3, subject.topics.length));
    const questionsPerTopic = Math.ceil(count / topicsToUse.length);
    const subjectQuestions = [];
    
    for (const topic of topicsToUse) {
      try {
        await sleep(idx * 500); // Stagger slightly
        const questions = await generateQuestions({
          exam,
          subject: subject.id,
          topic: topic.id,
          difficulty: 'medium',
          count: Math.min(questionsPerTopic, 15),
          language
        });
        subjectQuestions.push(...questions);
      } catch (error) {
        console.error(`Error for ${topic.name}:`, error.message);
        // Use fallback for this topic
        const fallback = generateFallbackQuestions({
          exam, subject: subject.id, topic: topic.id, count: questionsPerTopic
        });
        subjectQuestions.push(...fallback);
      }
    }
    
    return subjectQuestions.slice(0, count);
  });
  
  // Wait for all subjects with progress updates
  const results = [];
  for (let i = 0; i < subjectPromises.length; i++) {
    const questions = await subjectPromises[i];
    results.push(...questions);
    if (onProgress) {
      onProgress(10 + Math.round((i / subjectPromises.length) * 85));
    }
  }
  
  if (results.length === 0) {
    throw new Error('Failed to generate any questions for mock test');
  }
  
  if (onProgress) onProgress(100);
  console.log(`✅ Mock test complete: ${results.length} questions generated`);
  
  // Shuffle and return
  return results.sort(() => Math.random() - 0.5).slice(0, questionCount);
};

// Generate Daily Test (10 questions)
export const generateDailyTest = async (params) => {
  const { exam, language = 'en', questionCount = 10, weakTopics = [] } = params;
  const syllabus = getSyllabus(exam);
  
  console.log(`📅 Generating Daily Test with ${questionCount} questions...`);
  
  const allQuestions = [];
  
  // Select random subjects and topics
  const shuffledSubjects = syllabus.subjects.sort(() => Math.random() - 0.5).slice(0, 3);
  
  for (const subject of shuffledSubjects) {
    const randomTopic = subject.topics[Math.floor(Math.random() * subject.topics.length)];
    
    try {
      const questions = await generateQuestions({
        exam,
        subject: subject.id,
        topic: randomTopic.id,
        difficulty: 'medium',
        count: 4,
        language
      });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error generating daily test questions:`, error.message);
    }
    await sleep(500);
  }
  
  return allQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);
};

// AI Chatbot - Uses Llama 3.3 for best stability
export const sendChatMessage = async (params) => {
  const { message, examType = 'RI', language = 'en', conversationHistory = [] } = params;
  
  const systemPrompt = `You are an expert OSSC ${examType} exam tutor and mentor. 

Your role:
- Help students prepare for OSSC exams (RI/ARI/AMIN/SFS)
- Explain concepts clearly with examples
- Provide study tips and strategies
- Answer questions about Odisha government exams
- Be encouraging and supportive
- Focus on exam-relevant content

Language: ${language === 'or' ? 'Respond in Odia when appropriate' : 'Respond in English'}`;

  try {
    // Use Llama 3.3 for stability
    const model = OPENROUTER_CONFIG.models.chatbot;
    
    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      { 
        headers: getOpenRouterHeaders(),
        timeout: 60000
      }
    );
    
    const content = response.data.choices?.[0]?.message?.content;
    if (content) {
      return content;
    }
    
    throw new Error('Empty response');
  } catch (error) {
    console.error('Chatbot error:', error.message);
    // Return helpful fallback message
    return `I'm here to help you prepare for the OSSC ${examType} exam! While I'm having a brief connection issue, here are some tips:

1. **Focus on key subjects**: Reasoning, English, Math, and Odisha GK
2. **Practice daily**: Use our question bank regularly
3. **Review explanations**: Learn from both correct and incorrect answers

Please try your question again in a moment!`;
  }
};

// Translate text - Uses Llama 3.3 for language translation
export const translateText = async (params) => {
  const { text, fromLanguage = 'en', toLanguage = 'or' } = params;
  
  try {
    const model = OPENROUTER_CONFIG.models.translation;
    
    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: `Translate from ${fromLanguage === 'en' ? 'English' : 'Odia'} to ${toLanguage === 'en' ? 'English' : 'Odia (ଓଡ଼ିଆ)'}. Return only the translation, no explanations.` },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      { 
        headers: getOpenRouterHeaders(),
        timeout: 30000
      }
    );
    
    return response.data.choices?.[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error.message);
    return text;
  }
};

// Generate explanation - Uses Llama 3.3 for clear explanations
export const generateExplanation = async (params) => {
  const { question, options, correctAnswer, language = 'en' } = params;
  
  try {
    const model = OPENROUTER_CONFIG.models.explanation;
    
    const response = await axios.post(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: `You are an educational expert. Explain why the correct answer is right for this exam question. Be clear, concise, and educational. ${language === 'or' ? 'Explain in Odia if possible.' : ''}` },
          { role: 'user', content: `Question: ${question}\nOptions: ${options?.join(', ')}\nCorrect Answer: ${options?.[correctAnswer]}\n\nExplain why this is the correct answer.` }
        ],
        temperature: 0.5,
        max_tokens: 600
      },
      { 
        headers: getOpenRouterHeaders(),
        timeout: 30000
      }
    );
    
    return response.data.choices?.[0]?.message?.content || 'Explanation not available.';
  } catch (error) {
    console.error('Explanation error:', error.message);
    return 'Explanation not available at this time.';
  }
};

export default {
  generateQuestions,
  generateMockTest,
  generateDailyTest,
  sendChatMessage,
  translateText,
  generateExplanation
};
