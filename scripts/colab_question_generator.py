# ============================================================
# 🚀 OSSC RI/AI Exam Question Generator - Google Colab Version
# ============================================================
# Generates 10,000 unique questions for all syllabus topics
# Uses Hugging Face model with batch processing
# Auto-saves every 50 questions
# ============================================================

# ==================== CELL 1: Install Dependencies ====================
# Run this cell first to install required packages

!pip install transformers accelerate bitsandbytes -q
!pip install sentencepiece -q

# ==================== CELL 2: Import Libraries ====================

import json
import time
import random
import re
import hashlib
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from google.colab import files
import warnings
warnings.filterwarnings('ignore')

print("✅ Libraries imported successfully!")

# ==================== CELL 3: Configuration ====================

# Target questions
TARGET_QUESTIONS = 10000
BATCH_SIZE = 5  # Questions per generation
SAVE_INTERVAL = 50  # Save every N questions
OUTPUT_FILE = "ossc_questions_10k.json"

# Model settings
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"  # or your loaded model
MAX_NEW_TOKENS = 2048
TEMPERATURE = 0.8

print(f"📊 Target: {TARGET_QUESTIONS} questions")
print(f"📦 Batch size: {BATCH_SIZE}")
print(f"💾 Auto-save every: {SAVE_INTERVAL} questions")

# ==================== CELL 4: Complete OSSC Syllabus ====================

