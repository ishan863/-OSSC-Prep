// ============================================================
// 🔥 Push All Questions to Firestore - Topic Wise
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all question files
const questionsDir = path.join(__dirname, '../src/data/questions');

// All question files
const questionFiles = [
  'ossc_groq_5k.json',
  'all_questions.json',
  'reasoning___mental_ability.json',
  'quantitative_aptitude.json',
  'english_language.json',
  'general_knowledge.json',
  'odisha_gk.json',
];

// Collect all questions
let allQuestions = [];
const fileStats = {};

console.log('=' .repeat(60));
console.log('📚 READING ALL QUESTION FILES');
console.log('=' .repeat(60));

for (const file of questionFiles) {
  const filePath = path.join(questionsDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        fileStats[file] = data.length;
        console.log(`✅ ${file}: ${data.length} questions`);
        allQuestions.push(...data);
      }
    } catch (e) {
      console.log(`❌ ${file}: Error reading - ${e.message}`);
    }
  } else {
    console.log(`⚠️ ${file}: Not found`);
  }
}

// Remove duplicates by question text
const seen = new Set();
const uniqueQuestions = [];
for (const q of allQuestions) {
  const key = q.question?.toLowerCase().trim().substring(0, 100);
  if (key && !seen.has(key)) {
    seen.add(key);
    uniqueQuestions.push(q);
  }
}

console.log('\n' + '=' .repeat(60));
console.log('📊 QUESTION COUNTS');
console.log('=' .repeat(60));
console.log(`📁 Total from files: ${allQuestions.length}`);
console.log(`🔄 After removing duplicates: ${uniqueQuestions.length}`);

// Organize by Subject and Topic
const bySubject = {};
const byTopic = {};

for (const q of uniqueQuestions) {
  // Normalize subject names
  let subject = q.subject || 'Unknown';
  subject = subject.replace(/&/g, 'and').trim();
  
  // Map short names to full names
  const subjectMap = {
    'Reasoning': 'Reasoning and Mental Ability',
    'Reasoning and Mental Ability': 'Reasoning and Mental Ability',
    'Quantitative': 'Quantitative Aptitude',
    'Quantitative Aptitude': 'Quantitative Aptitude',
    'English': 'English Language',
    'English Language': 'English Language',
    'GK': 'General Knowledge',
    'General Knowledge': 'General Knowledge',
    'Odisha GK': 'Odisha GK',
    'Odia': 'Odia Language',
    'Odia Language': 'Odia Language',
  };
  
  subject = subjectMap[subject] || subject;
  const topic = q.topic || 'General';
  
  // Count by subject
  if (!bySubject[subject]) bySubject[subject] = [];
  bySubject[subject].push(q);
  
  // Count by topic
  const topicKey = `${subject} > ${topic}`;
  if (!byTopic[topicKey]) byTopic[topicKey] = [];
  byTopic[topicKey].push(q);
}

// Print subject-wise counts
console.log('\n' + '=' .repeat(60));
console.log('📚 QUESTIONS BY SUBJECT');
console.log('=' .repeat(60));

const subjectOrder = [
  'Reasoning and Mental Ability',
  'Quantitative Aptitude', 
  'English Language',
  'General Knowledge',
  'Odisha GK',
  'Odia Language',
];

let totalCount = 0;
for (const subject of subjectOrder) {
  const count = bySubject[subject]?.length || 0;
  totalCount += count;
  const bar = '█'.repeat(Math.floor(count / 50)) || '░';
  console.log(`${subject.padEnd(30)} : ${count.toString().padStart(5)} ${bar}`);
}
console.log('-'.repeat(60));
console.log(`${'TOTAL'.padEnd(30)} : ${totalCount.toString().padStart(5)}`);

// Print topic-wise counts
console.log('\n' + '=' .repeat(60));
console.log('📖 QUESTIONS BY TOPIC');
console.log('=' .repeat(60));

const sortedTopics = Object.entries(byTopic)
  .sort((a, b) => b[1].length - a[1].length);

for (const [topic, questions] of sortedTopics) {
  console.log(`${topic.substring(0, 45).padEnd(45)} : ${questions.length.toString().padStart(4)}`);
}

// Create merged questions file for the app
const mergedFile = path.join(questionsDir, 'merged_questions.json');
fs.writeFileSync(mergedFile, JSON.stringify(uniqueQuestions, null, 2));
console.log(`\n✅ Saved ${uniqueQuestions.length} unique questions to merged_questions.json`);

// Create subject-wise files
console.log('\n' + '=' .repeat(60));
console.log('📁 CREATING SUBJECT-WISE FILES');
console.log('=' .repeat(60));

for (const [subject, questions] of Object.entries(bySubject)) {
  const filename = subject.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_merged.json';
  const filepath = path.join(questionsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(questions, null, 2));
  console.log(`✅ ${filename}: ${questions.length} questions`);
}

// Create Firestore upload data structure
const firestoreData = {
  metadata: {
    totalQuestions: uniqueQuestions.length,
    lastUpdated: new Date().toISOString(),
    subjects: Object.keys(bySubject).map(s => ({
      name: s,
      count: bySubject[s].length,
      topics: [...new Set(bySubject[s].map(q => q.topic))].filter(Boolean)
    }))
  },
  questions: uniqueQuestions
};

const firestoreFile = path.join(questionsDir, 'firestore_data.json');
fs.writeFileSync(firestoreFile, JSON.stringify(firestoreData, null, 2));
console.log(`\n✅ Created firestore_data.json for upload`);

// Summary
console.log('\n' + '=' .repeat(60));
console.log('🎉 SUMMARY');
console.log('=' .repeat(60));
console.log(`📊 Total Unique Questions: ${uniqueQuestions.length}`);
console.log(`📚 Subjects: ${Object.keys(bySubject).length}`);
console.log(`📖 Topics: ${Object.keys(byTopic).length}`);
console.log('\n✅ All files ready!');
console.log('Run: npm run dev to start the website');
