# ============================================================
# ⚡ GROQ ULTRA-FAST Question Generator
# ============================================================
# Groq Free Tier: ~14,400 requests/day, 6000 tokens/min
# Speed: 500+ tokens/second (FASTEST inference available)
# Target: 5000+ questions in ~2-3 hours
# ============================================================

import json
import time
import random
import re
import hashlib
import os
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# ==================== INSTALL GROQ ====================
# Run: pip install groq

try:
    from groq import Groq
except ImportError:
    print("Installing groq...")
    os.system("pip install groq -q")
    from groq import Groq

# ==================== CONFIGURATION ====================

# Your Groq API Key - Get yours at https://console.groq.com/keys
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")

# Generation settings
TARGET_QUESTIONS = 5000
QUESTIONS_PER_BATCH = 3  # Fewer questions = less tokens = less rate limiting
SAVE_INTERVAL = 50
OUTPUT_FILE = "ossc_groq_5k.json"

# Groq rate limits (free tier) - VERY CONSERVATIVE settings
# llama-3.1-8b-instant has MUCH higher limits than 70b model!
# - 30 requests per minute (but we'll do 10 to be safe)
# - 20,000 tokens per minute (8b model has higher limit)
REQUESTS_PER_MINUTE = 10  # Very conservative
DELAY_BETWEEN_REQUESTS = 6.0  # 6 seconds between requests (safe)

# Model - USE 8B MODEL (has HIGHER rate limits on free tier!)
# MODEL = "llama-3.3-70b-versatile"  # Low limits - causes rate errors
MODEL = "llama-3.1-8b-instant"  # FASTER + HIGHER LIMITS!
# MODEL = "gemma2-9b-it"  # Alternative option

print("=" * 60)
print("⚡ GROQ ULTRA-FAST Question Generator")
print("=" * 60)
print(f"🎯 Target: {TARGET_QUESTIONS} questions")
print(f"📦 Batch size: {QUESTIONS_PER_BATCH}")
print(f"🤖 Model: {MODEL}")
print(f"⏱️  Rate: {REQUESTS_PER_MINUTE} requests/min")
print("=" * 60)

# ==================== COMPLETE OSSC SYLLABUS ====================