COMPLETE_SYLLABUS = [
    # ============ REASONING & MENTAL ABILITY (25%) ============
    {"subject": "Reasoning & Mental Ability", "topic": "Analogy", "subtopics": ["Word Analogy", "Number Analogy", "Letter Analogy", "Mixed Analogy"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Series Completion", "subtopics": ["Number Series", "Letter Series", "Alpha-Numeric Series", "Mixed Series", "Missing Number"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Coding-Decoding", "subtopics": ["Letter Coding", "Number Coding", "Mixed Coding", "Substitution Coding", "Symbol Coding"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Blood Relations", "subtopics": ["Direct Relations", "Coded Relations", "Mixed Relations", "Family Tree"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Direction & Distance", "subtopics": ["Simple Directions", "Complex Directions", "Shadow Problems", "Shortest Distance"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Ranking & Order", "subtopics": ["Linear Arrangement", "Circular Arrangement", "Complex Arrangement", "Position Based"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Syllogism", "subtopics": ["Basic Syllogism", "Either-Or Cases", "Possibility Cases", "Negative Statements"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Venn Diagrams", "subtopics": ["Two Elements", "Three Elements", "Complex Diagrams", "Logical Venn"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Puzzles", "subtopics": ["Seating Arrangement", "Scheduling", "Floor Puzzles", "Comparison Based", "Box Puzzles"], "weight": 50, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Statement & Conclusions", "subtopics": ["Statement-Conclusion", "Statement-Assumption", "Statement-Argument", "Course of Action"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Non-Verbal Reasoning", "subtopics": ["Figure Series", "Mirror Image", "Water Image", "Paper Folding", "Counting Figures", "Embedded Figures"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Odd One Out", "subtopics": ["Word Based", "Number Based", "Letter Based", "Figure Based"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Classification", "subtopics": ["Word Classification", "Number Classification", "Letter Classification"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Alphabet & Number Test", "subtopics": ["Position Finding", "Gap Calculation", "Letter Sequence"], "weight": 25, "difficulties": ["easy", "medium"]},
    
    # ============ QUANTITATIVE APTITUDE (25%) ============
    {"subject": "Quantitative Aptitude", "topic": "Number System", "subtopics": ["Types of Numbers", "Divisibility Rules", "HCF & LCM", "Remainders", "Unit Digit", "Factors"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Simplification", "subtopics": ["BODMAS", "Fractions", "Decimals", "Surds", "Approximation", "Square Roots"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Percentage", "subtopics": ["Basic Percentage", "Successive Percentage", "Population Problems", "Price Changes", "Election Problems"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Ratio & Proportion", "subtopics": ["Simple Ratio", "Compound Ratio", "Proportion", "Partnership", "Mixture Problems"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Average", "subtopics": ["Simple Average", "Weighted Average", "Age Problems", "Average Speed", "Runs & Innings"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Profit & Loss", "subtopics": ["Basic P&L", "Discount", "Marked Price", "Successive Discounts", "Dishonest Dealer"], "weight": 50, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Simple Interest", "subtopics": ["Basic SI Formula", "Installments", "Time & Rate Problems", "Mixed SI Problems"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Compound Interest", "subtopics": ["Basic CI Formula", "Half-yearly CI", "SI vs CI Difference", "Depreciation"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Time & Work", "subtopics": ["Basic Work Problems", "Pipes & Cisterns", "Efficiency", "Wages Distribution", "Work Alternately"], "weight": 45, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Time Speed Distance", "subtopics": ["Basic TSD", "Trains", "Boats & Streams", "Relative Speed", "Circular Track"], "weight": 50, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Mensuration 2D", "subtopics": ["Rectangle", "Square", "Circle", "Triangle", "Parallelogram", "Trapezium"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Mensuration 3D", "subtopics": ["Cube", "Cuboid", "Cylinder", "Cone", "Sphere", "Hemisphere"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Geometry", "subtopics": ["Lines & Angles", "Triangles Properties", "Circles Theorems", "Quadrilaterals"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Data Interpretation", "subtopics": ["Tables", "Bar Graphs", "Pie Charts", "Line Graphs", "Mixed DI"], "weight": 45, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Algebra", "subtopics": ["Linear Equations", "Quadratic Equations", "Inequalities", "Algebraic Expressions"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Probability", "subtopics": ["Basic Probability", "Dice Problems", "Card Problems", "Coin Toss"], "weight": 30, "difficulties": ["medium", "hard"]},
    
    # ============ ENGLISH LANGUAGE (15%) ============
    {"subject": "English Language", "topic": "Grammar - Tenses", "subtopics": ["Present Tenses", "Past Tenses", "Future Tenses", "Mixed Tenses"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Grammar - Parts of Speech", "subtopics": ["Articles", "Prepositions", "Conjunctions", "Pronouns", "Adjectives"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Subject-Verb Agreement", "subtopics": ["Singular-Plural", "Collective Nouns", "Compound Subjects"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Vocabulary - Synonyms", "subtopics": ["Common Words", "Advanced Words", "Contextual Synonyms"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Vocabulary - Antonyms", "subtopics": ["Common Words", "Advanced Words", "Contextual Antonyms"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "One Word Substitution", "subtopics": ["People", "Places", "Actions", "Conditions"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Idioms & Phrases", "subtopics": ["Common Idioms", "Proverbs", "Phrasal Verbs"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Error Spotting", "subtopics": ["Grammatical Errors", "Spelling Errors", "Punctuation Errors"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Sentence Correction", "subtopics": ["Grammar Based", "Word Usage", "Sentence Structure"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Fill in the Blanks", "subtopics": ["Single Blanks", "Double Blanks", "Grammar Blanks", "Vocabulary Blanks"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Sentence Rearrangement", "subtopics": ["Para Jumbles", "Sentence Sequencing", "First-Last Fixed"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Reading Comprehension", "subtopics": ["Fact Based", "Inference Based", "Vocabulary Based", "Theme & Tone"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Cloze Test", "subtopics": ["Grammar Based Cloze", "Vocabulary Based Cloze"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Active-Passive Voice", "subtopics": ["Simple Sentences", "Complex Sentences", "Interrogative"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Direct-Indirect Speech", "subtopics": ["Statements", "Questions", "Commands", "Exclamations"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    
    # ============ GENERAL KNOWLEDGE (15%) ============
    {"subject": "General Knowledge", "topic": "Ancient Indian History", "subtopics": ["Indus Valley Civilization", "Vedic Period", "Maurya Empire", "Gupta Empire", "Buddhism & Jainism"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Medieval Indian History", "subtopics": ["Delhi Sultanate", "Mughal Empire", "Vijayanagara Empire", "Maratha Empire", "Bhakti Movement"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Modern Indian History", "subtopics": ["British Rule", "Freedom Struggle", "Indian National Congress", "Revolutionary Movements", "Constitutional Development"], "weight": 50, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Geography - Physical", "subtopics": ["Mountains", "Rivers", "Plains", "Plateaus", "Islands", "Climate"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Geography - Economic", "subtopics": ["Agriculture", "Industries", "Minerals", "Transportation", "Population"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "World Geography", "subtopics": ["Continents", "Oceans", "Important Countries", "World Climate"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Constitution", "subtopics": ["Preamble", "Fundamental Rights", "DPSP", "Fundamental Duties", "Constitutional Amendments"], "weight": 50, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Polity - Parliament", "subtopics": ["Lok Sabha", "Rajya Sabha", "Parliamentary Procedures", "Bills & Laws"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Polity - Executive", "subtopics": ["President", "Prime Minister", "Council of Ministers", "Governor"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Polity - Judiciary", "subtopics": ["Supreme Court", "High Courts", "Subordinate Courts", "Judicial Review"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Economy - Basics", "subtopics": ["National Income", "GDP & GNP", "Economic Planning", "Five Year Plans"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Economy - Banking", "subtopics": ["RBI", "Commercial Banks", "Monetary Policy", "Financial Institutions"], "weight": 45, "difficulties": ["medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Economy - Sectors", "subtopics": ["Agriculture Sector", "Industrial Sector", "Service Sector", "Foreign Trade"], "weight": 40, "difficulties": ["medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Physics", "subtopics": ["Motion & Force", "Energy", "Light", "Sound", "Electricity", "Magnetism"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Chemistry", "subtopics": ["Elements & Compounds", "Acids & Bases", "Metals & Non-metals", "Chemical Reactions", "Organic Chemistry"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Biology", "subtopics": ["Cell Biology", "Human Body Systems", "Diseases", "Nutrition", "Genetics", "Ecology"], "weight": 45, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Computer Science", "subtopics": ["Computer Basics", "Hardware", "Software", "Internet", "MS Office"], "weight": 35, "difficulties": ["easy", "medium"]},
    {"subject": "General Knowledge", "topic": "Current Affairs - National", "subtopics": ["Government Schemes", "Awards & Honours", "Sports", "Appointments", "Events"], "weight": 40, "difficulties": ["easy", "medium"]},
    {"subject": "General Knowledge", "topic": "Current Affairs - International", "subtopics": ["International Organizations", "Summits", "Global Events", "International Awards"], "weight": 35, "difficulties": ["easy", "medium"]},
    
    # ============ ODISHA GK (10%) ============
    {"subject": "Odisha GK", "topic": "Ancient Odisha History", "subtopics": ["Kalinga War", "Kharavela", "Bhauma-Kara Dynasty", "Eastern Ganga Dynasty"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Medieval Odisha History", "subtopics": ["Gajapati Dynasty", "Suryavamsi Dynasty", "Afghan & Mughal Rule"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Modern Odisha History", "subtopics": ["British Rule in Odisha", "Paika Rebellion", "Freedom Movement in Odisha", "Formation of Odisha State"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Geography - Physical", "subtopics": ["Rivers of Odisha", "Mountains & Hills", "Climate", "Forests", "Coastal Areas"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Geography - Districts", "subtopics": ["District Information", "District Headquarters", "Boundaries", "Important Places"], "weight": 35, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Temples", "subtopics": ["Jagannath Temple", "Konark Sun Temple", "Lingaraj Temple", "Other Temples"], "weight": 40, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Festivals", "subtopics": ["Rath Yatra", "Raja Parba", "Durga Puja", "Kartik Purnima", "Other Festivals"], "weight": 35, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Dance & Art", "subtopics": ["Odissi Dance", "Gotipua", "Pattachitra", "Applique Work", "Silver Filigree"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Economy - Agriculture", "subtopics": ["Major Crops", "Irrigation Projects", "Agricultural Schemes"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Economy - Industries", "subtopics": ["Major Industries", "Industrial Areas", "Mining", "Steel Plants"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Economy - Minerals", "subtopics": ["Iron Ore", "Coal", "Bauxite", "Manganese", "Chromite"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Polity", "subtopics": ["State Legislature", "Governor & CM", "High Court", "Panchayati Raj"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Administration", "subtopics": ["Administrative Divisions", "District Administration", "Important Acts & Laws"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Literature & Personalities", "subtopics": ["Famous Writers", "Poets", "Freedom Fighters", "Social Reformers"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Current Affairs", "subtopics": ["State Schemes", "Recent Events", "Awards", "Sports Achievements"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "UNESCO Sites in Odisha", "subtopics": ["Konark Sun Temple", "Other Heritage Sites", "Biosphere Reserves"], "weight": 25, "difficulties": ["easy", "medium"]},
    
    # ============ ODIA LANGUAGE (10%) ============
    {"subject": "Odia Language", "topic": "Odia Grammar - Sandhi", "subtopics": ["Swar Sandhi", "Vyanjan Sandhi", "Visarga Sandhi"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Grammar - Samas", "subtopics": ["Tatpurusha", "Dwandwa", "Bahubrihi", "Avyayibhav"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Grammar - Karak & Vibhakti", "subtopics": ["Seven Karaks", "Vibhakti Forms"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Grammar - Voice Change", "subtopics": ["Karmani to Kartari", "Kartari to Karmani"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Vocabulary - Synonyms", "subtopics": ["Common Words", "Literary Words"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odia Language", "topic": "Odia Vocabulary - Antonyms", "subtopics": ["Common Words", "Literary Words"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odia Language", "topic": "Odia One Word Substitution", "subtopics": ["Common Expressions", "Literary Expressions"], "weight": 25, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Idioms", "subtopics": ["Common Idioms", "Proverbs"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odia Language", "topic": "Odia Comprehension", "subtopics": ["Passage Based Questions", "Summary Writing"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Literature - Ancient", "subtopics": ["Sarala Das", "Jagannath Das", "Balaram Das"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Literature - Medieval", "subtopics": ["Upendra Bhanja", "Dinakrushna Das", "Kabi Samrat"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Literature - Modern", "subtopics": ["Fakir Mohan Senapati", "Radhanath Ray", "Madhusudan Das", "Gopabandhu Das"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Literature - Contemporary", "subtopics": ["Modern Writers", "Sahitya Akademi Winners", "Famous Works"], "weight": 25, "difficulties": ["medium", "hard"]},
]

print(f"📚 Total syllabus topics: {len(COMPLETE_SYLLABUS)}")
total_weight = sum(t["weight"] for t in COMPLETE_SYLLABUS)
print(f"📊 Total weight: {total_weight}")

# ==================== CELL 5: Load Model ====================

print("🔄 Loading model... (this may take a few minutes)")

# Quantization config for memory efficiency
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

# Load model
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

print("✅ Model loaded successfully!")
print(f"📦 Model: {MODEL_NAME}")

# ==================== CELL 6: Utility Functions ====================

def generate_id():
    """Generate unique question ID"""
    return f"q_{int(time.time()*1000)}_{random.randint(1000,9999)}"

def get_hash(text):
    """Generate hash for duplicate detection"""
    return hashlib.md5(text.lower().strip()[:100].encode()).hexdigest()

def format_time(seconds):
    """Format seconds to human readable"""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        return f"{int(seconds//60)}m {int(seconds%60)}s"
    else:
        return f"{int(seconds//3600)}h {int((seconds%3600)//60)}m"

def parse_questions(text):
    """Parse questions from model output"""
    questions = []
    
    # Try JSON array
    try:
        match = re.search(r'\[[\s\S]*\]', text)
        if match:
            arr = json.loads(match.group(0))
            if isinstance(arr, list):
                return arr
    except:
        pass
    
    # Try individual JSON objects
    pattern = r'\{[^{}]*"question"[^{}]*"options"[^{}]*\}'
    for match in re.finditer(pattern, text, re.DOTALL):
        try:
            obj = json.loads(match.group(0))
            if "question" in obj and "options" in obj:
                questions.append(obj)
        except:
            continue
    
    # Try line-by-line parsing
    if not questions:
        lines = text.split('\n')
        current_q = {}
        for line in lines:
            line = line.strip()
            if line.startswith('"question"'):
                try:
                    current_q['question'] = re.search(r'"question"\s*:\s*"([^"]+)"', line).group(1)
                except:
                    pass
            elif '"options"' in line or '"A"' in line:
                try:
                    opts_match = re.search(r'"options"\s*:\s*(\{[^}]+\})', text)
                    if opts_match:
                        current_q['options'] = json.loads(opts_match.group(1))
                except:
                    pass
            elif '"correctAnswer"' in line:
                try:
                    current_q['correctAnswer'] = re.search(r'"correctAnswer"\s*:\s*"([ABCD])"', line).group(1)
                except:
                    pass
            elif '"explanation"' in line:
                try:
                    current_q['explanation'] = re.search(r'"explanation"\s*:\s*"([^"]+)"', line).group(1)
                except:
                    pass
        
        if current_q.get('question') and current_q.get('options'):
            questions.append(current_q)
    
    return questions

def save_questions(questions, filename):
    """Save questions to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved {len(questions)} questions to {filename}")

print("✅ Utility functions loaded!")

# ==================== CELL 7: Question Generation Function ====================

def generate_batch(topic_data, batch_size=5):
    """Generate a batch of questions for a topic"""
    
    subject = topic_data["subject"]
    topic = topic_data["topic"]
    subtopics = topic_data["subtopics"]
    difficulty = random.choice(topic_data["difficulties"])
    subtopic = random.choice(subtopics)
    
    prompt = f"""<s>[INST] You are an expert question setter for OSSC (Odisha Staff Selection Commission) RI & AI competitive exams in India.

Generate exactly {batch_size} unique multiple-choice questions (MCQs) for:
- Subject: {subject}
- Topic: {topic}
- Subtopic: {subtopic}
- Difficulty: {difficulty}

IMPORTANT REQUIREMENTS:
1. Each question must be unique and exam-worthy
2. Each question must have exactly 4 options: A, B, C, D
3. Only ONE correct answer per question
4. Include clear explanation for each answer
5. For math/numerical questions, show step-by-step solution
6. Questions should match {difficulty} difficulty level

Return ONLY a valid JSON array with {batch_size} questions in this EXACT format:
[
  {{
    "question": "Complete question text here?",
    "options": {{"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}},
    "correctAnswer": "A",
    "explanation": "Detailed explanation with solution steps if applicable"
  }},
  {{
    "question": "Second question text?",
    "options": {{"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}},
    "correctAnswer": "B",
    "explanation": "Explanation for second question"
  }}
]

Generate {batch_size} questions now: [/INST]"""

    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                temperature=TEMPERATURE,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the response part (after [/INST])
        if "[/INST]" in response:
            response = response.split("[/INST]")[-1].strip()
        
        questions = parse_questions(response)
        
        valid_questions = []
        for q in questions:
            if not all(k in q for k in ["question", "options", "correctAnswer"]):
                continue
            if not isinstance(q["options"], dict) or len(q["options"]) != 4:
                continue
            if q["correctAnswer"] not in ["A", "B", "C", "D"]:
                continue
            
            valid_questions.append({
                "id": generate_id(),
                "subject": subject,
                "topic": topic,
                "subtopic": subtopic,
                "difficulty": difficulty,
                "question": q["question"],
                "options": q["options"],
                "correctAnswer": q["correctAnswer"],
                "explanation": q.get("explanation", ""),
                "generatedAt": datetime.now().isoformat()
            })
        
        return valid_questions
        
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")
        return []

# Test generation
print("🧪 Testing question generation...")
test_topic = random.choice(COMPLETE_SYLLABUS)
test_questions = generate_batch(test_topic, batch_size=2)
if test_questions:
    print(f"✅ Test successful! Generated {len(test_questions)} questions")
    print(f"   Sample: {test_questions[0]['question'][:60]}...")
else:
    print("⚠️ Test returned no questions. Check model output.")

# ==================== CELL 8: Main Generation Loop ====================

def run_generation(target=10000, batch_size=5, save_interval=50):
    """Main generation loop with progress tracking"""
    
    print("=" * 60)
    print("🚀 OSSC Question Generator - Starting Generation")
    print("=" * 60)
    print(f"📊 Target: {target} questions")
    print(f"📦 Batch size: {batch_size}")
    print(f"💾 Save interval: {save_interval}")
    print("=" * 60)
    
    all_questions = []
    question_hashes = set()
    stats = {
        "generated": 0,
        "duplicates": 0,
        "failed": 0,
        "by_subject": {}
    }
    
    # Load existing questions if file exists
    output_file = "ossc_questions_10k.json"
    if Path(output_file).exists():
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                all_questions = json.load(f)
                for q in all_questions:
                    question_hashes.add(get_hash(q["question"]))
            print(f"📂 Loaded {len(all_questions)} existing questions")
        except:
            pass
    
    remaining = target - len(all_questions)
    if remaining <= 0:
        print(f"✅ Already have {len(all_questions)} questions!")
        return all_questions
    
    print(f"📝 Generating: {remaining} more questions\n")
    
    start_time = time.time()
    batches_needed = (remaining // batch_size) + 10
    last_save = len(all_questions)
    times = []
    
    for i in range(batches_needed):
        if len(all_questions) >= target:
            break
        
        batch_start = time.time()
        
        # Select topic based on weight
        topic = random.choices(COMPLETE_SYLLABUS, weights=[t["weight"] for t in COMPLETE_SYLLABUS])[0]
        
        # Generate batch
        questions = generate_batch(topic, batch_size)
        
        batch_time = time.time() - batch_start
        times.append(batch_time)
        
        # Add valid questions
        added = 0
        for q in questions:
            h = get_hash(q["question"])
            if h in question_hashes:
                stats["duplicates"] += 1
                continue
            
            question_hashes.add(h)
            all_questions.append(q)
            added += 1
            
            # Track by subject
            subj = q["subject"]
            stats["by_subject"][subj] = stats["by_subject"].get(subj, 0) + 1
        
        stats["generated"] += added
        if not questions:
            stats["failed"] += 1
        
        # Progress display
        current = len(all_questions)
        percent = (current / target) * 100
        bar = '█' * int(30 * current // target) + '░' * (30 - int(30 * current // target))
        
        elapsed = time.time() - start_time
        if times:
            avg_time = sum(times[-20:]) / len(times[-20:])
            remaining_batches = (target - current) / batch_size
            eta = remaining_batches * avg_time
            eta_str = format_time(eta)
        else:
            eta_str = "calculating..."
        
        print(f"\r⏳ |{bar}| {current}/{target} ({percent:.1f}%) | ETA: {eta_str} | +{added} | ❌{stats['failed']}   ", end='', flush=True)
        
        # Auto-save
        if current - last_save >= save_interval:
            save_questions(all_questions, output_file)
            last_save = current
            
            # Also save backup
            backup_file = f"ossc_questions_backup_{current}.json"
            save_questions(all_questions, backup_file)
    
    # Final save
    save_questions(all_questions, output_file)
    
    # Summary
    elapsed = time.time() - start_time
    print("\n\n" + "=" * 60)
    print("✅ GENERATION COMPLETE!")
    print("=" * 60)
    print(f"📊 Total Questions: {len(all_questions)}")
    print(f"⏱️  Total Time: {format_time(elapsed)}")
    print(f"⚡ Speed: {len(all_questions)/max(elapsed,1)*60:.0f} questions/min")
    print(f"🔄 Duplicates skipped: {stats['duplicates']}")
    print(f"❌ Failed batches: {stats['failed']}")
    print()
    print("📚 Questions by Subject:")
    for subj, count in sorted(stats["by_subject"].items(), key=lambda x: -x[1]):
        print(f"   {subj}: {count}")
    print()
    print(f"📁 Output file: {output_file}")
    print("=" * 60)
    
    return all_questions

# ==================== CELL 9: RUN GENERATION ====================
# Execute this cell to start generating 10,000 questions

questions = run_generation(
    target=TARGET_QUESTIONS,
    batch_size=BATCH_SIZE,
    save_interval=SAVE_INTERVAL
)

# ==================== CELL 10: Download Results ====================
# Run this cell after generation completes to download the file

from google.colab import files

# Download main file
files.download("ossc_questions_10k.json")

# Also create subject-wise files
print("\n📂 Creating subject-wise files...")
by_subject = {}
for q in questions:
    subj = q["subject"]
    if subj not in by_subject:
        by_subject[subj] = []
    by_subject[subj].append(q)

for subj, qs in by_subject.items():
    filename = re.sub(r'[^a-z0-9]', '_', subj.lower()) + '.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(qs, f, indent=2, ensure_ascii=False)
    print(f"   ✅ {filename}: {len(qs)} questions")
    files.download(filename)

print("\n✅ All files ready for download!")
