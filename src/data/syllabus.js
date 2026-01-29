// OSSC RI & AI Exam Complete Syllabus
// This is the SINGLE SOURCE OF TRUTH for question generation

export const EXAM_TYPES = {
  RI: 'RI',
  AI: 'AI'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const LANGUAGES = {
  ENGLISH: 'en',
  ODIA: 'or'
};

// Complete OSSC RI Syllabus
export const RI_SYLLABUS = {
  examName: 'Revenue Inspector (RI)',
  examCode: 'RI',
  totalMarks: 100,
  totalQuestions: 100,
  duration: 90, // minutes
  negativeMarking: 0.25,
  
  subjects: [
    {
      id: 'ri-reasoning',
      name: 'Reasoning & Mental Ability',
      nameOdia: 'ଯୁକ୍ତିବାଦ ଏବଂ ମାନସିକ ଦକ୍ଷତା',
      weightage: 25,
      questionCount: 25,
      topics: [
        {
          id: 'ri-reasoning-analogy',
          name: 'Analogy',
          nameOdia: 'ସାଦୃଶ୍ୟ',
          subtopics: ['Word Analogy', 'Number Analogy', 'Letter Analogy', 'Mixed Analogy'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-reasoning-series',
          name: 'Series Completion',
          nameOdia: 'ଧାରା ସମାପ୍ତି',
          subtopics: ['Number Series', 'Letter Series', 'Alpha-Numeric Series', 'Mixed Series'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-reasoning-coding',
          name: 'Coding-Decoding',
          nameOdia: 'କୋଡିଂ-ଡିକୋଡିଂ',
          subtopics: ['Letter Coding', 'Number Coding', 'Mixed Coding', 'Substitution'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-reasoning-blood',
          name: 'Blood Relations',
          nameOdia: 'ରକ୍ତ ସମ୍ପର୍କ',
          subtopics: ['Direct Relations', 'Coded Relations', 'Mixed Relations'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-reasoning-direction',
          name: 'Direction & Distance',
          nameOdia: 'ଦିଗ ଏବଂ ଦୂରତା',
          subtopics: ['Simple Directions', 'Complex Directions', 'Shadow Problems'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-reasoning-ranking',
          name: 'Ranking & Order',
          nameOdia: 'ର୍ୟାଙ୍କିଂ ଏବଂ କ୍ରମ',
          subtopics: ['Linear Arrangement', 'Circular Arrangement', 'Complex Arrangement'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-reasoning-syllogism',
          name: 'Syllogism',
          nameOdia: 'ନ୍ୟାୟବାକ୍ୟ',
          subtopics: ['Basic Syllogism', 'Either-Or Cases', 'Possibility Cases'],
          difficulty: { easy: 25, medium: 50, hard: 25 }
        },
        {
          id: 'ri-reasoning-venn',
          name: 'Venn Diagrams',
          nameOdia: 'ଭେନ୍ ଚିତ୍ର',
          subtopics: ['Two Elements', 'Three Elements', 'Complex Diagrams'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-reasoning-puzzle',
          name: 'Puzzles',
          nameOdia: 'ପଜଲ୍',
          subtopics: ['Seating Arrangement', 'Scheduling', 'Floor Puzzles', 'Comparison'],
          difficulty: { easy: 20, medium: 50, hard: 30 }
        },
        {
          id: 'ri-reasoning-statement',
          name: 'Statement & Conclusions',
          nameOdia: 'ବିବୃତ୍ତି ଏବଂ ନିଷ୍କର୍ଷ',
          subtopics: ['Statement-Conclusion', 'Statement-Assumption', 'Statement-Argument'],
          difficulty: { easy: 25, medium: 50, hard: 25 }
        },
        {
          id: 'ri-reasoning-figure',
          name: 'Non-Verbal Reasoning',
          nameOdia: 'ଅଣ-ମୌଖିକ ଯୁକ୍ତି',
          subtopics: ['Figure Series', 'Mirror Image', 'Water Image', 'Paper Folding', 'Counting Figures'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        }
      ]
    },
    {
      id: 'ri-quantitative',
      name: 'Quantitative Aptitude',
      nameOdia: 'ପରିମାଣାତ୍ମକ ଯୋଗ୍ୟତା',
      weightage: 25,
      questionCount: 25,
      topics: [
        {
          id: 'ri-quant-number',
          name: 'Number System',
          nameOdia: 'ସଂଖ୍ୟା ପ୍ରଣାଳୀ',
          subtopics: ['Types of Numbers', 'Divisibility', 'HCF & LCM', 'Remainders', 'Unit Digit'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-quant-simplification',
          name: 'Simplification',
          nameOdia: 'ସରଳୀକରଣ',
          subtopics: ['BODMAS', 'Fractions', 'Decimals', 'Surds', 'Approximation'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-quant-percentage',
          name: 'Percentage',
          nameOdia: 'ଶତକଡ଼ା',
          subtopics: ['Basic Percentage', 'Successive Percentage', 'Population Problems'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-quant-ratio',
          name: 'Ratio & Proportion',
          nameOdia: 'ଅନୁପାତ ଏବଂ ସମାନୁପାତ',
          subtopics: ['Simple Ratio', 'Compound Ratio', 'Proportion', 'Partnership'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-quant-average',
          name: 'Average',
          nameOdia: 'ହାରାହାରି',
          subtopics: ['Simple Average', 'Weighted Average', 'Age Problems'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-quant-profit',
          name: 'Profit & Loss',
          nameOdia: 'ଲାଭ ଏବଂ କ୍ଷତି',
          subtopics: ['Basic P&L', 'Discount', 'Marked Price', 'Successive Discounts'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-quant-si',
          name: 'Simple Interest',
          nameOdia: 'ସରଳ ସୁଧ',
          subtopics: ['Basic SI', 'Installments', 'Time & Rate Problems'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-quant-ci',
          name: 'Compound Interest',
          nameOdia: 'ଚକ୍ରବୃଦ୍ଧି ସୁଧ',
          subtopics: ['Basic CI', 'Half-yearly', 'SI vs CI Difference'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-quant-time-work',
          name: 'Time & Work',
          nameOdia: 'ସମୟ ଏବଂ କାର୍ଯ୍ୟ',
          subtopics: ['Basic Work', 'Pipes & Cisterns', 'Efficiency', 'Wages'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-quant-time-distance',
          name: 'Time, Speed & Distance',
          nameOdia: 'ସମୟ, ଗତି ଏବଂ ଦୂରତା',
          subtopics: ['Basic TSD', 'Trains', 'Boats & Streams', 'Relative Speed'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-quant-mensuration',
          name: 'Mensuration',
          nameOdia: 'କ୍ଷେତ୍ରମିତି',
          subtopics: ['2D Figures', '3D Figures', 'Area', 'Volume', 'Surface Area'],
          difficulty: { easy: 30, medium: 45, hard: 25 }
        },
        {
          id: 'ri-quant-geometry',
          name: 'Geometry',
          nameOdia: 'ଜ୍ୟାମିତି',
          subtopics: ['Lines & Angles', 'Triangles', 'Circles', 'Quadrilaterals'],
          difficulty: { easy: 30, medium: 45, hard: 25 }
        },
        {
          id: 'ri-quant-data',
          name: 'Data Interpretation',
          nameOdia: 'ତଥ୍ୟ ବ୍ୟାଖ୍ୟା',
          subtopics: ['Tables', 'Bar Graphs', 'Pie Charts', 'Line Graphs', 'Mixed DI'],
          difficulty: { easy: 25, medium: 50, hard: 25 }
        }
      ]
    },
    {
      id: 'ri-english',
      name: 'English Language',
      nameOdia: 'ଇଂରାଜୀ ଭାଷା',
      weightage: 15,
      questionCount: 15,
      topics: [
        {
          id: 'ri-eng-grammar',
          name: 'Grammar',
          nameOdia: 'ବ୍ୟାକରଣ',
          subtopics: ['Tenses', 'Subject-Verb Agreement', 'Articles', 'Prepositions', 'Conjunctions'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-eng-vocabulary',
          name: 'Vocabulary',
          nameOdia: 'ଶବ୍ଦ ଭଣ୍ଡାର',
          subtopics: ['Synonyms', 'Antonyms', 'One Word Substitution', 'Idioms & Phrases'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-eng-spotting',
          name: 'Error Spotting',
          nameOdia: 'ତ୍ରୁଟି ଚିହ୍ନଟ',
          subtopics: ['Grammatical Errors', 'Spelling Errors', 'Sentence Correction'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-eng-comprehension',
          name: 'Reading Comprehension',
          nameOdia: 'ପଠନ ବୋଧ',
          subtopics: ['Passage-based Questions', 'Inference', 'Theme & Tone'],
          difficulty: { easy: 25, medium: 50, hard: 25 }
        },
        {
          id: 'ri-eng-rearrangement',
          name: 'Sentence Rearrangement',
          nameOdia: 'ବାକ୍ୟ ପୁନଃବିନ୍ୟାସ',
          subtopics: ['Para Jumbles', 'Sentence Sequencing'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-eng-fillers',
          name: 'Fill in the Blanks',
          nameOdia: 'ଖାଲି ସ୍ଥାନ ପୂରଣ',
          subtopics: ['Single Blanks', 'Double Blanks', 'Cloze Test'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        }
      ]
    },
    {
      id: 'ri-odia',
      name: 'Odia Language',
      nameOdia: 'ଓଡ଼ିଆ ଭାଷା',
      weightage: 10,
      questionCount: 10,
      topics: [
        {
          id: 'ri-odia-grammar',
          name: 'Odia Grammar',
          nameOdia: 'ଓଡ଼ିଆ ବ୍ୟାକରଣ',
          subtopics: ['ସନ୍ଧି', 'ସମାସ', 'କାରକ ଏବଂ ବିଭକ୍ତି', 'ବାଚ୍ୟ ପରିବର୍ତ୍ତନ'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-odia-vocabulary',
          name: 'Odia Vocabulary',
          nameOdia: 'ଶବ୍ଦ ଭଣ୍ଡାର',
          subtopics: ['ସମାର୍ଥକ ଶବ୍ଦ', 'ବିପରୀତ ଶବ୍ଦ', 'ଏକ ପଦରେ ପ୍ରକାଶ', 'ବାଗଧାରା'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-odia-comprehension',
          name: 'Odia Comprehension',
          nameOdia: 'ଓଡ଼ିଆ ଗଦ୍ୟାଂଶ',
          subtopics: ['ଗଦ୍ୟାଂଶ ଆଧାରିତ ପ୍ରଶ୍ନ', 'ସାରାଂଶ ଲେଖନ'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-odia-literature',
          name: 'Odia Literature',
          nameOdia: 'ଓଡ଼ିଆ ସାହିତ୍ୟ',
          subtopics: ['ପ୍ରସିଦ୍ଧ ଲେଖକ', 'ଗ୍ରନ୍ଥ ଏବଂ ରଚନାକାର', 'ସାହିତ୍ୟିକ ଯୁଗ'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        }
      ]
    },
    {
      id: 'ri-gk',
      name: 'General Knowledge',
      nameOdia: 'ସାଧାରଣ ଜ୍ଞାନ',
      weightage: 15,
      questionCount: 15,
      topics: [
        {
          id: 'ri-gk-history',
          name: 'Indian History',
          nameOdia: 'ଭାରତୀୟ ଇତିହାସ',
          subtopics: ['Ancient India', 'Medieval India', 'Modern India', 'Freedom Struggle'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-gk-geography',
          name: 'Geography',
          nameOdia: 'ଭୂଗୋଳ',
          subtopics: ['Indian Geography', 'World Geography', 'Physical Geography', 'Climate'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-gk-polity',
          name: 'Indian Polity',
          nameOdia: 'ଭାରତୀୟ ରାଜନୀତି',
          subtopics: ['Constitution', 'Parliament', 'Judiciary', 'Fundamental Rights', 'Local Government'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-gk-economy',
          name: 'Indian Economy',
          nameOdia: 'ଭାରତୀୟ ଅର୍ଥନୀତି',
          subtopics: ['Economic Planning', 'Agriculture', 'Industry', 'Banking', 'Budget'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-gk-science',
          name: 'General Science',
          nameOdia: 'ସାଧାରଣ ବିଜ୍ଞାନ',
          subtopics: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-gk-current',
          name: 'Current Affairs',
          nameOdia: 'ସାମ୍ପ୍ରତିକ ଘଟଣାବଳୀ',
          subtopics: ['National Events', 'International Events', 'Sports', 'Awards', 'Appointments'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        }
      ]
    },
    {
      id: 'ri-odisha',
      name: 'Odisha GK',
      nameOdia: 'ଓଡ଼ିଶା ସାଧାରଣ ଜ୍ଞାନ',
      weightage: 10,
      questionCount: 10,
      topics: [
        {
          id: 'ri-odisha-history',
          name: 'Odisha History',
          nameOdia: 'ଓଡ଼ିଶା ଇତିହାସ',
          subtopics: ['Ancient Odisha', 'Medieval Odisha', 'Modern Odisha', 'Freedom Movement in Odisha'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-odisha-geography',
          name: 'Odisha Geography',
          nameOdia: 'ଓଡ଼ିଶା ଭୂଗୋଳ',
          subtopics: ['Rivers', 'Mountains', 'Districts', 'Climate', 'Natural Resources'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-odisha-culture',
          name: 'Odisha Culture & Heritage',
          nameOdia: 'ଓଡ଼ିଶା ସଂସ୍କୃତି ଏବଂ ବିରାସତ',
          subtopics: ['Temples', 'Festivals', 'Dance Forms', 'Art & Craft', 'UNESCO Sites'],
          difficulty: { easy: 40, medium: 40, hard: 20 }
        },
        {
          id: 'ri-odisha-economy',
          name: 'Odisha Economy',
          nameOdia: 'ଓଡ଼ିଶା ଅର୍ଥନୀତି',
          subtopics: ['Agriculture', 'Industries', 'Minerals', 'Government Schemes'],
          difficulty: { easy: 35, medium: 45, hard: 20 }
        },
        {
          id: 'ri-odisha-polity',
          name: 'Odisha Polity & Administration',
          nameOdia: 'ଓଡ଼ିଶା ରାଜନୀତି ଏବଂ ପ୍ରଶାସନ',
          subtopics: ['State Legislature', 'Panchayati Raj', 'Administrative Divisions', 'Important Acts'],
          difficulty: { easy: 30, medium: 50, hard: 20 }
        },
        {
          id: 'ri-odisha-current',
          name: 'Odisha Current Affairs',
          nameOdia: 'ଓଡ଼ିଶା ସାମ୍ପ୍ରତିକ ଘଟଣାବଳୀ',
          subtopics: ['State News', 'Government Initiatives', 'Sports', 'Awards'],
          difficulty: { easy: 45, medium: 40, hard: 15 }
        }
      ]
    }
  ]
};

// Complete OSSC AI (Assistant Inspector) Syllabus
export const AI_SYLLABUS = {
  examName: 'Assistant Inspector (AI)',
  examCode: 'AI',
  totalMarks: 100,
  totalQuestions: 100,
  duration: 90, // minutes
  negativeMarking: 0.25,
  
  subjects: [
    // AI shares most subjects with RI but has additional topics
    ...RI_SYLLABUS.subjects.map(subject => ({
      ...subject,
      id: subject.id.replace('ri-', 'ai-'),
      topics: subject.topics.map(topic => ({
        ...topic,
        id: topic.id.replace('ri-', 'ai-')
      }))
    }))
  ]
};

// Helper function to get syllabus by exam type
export const getSyllabus = (examType) => {
  return examType === EXAM_TYPES.RI ? RI_SYLLABUS : AI_SYLLABUS;
};

// Helper function to get all topics flat list
export const getAllTopics = (examType) => {
  const syllabus = getSyllabus(examType);
  const topics = [];
  
  syllabus.subjects.forEach(subject => {
    subject.topics.forEach(topic => {
      topics.push({
        ...topic,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectNameOdia: subject.nameOdia
      });
    });
  });
  
  return topics;
};

// Helper function to get topic by ID
export const getTopicById = (examType, topicId) => {
  const topics = getAllTopics(examType);
  return topics.find(t => t.id === topicId);
};

// Helper function to get subject by ID
export const getSubjectById = (examType, subjectId) => {
  const syllabus = getSyllabus(examType);
  return syllabus.subjects.find(s => s.id === subjectId);
};

// Calculate total topics count
export const getTotalTopicsCount = (examType) => {
  return getAllTopics(examType).length;
};

export default {
  EXAM_TYPES,
  DIFFICULTY_LEVELS,
  LANGUAGES,
  RI_SYLLABUS,
  AI_SYLLABUS,
  getSyllabus,
  getAllTopics,
  getTopicById,
  getSubjectById,
  getTotalTopicsCount
};
