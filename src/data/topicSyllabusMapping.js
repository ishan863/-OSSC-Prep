// Mapping between Syllabus Topics (from syllabus.js) and Question Topics (from Groq-generated questions)
// This ensures that when a user selects a syllabus topic, they get questions from the correct topic

// Maps syllabus topic IDs/names to actual question topic names
export const SYLLABUS_TO_QUESTION_TOPIC = {
  // ========= REASONING & MENTAL ABILITY =========
  // Syllabus Topic ID -> Question Topic Names (array for multiple matching topics)
  'ri-reasoning-analogy': ['Analogy'],
  'ai-reasoning-analogy': ['Analogy'],
  'Analogy': ['Analogy'],
  
  'ri-reasoning-series': ['Series Completion'],
  'ai-reasoning-series': ['Series Completion'],
  'Series Completion': ['Series Completion'],
  
  'ri-reasoning-coding': ['Coding-Decoding'],
  'ai-reasoning-coding': ['Coding-Decoding'],
  'Coding-Decoding': ['Coding-Decoding'],
  
  'ri-reasoning-blood': ['Blood Relations'],
  'ai-reasoning-blood': ['Blood Relations'],
  'Blood Relations': ['Blood Relations'],
  
  'ri-reasoning-direction': ['Direction & Distance'],
  'ai-reasoning-direction': ['Direction & Distance'],
  'Direction & Distance': ['Direction & Distance'],
  
  'ri-reasoning-ranking': ['Ranking & Order'],
  'ai-reasoning-ranking': ['Ranking & Order'],
  'Ranking & Order': ['Ranking & Order'],
  
  'ri-reasoning-syllogism': ['Syllogism'],
  'ai-reasoning-syllogism': ['Syllogism'],
  'Syllogism': ['Syllogism'],
  
  'ri-reasoning-venn': ['Venn Diagrams'],
  'ai-reasoning-venn': ['Venn Diagrams'],
  'Venn Diagrams': ['Venn Diagrams'],
  
  'ri-reasoning-puzzle': ['Puzzles'],
  'ai-reasoning-puzzle': ['Puzzles'],
  'Puzzles': ['Puzzles'],
  
  'ri-reasoning-statement': ['Statement & Conclusions'],
  'ai-reasoning-statement': ['Statement & Conclusions'],
  'Statement & Conclusions': ['Statement & Conclusions'],
  
  'ri-reasoning-figure': ['Non-Verbal Reasoning'],
  'ai-reasoning-figure': ['Non-Verbal Reasoning'],
  'Non-Verbal Reasoning': ['Non-Verbal Reasoning'],
  
  // Additional reasoning topics found in questions
  'Odd One Out': ['Odd One Out'],
  'Classification': ['Classification'],
  
  // ========= QUANTITATIVE APTITUDE =========
  'ri-quant-number': ['Number System'],
  'ai-quant-number': ['Number System'],
  'Number System': ['Number System'],
  
  'ri-quant-simplification': ['Simplification'],
  'ai-quant-simplification': ['Simplification'],
  'Simplification': ['Simplification'],
  
  'ri-quant-percentage': ['Percentage'],
  'ai-quant-percentage': ['Percentage'],
  'Percentage': ['Percentage'],
  
  'ri-quant-ratio': ['Ratio & Proportion'],
  'ai-quant-ratio': ['Ratio & Proportion'],
  'Ratio & Proportion': ['Ratio & Proportion'],
  
  'ri-quant-average': ['Average'],
  'ai-quant-average': ['Average'],
  'Average': ['Average'],
  
  'ri-quant-profit': ['Profit & Loss'],
  'ai-quant-profit': ['Profit & Loss'],
  'Profit & Loss': ['Profit & Loss'],
  
  'ri-quant-si': ['Simple Interest'],
  'ai-quant-si': ['Simple Interest'],
  'Simple Interest': ['Simple Interest'],
  
  'ri-quant-ci': ['Compound Interest'],
  'ai-quant-ci': ['Compound Interest'],
  'Compound Interest': ['Compound Interest'],
  
  'ri-quant-time-work': ['Time & Work'],
  'ai-quant-time-work': ['Time & Work'],
  'Time & Work': ['Time & Work'],
  
  'ri-quant-time-distance': ['Time Speed Distance', 'Time, Speed & Distance'],
  'ai-quant-time-distance': ['Time Speed Distance', 'Time, Speed & Distance'],
  'Time, Speed & Distance': ['Time Speed Distance', 'Time, Speed & Distance'],
  
  'ri-quant-mensuration': ['Mensuration', 'Mensuration 2D', 'Mensuration 3D'],
  'ai-quant-mensuration': ['Mensuration', 'Mensuration 2D', 'Mensuration 3D'],
  'Mensuration': ['Mensuration', 'Mensuration 2D', 'Mensuration 3D'],
  
  'ri-quant-geometry': ['Geometry'],
  'ai-quant-geometry': ['Geometry'],
  'Geometry': ['Geometry'],
  
  'ri-quant-data': ['Data Interpretation'],
  'ai-quant-data': ['Data Interpretation'],
  'Data Interpretation': ['Data Interpretation'],
  
  // Additional quant topics
  'Probability': ['Probability'],
  'Algebra': ['Algebra'],
  
  // ========= ENGLISH LANGUAGE =========
  'ri-eng-grammar': ['Grammar', 'Grammar - Parts of Speech', 'Grammar - Tenses', 'Subject-Verb Agreement'],
  'ai-eng-grammar': ['Grammar', 'Grammar - Parts of Speech', 'Grammar - Tenses', 'Subject-Verb Agreement'],
  'Grammar': ['Grammar', 'Grammar - Parts of Speech', 'Grammar - Tenses', 'Subject-Verb Agreement'],
  
  'ri-eng-vocabulary': ['Vocabulary', 'Vocabulary - Synonyms', 'Vocabulary - Antonyms', 'One Word Substitution', 'Idioms & Phrases'],
  'ai-eng-vocabulary': ['Vocabulary', 'Vocabulary - Synonyms', 'Vocabulary - Antonyms', 'One Word Substitution', 'Idioms & Phrases'],
  'Vocabulary': ['Vocabulary', 'Vocabulary - Synonyms', 'Vocabulary - Antonyms', 'One Word Substitution', 'Idioms & Phrases'],
  
  'ri-eng-spotting': ['Error Spotting', 'Sentence Correction'],
  'ai-eng-spotting': ['Error Spotting', 'Sentence Correction'],
  'Error Spotting': ['Error Spotting', 'Sentence Correction'],
  
  'ri-eng-comprehension': ['Reading Comprehension'],
  'ai-eng-comprehension': ['Reading Comprehension'],
  'Reading Comprehension': ['Reading Comprehension'],
  
  'ri-eng-rearrangement': ['Sentence Rearrangement'],
  'ai-eng-rearrangement': ['Sentence Rearrangement'],
  'Sentence Rearrangement': ['Sentence Rearrangement'],
  
  'ri-eng-fillers': ['Fill in the Blanks'],
  'ai-eng-fillers': ['Fill in the Blanks'],
  'Fill in the Blanks': ['Fill in the Blanks'],
  
  // Additional English topics
  'Active-Passive Voice': ['Active-Passive Voice'],
  'Direct-Indirect Speech': ['Direct-Indirect Speech'],
  'Sentence Correction': ['Sentence Correction'],
  'One Word Substitution': ['One Word Substitution'],
  'Vocabulary - Synonyms': ['Vocabulary - Synonyms'],
  'Vocabulary - Antonyms': ['Vocabulary - Antonyms'],
  'Grammar - Tenses': ['Grammar - Tenses'],
  'Grammar - Parts of Speech': ['Grammar - Parts of Speech'],
  'Subject-Verb Agreement': ['Subject-Verb Agreement'],
  'Idioms & Phrases': ['Idioms & Phrases'],
  
  // ========= ODIA LANGUAGE =========
  'ri-odia-grammar': ['Odia Grammar - Sandhi', 'Odia Grammar - Samas'],
  'ai-odia-grammar': ['Odia Grammar - Sandhi', 'Odia Grammar - Samas'],
  'Odia Grammar': ['Odia Grammar - Sandhi', 'Odia Grammar - Samas'],
  
  'ri-odia-vocabulary': ['Odia Vocabulary', 'Odia Idioms'],
  'ai-odia-vocabulary': ['Odia Vocabulary', 'Odia Idioms'],
  'Odia Vocabulary': ['Odia Vocabulary', 'Odia Idioms'],
  
  'ri-odia-comprehension': [],  // No questions yet
  'ai-odia-comprehension': [],
  
  'ri-odia-literature': ['Odia Literature - Modern'],
  'ai-odia-literature': ['Odia Literature - Modern'],
  'Odia Literature': ['Odia Literature - Modern'],
  
  // Additional Odia topics
  'Odia Grammar - Sandhi': ['Odia Grammar - Sandhi'],
  'Odia Grammar - Samas': ['Odia Grammar - Samas'],
  'Odia Idioms': ['Odia Idioms'],
  'Odia Literature - Modern': ['Odia Literature - Modern'],
  
  // ========= GENERAL KNOWLEDGE =========
  'ri-gk-history': ['Indian History', 'Ancient Indian History', 'Medieval Indian History', 'Modern Indian History'],
  'ai-gk-history': ['Indian History', 'Ancient Indian History', 'Medieval Indian History', 'Modern Indian History'],
  'Indian History': ['Indian History', 'Ancient Indian History', 'Medieval Indian History', 'Modern Indian History'],
  
  'ri-gk-geography': ['Geography', 'World Geography', 'Indian Geography - Physical', 'Indian Geography - Economic'],
  'ai-gk-geography': ['Geography', 'World Geography', 'Indian Geography - Physical', 'Indian Geography - Economic'],
  'Geography': ['Geography', 'World Geography', 'Indian Geography - Physical', 'Indian Geography - Economic'],
  
  'ri-gk-polity': ['Indian Polity', 'Indian Constitution', 'Indian Polity - Parliament', 'Indian Polity - Judiciary', 'Indian Polity - Executive'],
  'ai-gk-polity': ['Indian Polity', 'Indian Constitution', 'Indian Polity - Parliament', 'Indian Polity - Judiciary', 'Indian Polity - Executive'],
  'Indian Polity': ['Indian Polity', 'Indian Constitution', 'Indian Polity - Parliament', 'Indian Polity - Judiciary', 'Indian Polity - Executive'],
  
  'ri-gk-economy': ['Indian Economy', 'Indian Economy - Basics', 'Indian Economy - Banking'],
  'ai-gk-economy': ['Indian Economy', 'Indian Economy - Basics', 'Indian Economy - Banking'],
  'Indian Economy': ['Indian Economy', 'Indian Economy - Basics', 'Indian Economy - Banking'],
  
  'ri-gk-science': ['General Science', 'Physics', 'Chemistry', 'Biology'],
  'ai-gk-science': ['General Science', 'Physics', 'Chemistry', 'Biology'],
  'General Science': ['General Science', 'Physics', 'Chemistry', 'Biology'],
  
  'ri-gk-current': ['Current Affairs'],
  'ai-gk-current': ['Current Affairs'],
  'Current Affairs': ['Current Affairs'],
  
  // Additional GK topics
  'Computer Science': ['Computer Science'],
  'Ancient Indian History': ['Ancient Indian History'],
  'Medieval Indian History': ['Medieval Indian History'],
  'Modern Indian History': ['Modern Indian History'],
  'World Geography': ['World Geography'],
  'Indian Geography - Physical': ['Indian Geography - Physical'],
  'Indian Geography - Economic': ['Indian Geography - Economic'],
  'Indian Constitution': ['Indian Constitution'],
  'Indian Polity - Parliament': ['Indian Polity - Parliament'],
  'Indian Polity - Judiciary': ['Indian Polity - Judiciary'],
  'Indian Polity - Executive': ['Indian Polity - Executive'],
  'Indian Economy - Basics': ['Indian Economy - Basics'],
  'Indian Economy - Banking': ['Indian Economy - Banking'],
  'Physics': ['Physics'],
  'Chemistry': ['Chemistry'],
  'Biology': ['Biology'],
  
  // ========= ODISHA GK =========
  'ri-odisha-history': ['Odisha History', 'Ancient Odisha History', 'Medieval Odisha History', 'Modern Odisha History'],
  'ai-odisha-history': ['Odisha History', 'Ancient Odisha History', 'Medieval Odisha History', 'Modern Odisha History'],
  'Odisha History': ['Odisha History', 'Ancient Odisha History', 'Medieval Odisha History', 'Modern Odisha History'],
  
  'ri-odisha-geography': ['Odisha Geography'],
  'ai-odisha-geography': ['Odisha Geography'],
  'Odisha Geography': ['Odisha Geography'],
  
  'ri-odisha-culture': ['Odisha Culture & Heritage', 'Odisha Culture - Dance & Art', 'Odisha Culture - Temples', 'Odisha Culture - Festivals'],
  'ai-odisha-culture': ['Odisha Culture & Heritage', 'Odisha Culture - Dance & Art', 'Odisha Culture - Temples', 'Odisha Culture - Festivals'],
  'Odisha Culture & Heritage': ['Odisha Culture & Heritage', 'Odisha Culture - Dance & Art', 'Odisha Culture - Temples', 'Odisha Culture - Festivals'],
  
  'ri-odisha-economy': ['Odisha Economy'],
  'ai-odisha-economy': ['Odisha Economy'],
  'Odisha Economy': ['Odisha Economy'],
  
  'ri-odisha-polity': ['Odisha Polity', 'Odisha Polity & Administration'],
  'ai-odisha-polity': ['Odisha Polity', 'Odisha Polity & Administration'],
  'Odisha Polity & Administration': ['Odisha Polity', 'Odisha Polity & Administration'],
  
  'ri-odisha-current': [],  // Limited questions - could pull from Current Affairs
  'ai-odisha-current': [],
  
  // Additional Odisha topics
  'Odisha Personalities': ['Odisha Personalities'],
  'Ancient Odisha History': ['Ancient Odisha History'],
  'Medieval Odisha History': ['Medieval Odisha History'],
  'Modern Odisha History': ['Modern Odisha History'],
  'Odisha Culture - Dance & Art': ['Odisha Culture - Dance & Art'],
  'Odisha Culture - Temples': ['Odisha Culture - Temples'],
  'Odisha Culture - Festivals': ['Odisha Culture - Festivals'],
  'Odisha Polity': ['Odisha Polity']
};

