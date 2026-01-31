// Analyze all topics in merged questions
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/questions/merged_questions.json'), 'utf8'));

console.log('=' .repeat(70));
console.log('📚 TOPIC ANALYSIS - All Questions');
console.log('=' .repeat(70));

// Analyze by subject and topic
const bySubject = {};
const byTopic = {};
const topicList = [];

data.forEach(q => {
  const subject = q.subject || 'Unknown';
  const topic = q.topic || 'General';
  
  // Count by subject
  if (!bySubject[subject]) bySubject[subject] = { count: 0, topics: {} };
  bySubject[subject].count++;
  
  // Count by topic within subject
  if (!bySubject[subject].topics[topic]) bySubject[subject].topics[topic] = 0;
  bySubject[subject].topics[topic]++;
  
  // Full topic key
  const topicKey = `${subject}|||${topic}`;
  if (!byTopic[topicKey]) {
    byTopic[topicKey] = [];
    topicList.push({ subject, topic, key: topicKey });
  }
  byTopic[topicKey].push(q.id);
});

// Print subject-wise breakdown
console.log('\n📊 SUBJECT-WISE BREAKDOWN:\n');

const subjectOrder = [
  'Reasoning and Mental Ability',
  'Quantitative Aptitude',
  'English Language',
  'General Knowledge',
  'Odisha GK',
  'Odia Language'
];

for (const subject of subjectOrder) {
  const info = bySubject[subject];
  if (!info) continue;
  
  console.log(`\n🔷 ${subject} (${info.count} questions)`);
  console.log('-'.repeat(50));
  
  const sortedTopics = Object.entries(info.topics)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [topic, count] of sortedTopics) {
    const bar = '█'.repeat(Math.ceil(count / 5));
    console.log(`   ${topic.padEnd(35)} : ${count.toString().padStart(3)} ${bar}`);
  }
}

// Create topic mapping for the app
console.log('\n\n' + '=' .repeat(70));
console.log('📋 CREATING TOPIC MAPPING FILE');
console.log('=' .repeat(70));

const topicMapping = {};

for (const subject of Object.keys(bySubject)) {
  topicMapping[subject] = {};
  
  for (const topic of Object.keys(bySubject[subject].topics)) {
    const count = bySubject[subject].topics[topic];
    const key = `${subject}|||${topic}`;
    const questionIds = byTopic[key];
    
    topicMapping[subject][topic] = {
      count,
      questionIds
    };
  }
}

// Save topic mapping
const mappingFile = path.join(__dirname, '../src/data/questions/topic_mapping.json');
fs.writeFileSync(mappingFile, JSON.stringify(topicMapping, null, 2));
console.log(`✅ Saved topic mapping to topic_mapping.json`);

// Create normalized topic index for exact matching
const topicIndex = {};
topicList.forEach(({ subject, topic, key }) => {
  const normalizedTopic = topic.toLowerCase().trim();
  const normalizedSubject = subject.toLowerCase().trim();
  
  if (!topicIndex[normalizedSubject]) {
    topicIndex[normalizedSubject] = {};
  }
  
  topicIndex[normalizedSubject][normalizedTopic] = {
    originalSubject: subject,
    originalTopic: topic,
    count: byTopic[key].length
  };
});

const indexFile = path.join(__dirname, '../src/data/questions/topic_index.json');
fs.writeFileSync(indexFile, JSON.stringify(topicIndex, null, 2));
console.log(`✅ Saved topic index to topic_index.json`);

// Summary
console.log('\n' + '=' .repeat(70));
console.log('📊 SUMMARY');
console.log('=' .repeat(70));
console.log(`Total Questions: ${data.length}`);
console.log(`Total Subjects: ${Object.keys(bySubject).length}`);
console.log(`Total Unique Topics: ${topicList.length}`);

// Print all topics as a list
console.log('\n📋 ALL TOPICS LIST:');
topicList.sort((a, b) => a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));
topicList.forEach(({ subject, topic }, i) => {
  console.log(`${(i+1).toString().padStart(3)}. ${subject} > ${topic}`);
});
