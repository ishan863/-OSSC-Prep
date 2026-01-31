"""
OSSC RI/AI Question Generator - FAST VERSION
=============================================
Generates 1000-2000 unique questions using Ollama in parallel.
OPTIMIZED: Generates 5 questions per API call for 5x speed!

Usage: python scripts/generate_questions_fast.py
"""

import json
import os
import time
import hashlib
import random
import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests
from threading import Lock

# ============ CONFIGURATION ============
OLLAMA_API = "http://localhost:11434/api/generate"
MODELS = ["llama3:latest", "mistral:latest"]
TARGET_QUESTIONS = 1500
MAX_WORKERS = 8  # Increased workers
QUESTIONS_PER_CALL = 5  # Generate 5 questions per API call!
QUESTIONS_DIR = Path(__file__).parent.parent / "src" / "data" / "questions"
SAVE_INTERVAL = 25

# ============ SYLLABUS DATA (Compact) ============
SYLLABUS = [
    ("Reasoning & Mental Ability", "Analogy", ["Word", "Number", "Letter"]),
    ("Reasoning & Mental Ability", "Series Completion", ["Number", "Letter", "Alpha-Numeric"]),
    ("Reasoning & Mental Ability", "Coding-Decoding", ["Letter", "Number", "Mixed"]),
    ("Reasoning & Mental Ability", "Blood Relations", ["Direct", "Coded"]),
    ("Reasoning & Mental Ability", "Direction & Distance", ["Simple", "Complex"]),
    ("Reasoning & Mental Ability", "Ranking & Order", ["Linear", "Circular"]),
    ("Reasoning & Mental Ability", "Syllogism", ["Basic", "Possibility"]),
    ("Reasoning & Mental Ability", "Puzzles", ["Seating", "Scheduling"]),
    ("Reasoning & Mental Ability", "Statement & Conclusions", ["Conclusion", "Assumption"]),
    ("Quantitative Aptitude", "Number System", ["HCF LCM", "Divisibility", "Unit Digit"]),
    ("Quantitative Aptitude", "Simplification", ["BODMAS", "Fractions"]),
    ("Quantitative Aptitude", "Percentage", ["Basic", "Successive"]),
    ("Quantitative Aptitude", "Ratio & Proportion", ["Ratio", "Partnership"]),
    ("Quantitative Aptitude", "Average", ["Simple", "Age Problems"]),
    ("Quantitative Aptitude", "Profit & Loss", ["Basic", "Discount"]),
    ("Quantitative Aptitude", "Simple Interest", ["Basic SI", "Rate Problems"]),
    ("Quantitative Aptitude", "Compound Interest", ["Basic CI", "Difference"]),
    ("Quantitative Aptitude", "Time & Work", ["Work", "Pipes"]),
    ("Quantitative Aptitude", "Time Speed Distance", ["TSD", "Trains"]),
    ("Quantitative Aptitude", "Mensuration", ["Area", "Volume"]),
    ("English Language", "Grammar", ["Tenses", "Articles", "Prepositions"]),
    ("English Language", "Vocabulary", ["Synonyms", "Antonyms", "Idioms"]),
    ("English Language", "Error Spotting", ["Grammar Errors", "Correction"]),
    ("English Language", "Fill in Blanks", ["Single", "Double"]),
    ("General Knowledge", "Indian History", ["Ancient", "Medieval", "Modern"]),
    ("General Knowledge", "Geography", ["Indian", "Physical"]),
    ("General Knowledge", "Indian Polity", ["Constitution", "Parliament"]),
    ("General Knowledge", "Economy", ["Banking", "Budget"]),
    ("General Knowledge", "Science", ["Physics", "Chemistry", "Biology"]),
    ("Odisha GK", "Odisha History", ["Ancient", "Freedom Movement"]),
    ("Odisha GK", "Odisha Geography", ["Rivers", "Districts"]),
    ("Odisha GK", "Odisha Culture", ["Temples", "Festivals"]),
    ("Odisha GK", "Odisha Economy", ["Industries", "Minerals"]),
]

# ============ GLOBAL STATE ============
generated_questions = []
question_hashes = set()
stats = {"generated": 0, "failed": 0, "duplicates": 0, "start": None, "times": []}
lock = Lock()