// Subject ID to Subject Name mapping
export const SUBJECT_ID_TO_NAME = {
  'ri-reasoning': 'Reasoning & Mental Ability',
  'ai-reasoning': 'Reasoning & Mental Ability',
  'ri-quantitative': 'Quantitative Aptitude',
  'ai-quantitative': 'Quantitative Aptitude',
  'ri-english': 'English Language',
  'ai-english': 'English Language',
  'ri-odia': 'Odia Language',
  'ai-odia': 'Odia Language',
  'ri-gk': 'General Knowledge',
  'ai-gk': 'General Knowledge',
  'ri-odisha': 'Odisha GK',
  'ai-odisha': 'Odisha GK'
};

// Get question topics for a syllabus topic
export const getQuestionTopicsForSyllabusTopic = (syllabusTopicId) => {
  // Try direct match first
  if (SYLLABUS_TO_QUESTION_TOPIC[syllabusTopicId]) {
    return SYLLABUS_TO_QUESTION_TOPIC[syllabusTopicId];
  }
  
  // Try without exam prefix (ri-, ai-)
  const withoutPrefix = syllabusTopicId.replace(/^(ri|ai)-/, '');
  if (SYLLABUS_TO_QUESTION_TOPIC[withoutPrefix]) {
    return SYLLABUS_TO_QUESTION_TOPIC[withoutPrefix];
  }
  
  // Return original as fallback
  return [syllabusTopicId];
};

// Get subject name from subject ID
export const getSubjectNameFromId = (subjectId) => {
  return SUBJECT_ID_TO_NAME[subjectId] || subjectId;
};

export default {
  SYLLABUS_TO_QUESTION_TOPIC,
  SUBJECT_ID_TO_NAME,
  getQuestionTopicsForSyllabusTopic,
  getSubjectNameFromId
};