SYLLABUS = [
    # ============ REASONING & MENTAL ABILITY (25%) ============
    {"subject": "Reasoning & Mental Ability", "topic": "Analogy", "subtopics": ["Word Analogy", "Number Analogy", "Letter Analogy", "Mixed Analogy"], "weight": 40},
    {"subject": "Reasoning & Mental Ability", "topic": "Series Completion", "subtopics": ["Number Series", "Letter Series", "Alpha-Numeric Series", "Mixed Series"], "weight": 40},
    {"subject": "Reasoning & Mental Ability", "topic": "Coding-Decoding", "subtopics": ["Letter Coding", "Number Coding", "Mixed Coding", "Symbol Coding"], "weight": 40},
    {"subject": "Reasoning & Mental Ability", "topic": "Blood Relations", "subtopics": ["Direct Relations", "Coded Relations", "Mixed Relations", "Family Tree"], "weight": 35},
    {"subject": "Reasoning & Mental Ability", "topic": "Direction & Distance", "subtopics": ["Simple Directions", "Complex Directions", "Shadow Problems", "Shortest Distance"], "weight": 35},
    {"subject": "Reasoning & Mental Ability", "topic": "Ranking & Order", "subtopics": ["Linear Arrangement", "Circular Arrangement", "Position Based"], "weight": 35},
    {"subject": "Reasoning & Mental Ability", "topic": "Syllogism", "subtopics": ["Basic Syllogism", "Either-Or Cases", "Possibility Cases"], "weight": 40},
    {"subject": "Reasoning & Mental Ability", "topic": "Venn Diagrams", "subtopics": ["Two Elements", "Three Elements", "Logical Venn"], "weight": 30},
    {"subject": "Reasoning & Mental Ability", "topic": "Puzzles", "subtopics": ["Seating Arrangement", "Scheduling", "Floor Puzzles", "Box Puzzles"], "weight": 50},
    {"subject": "Reasoning & Mental Ability", "topic": "Statement & Conclusions", "subtopics": ["Statement-Conclusion", "Statement-Assumption", "Course of Action"], "weight": 40},
    {"subject": "Reasoning & Mental Ability", "topic": "Non-Verbal Reasoning", "subtopics": ["Figure Series", "Mirror Image", "Water Image", "Paper Folding"], "weight": 35},
    {"subject": "Reasoning & Mental Ability", "topic": "Odd One Out", "subtopics": ["Word Based", "Number Based", "Letter Based"], "weight": 30},
    {"subject": "Reasoning & Mental Ability", "topic": "Classification", "subtopics": ["Word Classification", "Number Classification"], "weight": 25},
    
    # ============ QUANTITATIVE APTITUDE (25%) ============
    {"subject": "Quantitative Aptitude", "topic": "Number System", "subtopics": ["Divisibility Rules", "HCF & LCM", "Remainders", "Unit Digit", "Factors"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Simplification", "subtopics": ["BODMAS", "Fractions", "Decimals", "Approximation"], "weight": 40},
    {"subject": "Quantitative Aptitude", "topic": "Percentage", "subtopics": ["Basic Percentage", "Successive Percentage", "Population Problems", "Price Changes"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Ratio & Proportion", "subtopics": ["Simple Ratio", "Compound Ratio", "Partnership", "Mixture Problems"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Average", "subtopics": ["Simple Average", "Weighted Average", "Age Problems"], "weight": 40},
    {"subject": "Quantitative Aptitude", "topic": "Profit & Loss", "subtopics": ["Basic P&L", "Discount", "Marked Price", "Successive Discounts"], "weight": 50},
    {"subject": "Quantitative Aptitude", "topic": "Simple Interest", "subtopics": ["Basic SI Formula", "Installments", "Time & Rate Problems"], "weight": 35},
    {"subject": "Quantitative Aptitude", "topic": "Compound Interest", "subtopics": ["Basic CI Formula", "Half-yearly CI", "SI vs CI Difference"], "weight": 40},
    {"subject": "Quantitative Aptitude", "topic": "Time & Work", "subtopics": ["Basic Work Problems", "Pipes & Cisterns", "Efficiency", "Work Alternately"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Time Speed Distance", "subtopics": ["Basic TSD", "Trains", "Boats & Streams", "Relative Speed"], "weight": 50},
    {"subject": "Quantitative Aptitude", "topic": "Mensuration 2D", "subtopics": ["Rectangle", "Square", "Circle", "Triangle", "Trapezium"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Mensuration 3D", "subtopics": ["Cube", "Cuboid", "Cylinder", "Cone", "Sphere"], "weight": 40},
    {"subject": "Quantitative Aptitude", "topic": "Geometry", "subtopics": ["Lines & Angles", "Triangles Properties", "Circles Theorems"], "weight": 40},
    {"subject": "Quantitative Aptitude", "topic": "Data Interpretation", "subtopics": ["Tables", "Bar Graphs", "Pie Charts", "Line Graphs"], "weight": 45},
    {"subject": "Quantitative Aptitude", "topic": "Algebra", "subtopics": ["Linear Equations", "Quadratic Equations", "Inequalities"], "weight": 35},
    {"subject": "Quantitative Aptitude", "topic": "Probability", "subtopics": ["Basic Probability", "Dice Problems", "Card Problems"], "weight": 30},
    
    # ============ ENGLISH LANGUAGE (15%) ============
    {"subject": "English Language", "topic": "Grammar - Tenses", "subtopics": ["Present Tenses", "Past Tenses", "Future Tenses"], "weight": 40},
    {"subject": "English Language", "topic": "Grammar - Parts of Speech", "subtopics": ["Articles", "Prepositions", "Conjunctions", "Pronouns"], "weight": 40},
    {"subject": "English Language", "topic": "Subject-Verb Agreement", "subtopics": ["Singular-Plural", "Collective Nouns"], "weight": 35},
    {"subject": "English Language", "topic": "Vocabulary - Synonyms", "subtopics": ["Common Words", "Advanced Words"], "weight": 40},
    {"subject": "English Language", "topic": "Vocabulary - Antonyms", "subtopics": ["Common Words", "Advanced Words"], "weight": 40},
    {"subject": "English Language", "topic": "One Word Substitution", "subtopics": ["People", "Places", "Actions"], "weight": 35},
    {"subject": "English Language", "topic": "Idioms & Phrases", "subtopics": ["Common Idioms", "Proverbs", "Phrasal Verbs"], "weight": 35},
    {"subject": "English Language", "topic": "Error Spotting", "subtopics": ["Grammatical Errors", "Spelling Errors"], "weight": 40},
    {"subject": "English Language", "topic": "Sentence Correction", "subtopics": ["Grammar Based", "Word Usage"], "weight": 35},
    {"subject": "English Language", "topic": "Fill in the Blanks", "subtopics": ["Single Blanks", "Double Blanks", "Cloze Test"], "weight": 40},
    {"subject": "English Language", "topic": "Sentence Rearrangement", "subtopics": ["Para Jumbles", "Sentence Sequencing"], "weight": 35},
    {"subject": "English Language", "topic": "Reading Comprehension", "subtopics": ["Fact Based", "Inference Based"], "weight": 40},
    {"subject": "English Language", "topic": "Active-Passive Voice", "subtopics": ["Simple Sentences", "Complex Sentences"], "weight": 30},
    {"subject": "English Language", "topic": "Direct-Indirect Speech", "subtopics": ["Statements", "Questions", "Commands"], "weight": 30},
    
    # ============ GENERAL KNOWLEDGE (15%) ============
    {"subject": "General Knowledge", "topic": "Ancient Indian History", "subtopics": ["Indus Valley", "Vedic Period", "Maurya Empire", "Gupta Empire"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Medieval Indian History", "subtopics": ["Delhi Sultanate", "Mughal Empire", "Maratha Empire"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Modern Indian History", "subtopics": ["British Rule", "Freedom Struggle", "Indian National Congress"], "weight": 50},
    {"subject": "General Knowledge", "topic": "Indian Geography - Physical", "subtopics": ["Mountains", "Rivers", "Plains", "Climate"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Indian Geography - Economic", "subtopics": ["Agriculture", "Industries", "Minerals"], "weight": 40},
    {"subject": "General Knowledge", "topic": "World Geography", "subtopics": ["Continents", "Oceans", "Important Countries"], "weight": 35},
    {"subject": "General Knowledge", "topic": "Indian Constitution", "subtopics": ["Preamble", "Fundamental Rights", "DPSP", "Amendments"], "weight": 50},
    {"subject": "General Knowledge", "topic": "Indian Polity - Parliament", "subtopics": ["Lok Sabha", "Rajya Sabha", "Bills & Laws"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Indian Polity - Executive", "subtopics": ["President", "Prime Minister", "Governor"], "weight": 40},
    {"subject": "General Knowledge", "topic": "Indian Polity - Judiciary", "subtopics": ["Supreme Court", "High Courts", "Judicial Review"], "weight": 40},
    {"subject": "General Knowledge", "topic": "Indian Economy - Basics", "subtopics": ["National Income", "GDP", "Five Year Plans"], "weight": 40},
    {"subject": "General Knowledge", "topic": "Indian Economy - Banking", "subtopics": ["RBI", "Commercial Banks", "Monetary Policy"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Physics", "subtopics": ["Motion & Force", "Energy", "Light", "Sound", "Electricity"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Chemistry", "subtopics": ["Elements & Compounds", "Acids & Bases", "Chemical Reactions"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Biology", "subtopics": ["Cell Biology", "Human Body", "Diseases", "Nutrition"], "weight": 45},
    {"subject": "General Knowledge", "topic": "Computer Science", "subtopics": ["Computer Basics", "Hardware", "Software", "Internet"], "weight": 35},
    {"subject": "General Knowledge", "topic": "Current Affairs", "subtopics": ["Government Schemes", "Awards", "Sports", "Events"], "weight": 40},
    
    # ============ ODISHA GK (10%) ============
    {"subject": "Odisha GK", "topic": "Ancient Odisha History", "subtopics": ["Kalinga War", "Kharavela", "Eastern Ganga Dynasty"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Medieval Odisha History", "subtopics": ["Gajapati Dynasty", "Afghan & Mughal Rule"], "weight": 30},
    {"subject": "Odisha GK", "topic": "Modern Odisha History", "subtopics": ["Paika Rebellion", "Freedom Movement", "State Formation"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Odisha Geography", "subtopics": ["Rivers", "Mountains", "Districts", "Climate"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Temples", "subtopics": ["Jagannath Temple", "Konark Sun Temple", "Lingaraj Temple"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Festivals", "subtopics": ["Rath Yatra", "Raja Parba", "Durga Puja"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Odisha Culture - Dance & Art", "subtopics": ["Odissi Dance", "Pattachitra", "Silver Filigree"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Odisha Economy", "subtopics": ["Industries", "Minerals", "Agriculture"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Odisha Polity", "subtopics": ["State Legislature", "Governor & CM", "Panchayati Raj"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Odisha Personalities", "subtopics": ["Freedom Fighters", "Writers", "Social Reformers"], "weight": 35},
    
    # ============ ODIA LANGUAGE (10%) ============
    {"subject": "Odia Language", "topic": "Odia Grammar - Sandhi", "subtopics": ["Swar Sandhi", "Vyanjan Sandhi", "Visarga Sandhi"], "weight": 30},
    {"subject": "Odia Language", "topic": "Odia Grammar - Samas", "subtopics": ["Tatpurusha", "Dwandwa", "Bahubrihi"], "weight": 30},
    {"subject": "Odia Language", "topic": "Odia Vocabulary", "subtopics": ["Synonyms", "Antonyms", "One Word Substitution"], "weight": 35},
    {"subject": "Odia Language", "topic": "Odia Idioms", "subtopics": ["Common Idioms", "Proverbs"], "weight": 30},
    {"subject": "Odia Language", "topic": "Odia Literature - Ancient", "subtopics": ["Sarala Das", "Jagannath Das", "Balaram Das"], "weight": 30},
    {"subject": "Odia Language", "topic": "Odia Literature - Modern", "subtopics": ["Fakir Mohan Senapati", "Radhanath Ray", "Gopabandhu Das"], "weight": 35},
]

print(f"📚 Total topics: {len(SYLLABUS)}")

# ==================== INITIALIZE GROQ CLIENT ====================

client = Groq(api_key=GROQ_API_KEY)

# ==================== UTILITY FUNCTIONS ====================

def generate_id():
    """Generate unique question ID"""
    return f"q_{int(time.time()*1000)}_{random.randint(1000,9999)}"

def get_hash(text):
    """Generate hash for duplicate detection"""
    return hashlib.md5(text.lower().strip()[:100].encode()).hexdigest()

def format_time(seconds):
    """Format seconds to readable string"""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        return f"{int(seconds//60)}m {int(seconds%60)}s"
    else:
        return f"{int(seconds//3600)}h {int((seconds%3600)//60)}m"

def save_questions(questions, filename):
    """Save questions to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

# ==================== QUESTION GENERATION ====================

def generate_questions_batch(topic_data, batch_size=5):
    """Generate a batch of questions using Groq API"""
    
    subject = topic_data["subject"]
    topic = topic_data["topic"]
    subtopic = random.choice(topic_data["subtopics"])
    difficulty = random.choice(["easy", "medium", "hard"])
    
    prompt = f"""You are an expert question setter for OSSC (Odisha Staff Selection Commission) RI & AI competitive exams in India.

Generate exactly {batch_size} unique multiple-choice questions (MCQs) for:
- Subject: {subject}
- Topic: {topic}
- Subtopic: {subtopic}
- Difficulty: {difficulty}

REQUIREMENTS:
1. Each question must be unique and exam-worthy
2. Each question must have exactly 4 options: A, B, C, D
3. Only ONE correct answer per question
4. Include clear explanation for each answer
5. For math questions, show step-by-step solution in explanation

Return ONLY a valid JSON array with {batch_size} questions in this EXACT format:
[
  {{
    "question": "Complete question text here?",
    "options": {{"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}},
    "correctAnswer": "A",
    "explanation": "Detailed explanation"
  }}
]

Generate {batch_size} questions now:"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert competitive exam question setter. Always return valid JSON arrays only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=2000,
        )
        
        text = response.choices[0].message.content
        
        # Parse JSON
        questions = []
        try:
            # Find JSON array
            match = re.search(r'\[[\s\S]*\]', text)
            if match:
                arr = json.loads(match.group(0))
                for q in arr:
                    if all(k in q for k in ["question", "options", "correctAnswer"]):
                        if isinstance(q["options"], dict) and len(q["options"]) == 4:
                            if q["correctAnswer"] in ["A", "B", "C", "D"]:
                                questions.append({
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
        except json.JSONDecodeError:
            pass
        
        return questions
        
    except Exception as e:
        error_msg = str(e)
        if "rate_limit" in error_msg.lower():
            print(f"\n⚠️ Rate limit hit, waiting 60s...")
            time.sleep(60)
        else:
            print(f"\n❌ Error: {error_msg[:50]}")
        return []

# ==================== MAIN GENERATION LOOP ====================

def run_generation():
    """Main generation loop with progress tracking"""
    
    print("\n" + "=" * 60)
    print("🚀 Starting Question Generation with Groq API")
    print("=" * 60)
    
    all_questions = []
    question_hashes = set()
    stats = {
        "generated": 0,
        "duplicates": 0,
        "failed": 0,
        "by_subject": {}
    }
    
    # Load existing questions
    if Path(OUTPUT_FILE).exists():
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                all_questions = json.load(f)
                for q in all_questions:
                    question_hashes.add(get_hash(q["question"]))
            print(f"📂 Loaded {len(all_questions)} existing questions")
        except:
            pass
    
    remaining = TARGET_QUESTIONS - len(all_questions)
    if remaining <= 0:
        print(f"✅ Already have {len(all_questions)} questions!")
        return all_questions
    
    print(f"📝 Generating {remaining} more questions...")
    print(f"⏱️  Estimated time: {format_time(remaining / QUESTIONS_PER_BATCH * DELAY_BETWEEN_REQUESTS)}")
    print()
    
    start_time = time.time()
    last_save = len(all_questions)
    request_times = []
    
    while len(all_questions) < TARGET_QUESTIONS:
        batch_start = time.time()
        
        # Select topic based on weight
        topic = random.choices(SYLLABUS, weights=[t["weight"] for t in SYLLABUS])[0]
        
        # Generate questions
        new_questions = generate_questions_batch(topic, QUESTIONS_PER_BATCH)
        
        # Add unique questions
        added = 0
        for q in new_questions:
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
        if not new_questions:
            stats["failed"] += 1
        
        # Calculate progress
        current = len(all_questions)
        percent = (current / TARGET_QUESTIONS) * 100
        bar = '█' * int(30 * current // TARGET_QUESTIONS) + '░' * (30 - int(30 * current // TARGET_QUESTIONS))
        
        # Calculate ETA
        elapsed = time.time() - start_time
        if stats["generated"] > 0:
            time_per_q = elapsed / stats["generated"]
            remaining_qs = TARGET_QUESTIONS - current
            eta = remaining_qs * time_per_q
            speed = stats["generated"] / max(elapsed, 1) * 3600
            eta_str = format_time(eta)
        else:
            eta_str = "calculating..."
            speed = 0
        
        print(f"\r⚡ |{bar}| {current}/{TARGET_QUESTIONS} ({percent:.1f}%) | +{added} | {speed:.0f}/hr | ETA: {eta_str}   ", end='', flush=True)
        
        # Auto-save
        if current - last_save >= SAVE_INTERVAL:
            save_questions(all_questions, OUTPUT_FILE)
            print(f"\n💾 Saved {current} questions")
            last_save = current
        
        # Rate limiting - wait before next request
        batch_time = time.time() - batch_start
        wait_time = max(0, DELAY_BETWEEN_REQUESTS - batch_time)
        if wait_time > 0:
            time.sleep(wait_time)
    
    # Final save
    save_questions(all_questions, OUTPUT_FILE)
    
    # Summary
    elapsed = time.time() - start_time
    print("\n\n" + "=" * 60)
    print("✅ GENERATION COMPLETE!")
    print("=" * 60)
    print(f"📊 Total Questions: {len(all_questions)}")
    print(f"⏱️  Total Time: {format_time(elapsed)}")
    print(f"⚡ Speed: {len(all_questions)/max(elapsed,1)*3600:.0f} questions/hour")
    print(f"🔄 Duplicates skipped: {stats['duplicates']}")
    print(f"❌ Failed requests: {stats['failed']}")
    print()
    print("📚 Questions by Subject:")
    for subj, count in sorted(stats["by_subject"].items(), key=lambda x: -x[1]):
        print(f"   {subj}: {count}")
    print()
    print(f"📁 Output file: {OUTPUT_FILE}")
    print("=" * 60)
    
    return all_questions

# ==================== SUBJECT-WISE FILES ====================

def create_subject_files(questions):
    """Create separate JSON files for each subject"""
    print("\n📂 Creating subject-wise files...")
    
    by_subject = {}
    for q in questions:
        subj = q["subject"]
        if subj not in by_subject:
            by_subject[subj] = []
        by_subject[subj].append(q)
    
    for subj, qs in by_subject.items():
        filename = re.sub(r'[^a-z0-9]', '_', subj.lower()) + '.json'
        filepath = Path(OUTPUT_FILE).parent / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(qs, f, indent=2, ensure_ascii=False)
        print(f"   ✅ {filename}: {len(qs)} questions")

# ==================== RUN ====================

if __name__ == "__main__":
    print("\n⚡ GROQ Question Generator - Starting...")
    print("=" * 60)
    
    # Test API connection
    print("🔄 Testing Groq API connection...")
    try:
        test = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": "Say 'API working'"}],
            max_tokens=10
        )
        print(f"✅ API connected! Model: {MODEL}")
    except Exception as e:
        print(f"❌ API Error: {e}")
        exit(1)
    
    # Run generation
    questions = run_generation()
    
    # Create subject files
    if questions:
        create_subject_files(questions)
    
    print("\n✅ All done! Check the generated JSON files.")