def generate_id():
    return f"q_{int(time.time()*1000)}_{random.randint(1000,9999)}"

def get_hash(text):
    return hashlib.md5(text.lower().strip()[:100].encode()).hexdigest()

def parse_questions(response_text):
    """Parse multiple questions from response."""
    questions = []
    try:
        # Try to find JSON array first
        cleaned = re.sub(r'```json\s*', '', response_text)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Try array
        match = re.search(r'\[[\s\S]*\]', cleaned)
        if match:
            arr = json.loads(match.group(0))
            if isinstance(arr, list):
                return arr
        
        # Try individual objects
        for m in re.finditer(r'\{[^{}]*"question"[^{}]*\}', cleaned, re.DOTALL):
            try:
                q = json.loads(m.group(0))
                if "question" in q and "options" in q:
                    questions.append(q)
            except:
                pass
        
        return questions
    except:
        return questions

def format_time(s):
    if s < 60: return f"{int(s)}s"
    if s < 3600: return f"{int(s//60)}m {int(s%60)}s"
    return f"{int(s//3600)}h {int((s%3600)//60)}m"

def print_progress():
    global stats
    current = len(generated_questions)
    total = TARGET_QUESTIONS
    percent = (current / total) * 100
    bar = '█' * int(40 * current // total) + '░' * (40 - int(40 * current // total))
    
    elapsed = time.time() - stats["start"]
    if current > 0 and stats["times"]:
        avg = sum(stats["times"][-20:]) / len(stats["times"][-20:])
        remaining = ((total - current) / QUESTIONS_PER_CALL) * avg
        eta = format_time(remaining)
    else:
        eta = "..."
    
    print(f"\r⏳ |{bar}| {current}/{total} ({percent:.1f}%) | {format_time(elapsed)} | ETA: {eta} | ❌{stats['failed']}   ", end='', flush=True)

def save_progress():
    with lock:
        if not generated_questions:
            return
        QUESTIONS_DIR.mkdir(parents=True, exist_ok=True)
        
        with open(QUESTIONS_DIR / "all_questions.json", 'w', encoding='utf-8') as f:
            json.dump(generated_questions, f, indent=2, ensure_ascii=False)
        
        # Group by subject
        by_subject = {}
        for q in generated_questions:
            s = q["subject"]
            by_subject.setdefault(s, []).append(q)
        
        for subject, qs in by_subject.items():
            fname = re.sub(r'[^a-z0-9]', '_', subject.lower()) + '.json'
            with open(QUESTIONS_DIR / fname, 'w', encoding='utf-8') as f:
                json.dump(qs, f, indent=2, ensure_ascii=False)
        
        # Index
        index = {
            "totalQuestions": len(generated_questions),
            "generatedAt": datetime.now().isoformat(),
            "subjects": [{"name": s, "count": len(qs)} for s, qs in by_subject.items()]
        }
        with open(QUESTIONS_DIR / "index.json", 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2)

def generate_batch(task):
    """Generate 5 questions in one API call."""
    model, subject, topic, subtopics = task
    difficulty = random.choice(["easy", "medium", "hard"])
    
    prompt = f"""Generate exactly {QUESTIONS_PER_CALL} unique MCQ questions for OSSC RI/AI exam.

Subject: {subject}
Topic: {topic}
Subtopics: {', '.join(subtopics)}
Difficulty: {difficulty}

Return a JSON array with {QUESTIONS_PER_CALL} questions in this format:
[
  {{"question": "Q1 text", "options": {{"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"}}, "correctAnswer": "A", "explanation": "Why A is correct"}},
  {{"question": "Q2 text", "options": {{"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"}}, "correctAnswer": "B", "explanation": "Why B is correct"}},
  ...
]

Requirements:
- Each question must be unique
- Suitable for Indian govt competitive exam
- Include solution steps for math questions
- Return ONLY the JSON array, no other text"""

    start = time.time()
    
    try:
        response = requests.post(
            OLLAMA_API,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.9, "num_predict": 2048}
            },
            timeout=90
        )
        
        elapsed = time.time() - start
        
        if response.status_code != 200:
            return [], elapsed
        
        text = response.json().get("response", "")
        questions = parse_questions(text)
        
        valid = []
        for q in questions:
            if not all(k in q for k in ["question", "options", "correctAnswer"]):
                continue
            
            h = get_hash(q["question"])
            with lock:
                if h in question_hashes:
                    stats["duplicates"] += 1
                    continue
                question_hashes.add(h)
            
            valid.append({
                "id": generate_id(),
                "subject": subject,
                "topic": topic,
                "subtopic": random.choice(subtopics),
                "difficulty": difficulty,
                "question": q["question"],
                "options": q["options"],
                "correctAnswer": q["correctAnswer"],
                "explanation": q.get("explanation", ""),
                "model": model,
                "generatedAt": datetime.now().isoformat()
            })
        
        return valid, elapsed
        
    except Exception as e:
        return [], time.time() - start

