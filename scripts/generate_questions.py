"""
OSSC RI/AI Exam Question Generator
===================================
Generates 1000-2000 unique questions using Ollama (Llama3 & Mistral) in parallel.

Usage: python scripts/generate_questions.py

Features:
- Parallel generation using both models simultaneously
- Real-time progress bar with ETA
- Duplicate detection
- Auto-save progress every 50 questions
- Generates questions based on OSSC RI/AI syllabus
"""

import json
import os
import time
import hashlib
import random
import re
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests
from threading import Lock

# ============ CONFIGURATION ============
OLLAMA_API = "http://localhost:11434/api/generate"
MODELS = ["llama3:latest", "mistral:latest"]
TARGET_QUESTIONS = 1500  # Target number of questions (1000-2000)
MAX_WORKERS = 4  # Parallel threads
QUESTIONS_DIR = Path(__file__).parent.parent / "src" / "data" / "questions"
SAVE_INTERVAL = 50  # Save progress every N questions

# ============ SYLLABUS DATA ============
SYLLABUS = [
    # Reasoning & Mental Ability (25% = ~375 questions)
    {"subject": "Reasoning & Mental Ability", "topic": "Analogy", "subtopics": ["Word Analogy", "Number Analogy", "Letter Analogy", "Mixed Analogy"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Series Completion", "subtopics": ["Number Series", "Letter Series", "Alpha-Numeric Series", "Mixed Series"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Coding-Decoding", "subtopics": ["Letter Coding", "Number Coding", "Mixed Coding", "Substitution"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Blood Relations", "subtopics": ["Direct Relations", "Coded Relations", "Mixed Relations"], "weight": 25, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Direction & Distance", "subtopics": ["Simple Directions", "Complex Directions", "Shadow Problems"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Ranking & Order", "subtopics": ["Linear Arrangement", "Circular Arrangement", "Complex Arrangement"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Syllogism", "subtopics": ["Basic Syllogism", "Either-Or Cases", "Possibility Cases"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Venn Diagrams", "subtopics": ["Two Elements", "Three Elements", "Complex Diagrams"], "weight": 20, "difficulties": ["easy", "medium"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Puzzles", "subtopics": ["Seating Arrangement", "Scheduling", "Floor Puzzles", "Comparison"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Statement & Conclusions", "subtopics": ["Statement-Conclusion", "Statement-Assumption", "Statement-Argument"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "Reasoning & Mental Ability", "topic": "Non-Verbal Reasoning", "subtopics": ["Figure Series", "Mirror Image", "Water Image", "Paper Folding", "Counting Figures"], "weight": 25, "difficulties": ["easy", "medium"]},
    
    # Quantitative Aptitude (25% = ~375 questions)
    {"subject": "Quantitative Aptitude", "topic": "Number System", "subtopics": ["Types of Numbers", "Divisibility", "HCF & LCM", "Remainders", "Unit Digit"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Simplification", "subtopics": ["BODMAS", "Fractions", "Decimals", "Surds", "Approximation"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Quantitative Aptitude", "topic": "Percentage", "subtopics": ["Basic Percentage", "Successive Percentage", "Population Problems"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Ratio & Proportion", "subtopics": ["Simple Ratio", "Compound Ratio", "Proportion", "Partnership"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Average", "subtopics": ["Simple Average", "Weighted Average", "Age Problems"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Quantitative Aptitude", "topic": "Profit & Loss", "subtopics": ["Basic P&L", "Discount", "Marked Price", "Successive Discounts"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Simple Interest", "subtopics": ["Basic SI", "Installments", "Time & Rate Problems"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Quantitative Aptitude", "topic": "Compound Interest", "subtopics": ["Basic CI", "Half-yearly", "SI vs CI Difference"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Time & Work", "subtopics": ["Basic Work", "Pipes & Cisterns", "Efficiency", "Wages"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Time, Speed & Distance", "subtopics": ["Basic TSD", "Trains", "Boats & Streams", "Relative Speed"], "weight": 35, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Mensuration", "subtopics": ["2D Figures", "3D Figures", "Area", "Volume", "Surface Area"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Geometry", "subtopics": ["Lines & Angles", "Triangles", "Circles", "Quadrilaterals"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "Quantitative Aptitude", "topic": "Data Interpretation", "subtopics": ["Tables", "Bar Graphs", "Pie Charts", "Line Graphs"], "weight": 30, "difficulties": ["medium", "hard"]},
    
    # English Language (15% = ~225 questions)
    {"subject": "English Language", "topic": "Grammar", "subtopics": ["Tenses", "Subject-Verb Agreement", "Articles", "Prepositions", "Conjunctions"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "English Language", "topic": "Vocabulary", "subtopics": ["Synonyms", "Antonyms", "One Word Substitution", "Idioms & Phrases"], "weight": 35, "difficulties": ["easy", "medium"]},
    {"subject": "English Language", "topic": "Error Spotting", "subtopics": ["Grammatical Errors", "Spelling Errors", "Sentence Correction"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Fill in the Blanks", "subtopics": ["Single Blanks", "Double Blanks", "Cloze Test"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "English Language", "topic": "Sentence Rearrangement", "subtopics": ["Para Jumbles", "Sentence Sequencing"], "weight": 25, "difficulties": ["medium", "hard"]},
    {"subject": "English Language", "topic": "Reading Comprehension", "subtopics": ["Passage-based Questions", "Inference", "Theme & Tone"], "weight": 25, "difficulties": ["medium", "hard"]},
    
    # General Knowledge (15% = ~225 questions)
    {"subject": "General Knowledge", "topic": "Indian History", "subtopics": ["Ancient India", "Medieval India", "Modern India", "Freedom Struggle"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Geography", "subtopics": ["Indian Geography", "World Geography", "Physical Geography", "Climate"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Polity", "subtopics": ["Constitution", "Parliament", "Judiciary", "Fundamental Rights", "Local Government"], "weight": 35, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "General Knowledge", "topic": "Indian Economy", "subtopics": ["Economic Planning", "Agriculture", "Industry", "Banking", "Budget"], "weight": 30, "difficulties": ["medium", "hard"]},
    {"subject": "General Knowledge", "topic": "General Science", "subtopics": ["Physics", "Chemistry", "Biology", "Environmental Science"], "weight": 35, "difficulties": ["easy", "medium"]},
    {"subject": "General Knowledge", "topic": "Current Affairs", "subtopics": ["National Events", "International Events", "Sports", "Awards", "Appointments"], "weight": 25, "difficulties": ["easy", "medium"]},
    
    # Odisha GK (10% = ~150 questions)
    {"subject": "Odisha GK", "topic": "Odisha History", "subtopics": ["Ancient Odisha", "Medieval Odisha", "Modern Odisha", "Freedom Movement in Odisha"], "weight": 25, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Geography", "subtopics": ["Rivers", "Mountains", "Districts", "Climate", "Natural Resources"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Culture & Heritage", "subtopics": ["Temples", "Festivals", "Dance Forms", "Art & Craft", "UNESCO Sites"], "weight": 25, "difficulties": ["easy", "medium"]},
    {"subject": "Odisha GK", "topic": "Odisha Economy", "subtopics": ["Agriculture", "Industries", "Minerals", "Government Schemes"], "weight": 20, "difficulties": ["medium", "hard"]},
    {"subject": "Odisha GK", "topic": "Odisha Polity & Administration", "subtopics": ["State Legislature", "Panchayati Raj", "Administrative Divisions", "Important Acts"], "weight": 20, "difficulties": ["medium", "hard"]},
    
    # Odia Language (10% = ~150 questions)
    {"subject": "Odia Language", "topic": "Odia Grammar", "subtopics": ["Sandhi", "Samas", "Karak & Vibhakti", "Voice Change"], "weight": 30, "difficulties": ["easy", "medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Vocabulary", "subtopics": ["Synonyms", "Antonyms", "One Word Substitution", "Idioms"], "weight": 30, "difficulties": ["easy", "medium"]},
    {"subject": "Odia Language", "topic": "Odia Comprehension", "subtopics": ["Passage Questions", "Summary Writing"], "weight": 20, "difficulties": ["medium", "hard"]},
    {"subject": "Odia Language", "topic": "Odia Literature", "subtopics": ["Famous Authors", "Books & Writers", "Literary Era"], "weight": 20, "difficulties": ["easy", "medium"]},
]

# ============ GLOBAL STATE ============
generated_questions = []
question_hashes = set()
stats = {
    "total_generated": 0,
    "duplicates_skipped": 0,
    "failures": 0,
    "by_model": {"llama3:latest": 0, "mistral:latest": 0},
    "by_subject": {},
    "by_difficulty": {"easy": 0, "medium": 0, "hard": 0},
    "start_time": None,
    "times": []
}
lock = Lock()

# ============ UTILITY FUNCTIONS ============

def generate_id():
    """Generate unique question ID."""
    return f"q_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"

def get_question_hash(question_text):
    """Generate hash for duplicate detection."""
    normalized = question_text.lower().strip()
    normalized = re.sub(r'\s+', ' ', normalized)
    return hashlib.md5(normalized.encode()).hexdigest()

def parse_json_response(response_text):
    """Parse JSON from model response."""
    try:
        # Remove markdown code blocks
        cleaned = re.sub(r'```json\s*', '', response_text)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Find JSON object
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            return json.loads(match.group(0))
        return None
    except json.JSONDecodeError:
        return None

def format_time(seconds):
    """Format seconds to human-readable time."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"

def print_progress(current, total, start_time, last_times):
    """Print progress bar with ETA."""
    percent = (current / total) * 100
    bar_length = 40
    filled = int(bar_length * current // total)
    bar = '█' * filled + '░' * (bar_length - filled)
    
    # Calculate ETA
    elapsed = time.time() - start_time
    if current > 0 and len(last_times) > 0:
        avg_time = sum(last_times[-50:]) / len(last_times[-50:])  # Last 50 questions avg
        remaining = (total - current) * avg_time
        eta = format_time(remaining)
    else:
        eta = "calculating..."
    
    elapsed_str = format_time(elapsed)
    
    print(f"\r⏳ Progress: |{bar}| {current}/{total} ({percent:.1f}%) | Elapsed: {elapsed_str} | ETA: {eta}   ", end='', flush=True)

def save_progress():
    """Save current progress to file."""
    global generated_questions
    
    with lock:
        if not generated_questions:
            return
            
        # Ensure directory exists
        QUESTIONS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save all questions
        output_file = QUESTIONS_DIR / "all_questions.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(generated_questions, f, indent=2, ensure_ascii=False)
        
        # Save by subject
        questions_by_subject = {}
        for q in generated_questions:
            subject = q["subject"]
            if subject not in questions_by_subject:
                questions_by_subject[subject] = []
            questions_by_subject[subject].append(q)
        
        for subject, questions in questions_by_subject.items():
            filename = re.sub(r'[^a-z0-9]', '_', subject.lower()) + '.json'
            with open(QUESTIONS_DIR / filename, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
        
        # Save index
        index = {
            "totalQuestions": len(generated_questions),
            "generatedAt": datetime.now().isoformat(),
            "subjects": [
                {
                    "name": subject,
                    "count": len(questions),
                    "file": re.sub(r'[^a-z0-9]', '_', subject.lower()) + '.json'
                }
                for subject, questions in questions_by_subject.items()
            ],
            "difficultyBreakdown": stats["by_difficulty"].copy()
        }
        with open(QUESTIONS_DIR / "index.json", 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)

# ============ QUESTION GENERATION ============

def call_ollama(model, prompt, timeout=120):
    """Call Ollama API to generate question."""
    try:
        response = requests.post(
            OLLAMA_API,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "num_predict": 1024
                }
            },
            timeout=timeout
        )
        
        if response.status_code == 200:
            return response.json().get("response", "")
        return None
    except Exception as e:
        return None

def generate_prompt(topic_data, subtopic, difficulty):
    """Generate prompt for question generation."""
    return f"""You are an expert question setter for OSSC (Odisha Staff Selection Commission) Revenue Inspector (RI) and Amin (AI) competitive exams in India.

Generate ONE unique multiple-choice question (MCQ) for:
- Subject: {topic_data["subject"]}
- Topic: {topic_data["topic"]}
- Subtopic: {subtopic}
- Difficulty: {difficulty}

Requirements:
1. Question must be appropriate for Indian government competitive exams
2. Exactly 4 options (A, B, C, D)
3. Only ONE correct answer
4. Clear explanation of why the answer is correct
5. Difficulty: {difficulty} (easy = basic recall, medium = application, hard = analysis)
6. For math questions, include step-by-step solution in explanation
7. Make the question unique and not commonly found in question banks

Return ONLY a valid JSON object in this exact format (no other text):
{{
  "question": "The complete question text here",
  "options": {{
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  }},
  "correctAnswer": "A",
  "explanation": "Detailed explanation with solution steps if applicable"
}}"""

def generate_single_question(task):
    """Generate a single question using specified model."""
    model, topic_data, subtopic, difficulty, task_id = task
    
    start = time.time()
    
    prompt = generate_prompt(topic_data, subtopic, difficulty)
    response = call_ollama(model, prompt)
    
    if not response:
        return None, model, time.time() - start
    
    parsed = parse_json_response(response)
    if not parsed:
        return None, model, time.time() - start
    
    # Validate structure
    required_fields = ["question", "options", "correctAnswer", "explanation"]
    if not all(field in parsed for field in required_fields):
        return None, model, time.time() - start
    
    # Check for duplicate
    q_hash = get_question_hash(parsed["question"])
    with lock:
        if q_hash in question_hashes:
            stats["duplicates_skipped"] += 1
            return None, model, time.time() - start
        question_hashes.add(q_hash)
    
    # Create question object
    question = {
        "id": generate_id(),
        "subject": topic_data["subject"],
        "topic": topic_data["topic"],
        "subtopic": subtopic,
        "difficulty": difficulty,
        "question": parsed["question"],
        "options": parsed["options"],
        "correctAnswer": parsed["correctAnswer"],
        "explanation": parsed["explanation"],
        "model": model,
        "generatedAt": datetime.now().isoformat()
    }
    
    return question, model, time.time() - start

def create_task_queue(target_count):
    """Create balanced task queue based on syllabus weights."""
    tasks = []
    
    # Calculate total weight
    total_weight = sum(t["weight"] for t in SYLLABUS)
    
    for topic_data in SYLLABUS:
        # Questions for this topic based on weight
        topic_count = int((topic_data["weight"] / total_weight) * target_count)
        topic_count = max(topic_count, 5)  # Minimum 5 questions per topic
        
        for _ in range(topic_count):
            subtopic = random.choice(topic_data["subtopics"])
            difficulty = random.choice(topic_data["difficulties"])
            model = random.choice(MODELS)
            
            tasks.append((model, topic_data, subtopic, difficulty, len(tasks)))
    
    # Shuffle tasks for variety
    random.shuffle(tasks)
    
    return tasks[:target_count + 200]  # Add buffer for failures

def main():
    """Main generation loop."""
    global generated_questions, stats
    
    print("=" * 60)
    print("🚀 OSSC RI/AI Question Generator")
    print("=" * 60)
    print(f"📊 Target: {TARGET_QUESTIONS} questions")
    print(f"🤖 Models: {', '.join(MODELS)}")
    print(f"⚡ Parallel workers: {MAX_WORKERS}")
    print(f"📁 Output: {QUESTIONS_DIR}")
    print("=" * 60)
    
    # Check Ollama is running
    print("\n🔍 Checking Ollama connection...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = [m["name"] for m in response.json().get("models", [])]
            print(f"✅ Ollama running. Available models: {', '.join(models)}")
        else:
            print("❌ Ollama not responding properly. Please start Ollama first.")
            return
    except:
        print("❌ Cannot connect to Ollama. Please start Ollama first.")
        print("   Run: ollama serve")
        return
    
    # Load existing questions to avoid duplicates
    existing_file = QUESTIONS_DIR / "all_questions.json"
    if existing_file.exists():
        print(f"\n📂 Loading existing questions from {existing_file}...")
        try:
            with open(existing_file, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                generated_questions = existing
                for q in existing:
                    question_hashes.add(get_question_hash(q["question"]))
                print(f"✅ Loaded {len(existing)} existing questions")
        except:
            print("⚠️ Could not load existing questions, starting fresh")
    
    remaining = TARGET_QUESTIONS - len(generated_questions)
    if remaining <= 0:
        print(f"\n✅ Already have {len(generated_questions)} questions. Target reached!")
        return
    
    print(f"\n📝 Need to generate: {remaining} more questions")
    
    # Create task queue
    tasks = create_task_queue(remaining + 100)
    
    stats["start_time"] = time.time()
    completed = 0
    
    print("\n🏁 Starting generation...\n")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        task_iter = iter(tasks)
        
        # Submit initial batch
        for _ in range(min(MAX_WORKERS * 2, len(tasks))):
            try:
                task = next(task_iter)
                future = executor.submit(generate_single_question, task)
                futures[future] = task
            except StopIteration:
                break
        
        while futures and len(generated_questions) < TARGET_QUESTIONS:
            # Wait for next completed future
            done = next(as_completed(futures))
            task = futures.pop(done)
            
            try:
                question, model, elapsed = done.result()
                
                if question:
                    with lock:
                        generated_questions.append(question)
                        stats["total_generated"] += 1
                        stats["by_model"][model] += 1
                        stats["by_difficulty"][question["difficulty"]] += 1
                        if question["subject"] not in stats["by_subject"]:
                            stats["by_subject"][question["subject"]] = 0
                        stats["by_subject"][question["subject"]] += 1
                        stats["times"].append(elapsed)
                    
                    completed += 1
                    
                    # Save progress periodically
                    if completed % SAVE_INTERVAL == 0:
                        save_progress()
                        print(f"\n💾 Progress saved: {len(generated_questions)} questions")
                else:
                    stats["failures"] += 1
                
            except Exception as e:
                stats["failures"] += 1
            
            # Print progress
            print_progress(len(generated_questions), TARGET_QUESTIONS, stats["start_time"], stats["times"])
            
            # Submit new task if available
            if len(generated_questions) < TARGET_QUESTIONS:
                try:
                    task = next(task_iter)
                    future = executor.submit(generate_single_question, task)
                    futures[future] = task
                except StopIteration:
                    pass
    
    # Final save
    save_progress()
    
    # Print summary
    elapsed = time.time() - stats["start_time"]
    
    print("\n\n" + "=" * 60)
    print("📊 GENERATION COMPLETE!")
    print("=" * 60)
    print(f"✅ Total Questions: {len(generated_questions)}")
    print(f"⏱️  Total Time: {format_time(elapsed)}")
    print(f"⚡ Avg Time/Question: {elapsed/max(completed,1):.1f}s")
    print(f"❌ Failures: {stats['failures']}")
    print(f"🔄 Duplicates Skipped: {stats['duplicates_skipped']}")
    print()
    print("📈 By Model:")
    for model, count in stats["by_model"].items():
        print(f"   {model}: {count}")
    print()
    print("📊 By Difficulty:")
    for diff, count in stats["by_difficulty"].items():
        print(f"   {diff}: {count}")
    print()
    print("📚 By Subject:")
    for subject, count in sorted(stats["by_subject"].items(), key=lambda x: -x[1]):
        print(f"   {subject}: {count}")
    print()
    print(f"📁 Output saved to: {QUESTIONS_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
