/**
 * OSSC RI/AI Exam Question Generator
 * Uses Ollama with Llama 3 and Mistral models to generate exam questions
 * 
 * Run: node scripts/generateQuestions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ollama API endpoint
const OLLAMA_API = 'http://localhost:11434/api/generate';

// Models to use (alternating for variety)
const MODELS = ['llama3:latest', 'mistral:latest'];

// Question storage path
const QUESTIONS_DIR = path.join(__dirname, '../src/data/questions');

// Syllabus topics for question generation
const SYLLABUS_TOPICS = [
  // Reasoning & Mental Ability (25 questions)
  { subject: 'Reasoning & Mental Ability', topic: 'Analogy', subtopics: ['Word Analogy', 'Number Analogy', 'Letter Analogy'], count: 3, difficulty: 'medium' },
  { subject: 'Reasoning & Mental Ability', topic: 'Series Completion', subtopics: ['Number Series', 'Letter Series', 'Alpha-Numeric Series'], count: 3, difficulty: 'medium' },
  { subject: 'Reasoning & Mental Ability', topic: 'Coding-Decoding', subtopics: ['Letter Coding', 'Number Coding', 'Mixed Coding'], count: 3, difficulty: 'medium' },
  { subject: 'Reasoning & Mental Ability', topic: 'Blood Relations', subtopics: ['Direct Relations', 'Coded Relations'], count: 2, difficulty: 'medium' },
  { subject: 'Reasoning & Mental Ability', topic: 'Direction & Distance', subtopics: ['Simple Directions', 'Complex Directions'], count: 2, difficulty: 'easy' },
  { subject: 'Reasoning & Mental Ability', topic: 'Ranking & Order', subtopics: ['Linear Arrangement', 'Circular Arrangement'], count: 2, difficulty: 'medium' },
  { subject: 'Reasoning & Mental Ability', topic: 'Syllogism', subtopics: ['Basic Syllogism', 'Either-Or Cases'], count: 2, difficulty: 'hard' },
  { subject: 'Reasoning & Mental Ability', topic: 'Venn Diagrams', subtopics: ['Two Elements', 'Three Elements'], count: 2, difficulty: 'easy' },
  { subject: 'Reasoning & Mental Ability', topic: 'Puzzles', subtopics: ['Seating Arrangement', 'Scheduling'], count: 3, difficulty: 'hard' },
  { subject: 'Reasoning & Mental Ability', topic: 'Statement & Conclusions', subtopics: ['Statement-Conclusion', 'Statement-Assumption'], count: 3, difficulty: 'medium' },
  
  // Quantitative Aptitude (25 questions)
  { subject: 'Quantitative Aptitude', topic: 'Number System', subtopics: ['HCF & LCM', 'Divisibility', 'Unit Digit'], count: 2, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Simplification', subtopics: ['BODMAS', 'Fractions', 'Decimals'], count: 2, difficulty: 'easy' },
  { subject: 'Quantitative Aptitude', topic: 'Percentage', subtopics: ['Basic Percentage', 'Successive Percentage'], count: 3, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Ratio & Proportion', subtopics: ['Simple Ratio', 'Partnership'], count: 2, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Average', subtopics: ['Simple Average', 'Age Problems'], count: 2, difficulty: 'easy' },
  { subject: 'Quantitative Aptitude', topic: 'Profit & Loss', subtopics: ['Basic P&L', 'Discount', 'Marked Price'], count: 3, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Simple Interest', subtopics: ['Basic SI', 'Time & Rate Problems'], count: 2, difficulty: 'easy' },
  { subject: 'Quantitative Aptitude', topic: 'Compound Interest', subtopics: ['Basic CI', 'SI vs CI Difference'], count: 2, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Time & Work', subtopics: ['Basic Work', 'Pipes & Cisterns'], count: 2, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Time, Speed & Distance', subtopics: ['Basic TSD', 'Trains'], count: 3, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Mensuration', subtopics: ['Area', 'Volume', 'Surface Area'], count: 2, difficulty: 'hard' },
  
  // English Language (15 questions)
  { subject: 'English Language', topic: 'Grammar', subtopics: ['Tenses', 'Subject-Verb Agreement', 'Articles'], count: 3, difficulty: 'medium' },
  { subject: 'English Language', topic: 'Vocabulary', subtopics: ['Synonyms', 'Antonyms', 'Idioms & Phrases'], count: 3, difficulty: 'easy' },
  { subject: 'English Language', topic: 'Error Spotting', subtopics: ['Grammatical Errors', 'Sentence Correction'], count: 3, difficulty: 'medium' },
  { subject: 'English Language', topic: 'Fill in the Blanks', subtopics: ['Single Blanks', 'Double Blanks'], count: 3, difficulty: 'medium' },
  { subject: 'English Language', topic: 'Sentence Rearrangement', subtopics: ['Para Jumbles'], count: 3, difficulty: 'hard' },
  
  // General Knowledge (15 questions)
  { subject: 'General Knowledge', topic: 'Indian History', subtopics: ['Ancient India', 'Medieval India', 'Freedom Struggle'], count: 3, difficulty: 'medium' },
  { subject: 'General Knowledge', topic: 'Geography', subtopics: ['Indian Geography', 'Physical Geography'], count: 3, difficulty: 'medium' },
  { subject: 'General Knowledge', topic: 'Indian Polity', subtopics: ['Constitution', 'Fundamental Rights'], count: 3, difficulty: 'medium' },
  { subject: 'General Knowledge', topic: 'Indian Economy', subtopics: ['Banking', 'Budget', 'Economic Planning'], count: 3, difficulty: 'medium' },
  { subject: 'General Knowledge', topic: 'General Science', subtopics: ['Physics', 'Chemistry', 'Biology'], count: 3, difficulty: 'easy' },
  
  // Odisha GK (10 questions)
  { subject: 'Odisha GK', topic: 'Odisha History', subtopics: ['Ancient Odisha', 'Freedom Movement in Odisha'], count: 2, difficulty: 'medium' },
  { subject: 'Odisha GK', topic: 'Odisha Geography', subtopics: ['Rivers', 'Districts', 'Natural Resources'], count: 2, difficulty: 'easy' },
  { subject: 'Odisha GK', topic: 'Odisha Culture & Heritage', subtopics: ['Temples', 'Festivals', 'Dance Forms'], count: 2, difficulty: 'easy' },
  { subject: 'Odisha GK', topic: 'Odisha Economy', subtopics: ['Industries', 'Minerals', 'Government Schemes'], count: 2, difficulty: 'medium' },
  { subject: 'Odisha GK', topic: 'Odisha Polity & Administration', subtopics: ['Panchayati Raj', 'Administrative Divisions'], count: 2, difficulty: 'medium' },
];

// Track generated questions to avoid duplicates
const generatedQuestions = new Set();

// Generate unique ID
function generateId() {
  return 'q_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Clean and parse JSON from model response
function parseModelResponse(response) {
  try {
    // Remove any markdown code blocks
    let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    
    // Try to find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse response:', error.message);
    return null;
  }
}

// Call Ollama API
async function callOllama(model, prompt) {
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1024
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama API call failed:', error.message);
    return null;
  }
}

// Generate question using AI model
async function generateQuestion(model, topic) {
  const prompt = `You are an expert question setter for OSSC (Odisha Staff Selection Commission) Revenue Inspector (RI) and Amin (AI) competitive exams in India.

Generate ONE unique multiple-choice question (MCQ) for the following:
- Subject: ${topic.subject}
- Topic: ${topic.topic}
- Subtopic: ${topic.subtopics[Math.floor(Math.random() * topic.subtopics.length)]}
- Difficulty: ${topic.difficulty}

Requirements:
1. Question must be appropriate for government competitive exams
2. Exactly 4 options (A, B, C, D)
3. Only ONE correct answer
4. Clear and concise explanation of why the answer is correct
5. Question should test conceptual understanding
6. Difficulty level: ${topic.difficulty} (easy = basic, medium = intermediate, hard = advanced)

Return ONLY a valid JSON object in this exact format (no other text):
{
  "question": "The question text here",
  "options": {
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  },
  "correctAnswer": "A",
  "explanation": "Detailed explanation of why this answer is correct and why others are wrong"
}`;

  const response = await callOllama(model, prompt);
  if (!response) return null;
  
  const parsed = parseModelResponse(response);
  if (!parsed) return null;
  
  // Validate structure
  if (!parsed.question || !parsed.options || !parsed.correctAnswer || !parsed.explanation) {
    return null;
  }
  
  // Check for duplicate
  const questionHash = parsed.question.toLowerCase().trim();
  if (generatedQuestions.has(questionHash)) {
    console.log('  ⚠️ Duplicate question, regenerating...');
    return null;
  }
  
  generatedQuestions.add(questionHash);
  
  return {
    id: generateId(),
    subject: topic.subject,
    topic: topic.topic,
    subtopic: topic.subtopics[0],
    difficulty: topic.difficulty,
    question: parsed.question,
    options: parsed.options,
    correctAnswer: parsed.correctAnswer,
    explanation: parsed.explanation,
    model: model,
    generatedAt: new Date().toISOString()
  };
}

// Save questions to file
function saveQuestions(questions, filename) {
  const filepath = path.join(QUESTIONS_DIR, filename);
  
  // Create directory if not exists
  if (!fs.existsSync(QUESTIONS_DIR)) {
    fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`✅ Saved ${questions.length} questions to ${filename}`);
}

// Main generation function
async function generateAllQuestions() {
  console.log('🚀 Starting OSSC RI/AI Question Generation');
  console.log('📦 Models: llama3:latest, mistral:latest');
  console.log('📝 Target: 100 unique questions\n');
  
  const allQuestions = [];
  let modelIndex = 0;
  let totalGenerated = 0;
  let retryCount = 0;
  const maxRetries = 3;
  
  for (const topic of SYLLABUS_TOPICS) {
    console.log(`\n📚 ${topic.subject} > ${topic.topic}`);
    
    for (let i = 0; i < topic.count; i++) {
      const model = MODELS[modelIndex % MODELS.length];
      modelIndex++;
      
      console.log(`  🔄 Generating Q${totalGenerated + 1} using ${model}...`);
      
      let question = null;
      let attempts = 0;
      
      while (!question && attempts < maxRetries) {
        question = await generateQuestion(model, topic);
        attempts++;
        
        if (!question && attempts < maxRetries) {
          console.log(`  ⚠️ Retry ${attempts}/${maxRetries}...`);
          // Switch model on retry
          const retryModel = MODELS[(modelIndex + attempts) % MODELS.length];
          question = await generateQuestion(retryModel, topic);
        }
      }
      
      if (question) {
        allQuestions.push(question);
        totalGenerated++;
        console.log(`  ✅ Generated: "${question.question.substring(0, 50)}..."`);
        
        // Save progress every 10 questions
        if (totalGenerated % 10 === 0) {
          saveQuestions(allQuestions, 'questions_progress.json');
          console.log(`\n💾 Progress saved: ${totalGenerated} questions\n`);
        }
      } else {
        console.log(`  ❌ Failed to generate after ${maxRetries} attempts`);
        retryCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Group questions by subject
  const questionsBySubject = {};
  allQuestions.forEach(q => {
    if (!questionsBySubject[q.subject]) {
      questionsBySubject[q.subject] = [];
    }
    questionsBySubject[q.subject].push(q);
  });
  
  // Save by subject
  for (const [subject, questions] of Object.entries(questionsBySubject)) {
    const filename = subject.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json';
    saveQuestions(questions, filename);
  }
  
  // Save all questions
  saveQuestions(allQuestions, 'all_questions.json');
  
  // Create index file
  const indexData = {
    totalQuestions: allQuestions.length,
    generatedAt: new Date().toISOString(),
    subjects: Object.entries(questionsBySubject).map(([name, qs]) => ({
      name,
      count: qs.length,
      file: name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json'
    })),
    difficultyBreakdown: {
      easy: allQuestions.filter(q => q.difficulty === 'easy').length,
      medium: allQuestions.filter(q => q.difficulty === 'medium').length,
      hard: allQuestions.filter(q => q.difficulty === 'hard').length
    }
  };
  
  fs.writeFileSync(
    path.join(QUESTIONS_DIR, 'index.json'),
    JSON.stringify(indexData, null, 2),
    'utf-8'
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Generation Complete!');
  console.log(`✅ Total Questions: ${allQuestions.length}`);
  console.log(`❌ Failed: ${retryCount}`);
  console.log(`📁 Location: ${QUESTIONS_DIR}`);
  console.log('='.repeat(50));
}

// Run the generator
generateAllQuestions().catch(console.error);