def main():
    global generated_questions, stats
    
    print("=" * 60)
    print("🚀 OSSC Question Generator - FAST MODE")
    print("=" * 60)
    print(f"📊 Target: {TARGET_QUESTIONS} questions")
    print(f"🤖 Models: {', '.join(MODELS)}")
    print(f"⚡ Workers: {MAX_WORKERS} | Batch size: {QUESTIONS_PER_CALL}")
    print("=" * 60)
    
    # Check Ollama
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        if r.status_code == 200:
            print("✅ Ollama connected")
        else:
            print("❌ Ollama error"); return
    except:
        print("❌ Cannot connect to Ollama. Run: ollama serve"); return
    
    # Load existing
    existing_file = QUESTIONS_DIR / "all_questions.json"
    if existing_file.exists():
        try:
            with open(existing_file, 'r', encoding='utf-8') as f:
                generated_questions = json.load(f)
                for q in generated_questions:
                    question_hashes.add(get_hash(q["question"]))
            print(f"📂 Loaded {len(generated_questions)} existing questions")
        except:
            pass
    
    remaining = TARGET_QUESTIONS - len(generated_questions)
    if remaining <= 0:
        print(f"✅ Already have {len(generated_questions)} questions!")
        return
    
    print(f"📝 Generating: {remaining} questions")
    print()
    
    # Create tasks - each task generates QUESTIONS_PER_CALL questions
    tasks = []
    batches_needed = (remaining // QUESTIONS_PER_CALL) + 10  # buffer
    
    for i in range(batches_needed):
        subject, topic, subtopics = random.choice(SYLLABUS)
        model = MODELS[i % len(MODELS)]
        tasks.append((model, subject, topic, subtopics))
    
    stats["start"] = time.time()
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        task_iter = iter(tasks)
        
        # Submit initial batch
        for _ in range(min(MAX_WORKERS * 2, len(tasks))):
            try:
                task = next(task_iter)
                futures[executor.submit(generate_batch, task)] = task
            except StopIteration:
                break
        
        save_counter = 0
        
        while futures and len(generated_questions) < TARGET_QUESTIONS:
            done = next(as_completed(futures))
            futures.pop(done)
            
            try:
                questions, elapsed = done.result()
                stats["times"].append(elapsed)
                
                if questions:
                    with lock:
                        generated_questions.extend(questions)
                        stats["generated"] += len(questions)
                    save_counter += len(questions)
                else:
                    stats["failed"] += 1
                
            except:
                stats["failed"] += 1
            
            print_progress()
            
            # Save periodically
            if save_counter >= SAVE_INTERVAL:
                save_progress()
                save_counter = 0
            
            # Submit new task
            if len(generated_questions) < TARGET_QUESTIONS:
                try:
                    task = next(task_iter)
                    futures[executor.submit(generate_batch, task)] = task
                except StopIteration:
                    pass
    
    save_progress()
    
    elapsed = time.time() - stats["start"]
    
    print("\n\n" + "=" * 60)
    print("✅ GENERATION COMPLETE!")
    print("=" * 60)
    print(f"📊 Total Questions: {len(generated_questions)}")
    print(f"⏱️  Time: {format_time(elapsed)}")
    print(f"⚡ Speed: {len(generated_questions)/elapsed*60:.0f} questions/min")
    print(f"❌ Failed batches: {stats['failed']}")
    print(f"🔄 Duplicates: {stats['duplicates']}")
    print(f"📁 Saved to: {QUESTIONS_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
