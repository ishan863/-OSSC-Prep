/**
 * Generate 10 more questions to complete 100
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_API = 'http://localhost:11434/api/generate';
const MODELS = ['llama3:latest', 'mistral:latest'];
const QUESTIONS_DIR = path.join(__dirname, '../src/data/questions');

// Load existing questions
const existingQuestions = JSON.parse(
  fs.readFileSync(path.join(QUESTIONS_DIR, 'all_questions.json'), 'utf-8')
);
const generatedQuestions = new Set(existingQuestions.map(q => q.question.toLowerCase().trim()));

console.log(`📊 Existing questions: ${existingQuestions.length}`);
console.log(`🎯 Need to generate: ${100 - existingQuestions.length} more questions`);

const EXTRA_TOPICS = [
  { subject: 'Reasoning & Mental Ability', topic: 'Non-Verbal Reasoning', subtopics: ['Mirror Image', 'Paper Folding', 'Counting Figures'], count: 3, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Geometry', subtopics: ['Triangles', 'Circles', 'Quadrilaterals'], count: 2, difficulty: 'medium' },
  { subject: 'Quantitative Aptitude', topic: 'Data Interpretation', subtopics: ['Tables', 'Bar Graphs', 'Pie Charts'], count: 2, difficulty: 'hard' },
  { subject: 'General Knowledge', topic: 'Current Affairs', subtopics: ['National Events', 'Sports', 'Awards'], count: 3, difficulty: 'easy' },
];

function generateId() {
  return 'q_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function parseModelResponse(response) {
  try {
    let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function callOllama(model, prompt) {
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 1024 }
      })
    });
    
    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama API call failed:', error.message);
    return null;
  }
}

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
6. Difficulty level: ${topic.difficulty}

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
  "explanation": "Detailed explanation of why this answer is correct"
}`;

  const response = await callOllama(model, prompt);
  if (!response) return null;
  
  const parsed = parseModelResponse(response);
  if (!parsed || !parsed.question || !parsed.options || !parsed.correctAnswer || !parsed.explanation) {
    return null;
  }
  
  const questionHash = parsed.question.toLowerCase().trim();
  if (generatedQuestions.has(questionHash)) {
    console.log('  ⚠️ Duplicate question, skipping...');
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

async function generateExtraQuestions() {
  const newQuestions = [];
  let modelIndex = 0;
  
  for (const topic of EXTRA_TOPICS) {
    console.log(`\n📚 ${topic.subject} > ${topic.topic}`);
    
    for (let i = 0; i < topic.count; i++) {
      const model = MODELS[modelIndex % MODELS.length];
      modelIndex++;
      
      console.log(`  🔄 Generating using ${model}...`);
      
      let question = await generateQuestion(model, topic);
      let attempts = 0;
      
      while (!question && attempts < 3) {
        attempts++;
        question = await generateQuestion(MODELS[attempts % MODELS.length], topic);
      }
      
      if (question) {
        newQuestions.push(question);
        console.log(`  ✅ Generated: "${question.question.substring(0, 50)}..."`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Merge with existing questions
  const allQuestions = [...existingQuestions, ...newQuestions];
  
  // Save updated all_questions.json
  fs.writeFileSync(
    path.join(QUESTIONS_DIR, 'all_questions.json'),
    JSON.stringify(allQuestions, null, 2),
    'utf-8'
  );
  
  // Update index
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
    fs.writeFileSync(
      path.join(QUESTIONS_DIR, filename),
      JSON.stringify(questions, null, 2),
      'utf-8'
    );
  }
  
  // Update index
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
  console.log(`➕ New Questions: ${newQuestions.length}`);
  console.log('='.repeat(50));
}

generateExtraQuestions().catch(console.error);
