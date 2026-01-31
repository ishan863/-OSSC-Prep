# ============================================================
# ⚡ ULTRA-FAST OSSC Question Generator - Google Colab
# ============================================================
# Uses vLLM for 10-20x FASTER generation
# Target: 1000+ questions per hour
# ============================================================

# ==================== CELL 1: Install vLLM ====================
# vLLM is MUCH faster than regular transformers

!pip install vllm -q
!pip install ray -q

# ==================== CELL 2: Imports ====================

import json
import time
import random
import re
import hashlib
from datetime import datetime
from pathlib import Path
from google.colab import files

print("✅ Libraries imported!")

# ==================== CELL 3: Configuration ====================

TARGET_QUESTIONS = 10000
BATCH_SIZE = 10  # More questions per batch with vLLM
SAVE_INTERVAL = 100
OUTPUT_FILE = "ossc_10k_fast.json"

print(f"🎯 Target: {TARGET_QUESTIONS} questions")
print(f"📦 Batch: {BATCH_SIZE} questions per call")
print(f"⚡ Expected speed: 1000+ questions/hour")

# ==================== CELL 4: Syllabus (Condensed) ====================

SYLLABUS = [
    # Reasoning (25%)
    {"subject": "Reasoning", "topic": "Analogy", "subtopics": ["Word", "Number", "Letter"], "weight": 40},
    {"subject": "Reasoning", "topic": "Series", "subtopics": ["Number", "Letter", "Mixed"], "weight": 40},
    {"subject": "Reasoning", "topic": "Coding-Decoding", "subtopics": ["Letter", "Number", "Symbol"], "weight": 40},
    {"subject": "Reasoning", "topic": "Blood Relations", "subtopics": ["Direct", "Coded", "Family Tree"], "weight": 35},
    {"subject": "Reasoning", "topic": "Direction", "subtopics": ["Simple", "Complex", "Shadow"], "weight": 35},
    {"subject": "Reasoning", "topic": "Ranking", "subtopics": ["Linear", "Circular", "Position"], "weight": 35},
    {"subject": "Reasoning", "topic": "Syllogism", "subtopics": ["Basic", "Either-Or", "Possibility"], "weight": 40},
    {"subject": "Reasoning", "topic": "Venn Diagrams", "subtopics": ["Two", "Three Elements"], "weight": 30},
    {"subject": "Reasoning", "topic": "Puzzles", "subtopics": ["Seating", "Floor", "Scheduling"], "weight": 50},
    {"subject": "Reasoning", "topic": "Odd One Out", "subtopics": ["Word", "Number", "Letter"], "weight": 30},
    
    # Quantitative (25%)
    {"subject": "Quantitative", "topic": "Number System", "subtopics": ["HCF-LCM", "Divisibility", "Factors"], "weight": 45},
    {"subject": "Quantitative", "topic": "Percentage", "subtopics": ["Basic", "Successive", "Population"], "weight": 45},
    {"subject": "Quantitative", "topic": "Ratio", "subtopics": ["Simple", "Compound", "Partnership"], "weight": 45},
    {"subject": "Quantitative", "topic": "Average", "subtopics": ["Simple", "Weighted", "Age"], "weight": 40},
    {"subject": "Quantitative", "topic": "Profit Loss", "subtopics": ["Basic", "Discount", "Marked Price"], "weight": 50},
    {"subject": "Quantitative", "topic": "Interest", "subtopics": ["Simple", "Compound", "Difference"], "weight": 40},
    {"subject": "Quantitative", "topic": "Time Work", "subtopics": ["Basic", "Pipes", "Efficiency"], "weight": 45},
    {"subject": "Quantitative", "topic": "Speed Distance", "subtopics": ["Basic", "Trains", "Boats"], "weight": 50},
    {"subject": "Quantitative", "topic": "Mensuration", "subtopics": ["2D", "3D", "Mixed"], "weight": 45},
    {"subject": "Quantitative", "topic": "Algebra", "subtopics": ["Linear", "Quadratic", "Inequalities"], "weight": 35},
    
    # English (15%)
    {"subject": "English", "topic": "Grammar", "subtopics": ["Tenses", "Articles", "Prepositions"], "weight": 40},
    {"subject": "English", "topic": "Vocabulary", "subtopics": ["Synonyms", "Antonyms", "One Word"], "weight": 40},
    {"subject": "English", "topic": "Error Spotting", "subtopics": ["Grammar", "Spelling", "Usage"], "weight": 40},
    {"subject": "English", "topic": "Fill Blanks", "subtopics": ["Single", "Double", "Cloze"], "weight": 40},
    {"subject": "English", "topic": "Comprehension", "subtopics": ["Fact", "Inference", "Vocabulary"], "weight": 35},
    {"subject": "English", "topic": "Sentence", "subtopics": ["Rearrangement", "Correction"], "weight": 35},
    
    # General Knowledge (15%)
    {"subject": "GK", "topic": "History", "subtopics": ["Ancient", "Medieval", "Modern"], "weight": 50},
    {"subject": "GK", "topic": "Geography", "subtopics": ["Physical", "Economic", "World"], "weight": 45},
    {"subject": "GK", "topic": "Polity", "subtopics": ["Constitution", "Parliament", "Judiciary"], "weight": 45},
    {"subject": "GK", "topic": "Economy", "subtopics": ["Banking", "Budget", "Sectors"], "weight": 40},
    {"subject": "GK", "topic": "Science", "subtopics": ["Physics", "Chemistry", "Biology"], "weight": 45},
    {"subject": "GK", "topic": "Current Affairs", "subtopics": ["National", "International", "Sports"], "weight": 35},
    
    # Odisha GK (10%)
    {"subject": "Odisha GK", "topic": "History", "subtopics": ["Ancient", "Medieval", "Modern"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Geography", "subtopics": ["Rivers", "Districts", "Climate"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Culture", "subtopics": ["Temples", "Festivals", "Dance"], "weight": 40},
    {"subject": "Odisha GK", "topic": "Economy", "subtopics": ["Industries", "Minerals", "Agriculture"], "weight": 35},
    {"subject": "Odisha GK", "topic": "Polity", "subtopics": ["Legislature", "Administration"], "weight": 30},
    
    # Odia Language (10%)
    {"subject": "Odia", "topic": "Grammar", "subtopics": ["Sandhi", "Samas", "Karak"], "weight": 35},
    {"subject": "Odia", "topic": "Vocabulary", "subtopics": ["Synonyms", "Antonyms", "Idioms"], "weight": 35},
    {"subject": "Odia", "topic": "Literature", "subtopics": ["Ancient", "Modern", "Writers"], "weight": 35},
]

print(f"📚 Topics: {len(SYLLABUS)}")

# ==================== CELL 5: Load vLLM Model ====================

from vllm import LLM, SamplingParams

print("🔄 Loading model with vLLM (faster inference)...")

# vLLM loads and optimizes the model for fast inference
llm = LLM(
    model="mistralai/Mistral-7B-Instruct-v0.2",
    dtype="half",  # Use FP16 for speed
    gpu_memory_utilization=0.90,  # Use more GPU memory
    max_model_len=2048,
)

sampling_params = SamplingParams(
    temperature=0.8,
    top_p=0.9,
    max_tokens=1500,
)

print("✅ vLLM model loaded! Ready for fast generation.")

# ==================== CELL 6: Fast Generation Functions ====================

def generate_id():
    return f"q_{int(time.time()*1000)}_{random.randint(1000,9999)}"

def get_hash(text):
    return hashlib.md5(text.lower().strip()[:80].encode()).hexdigest()

def format_time(s):
    if s < 60: return f"{int(s)}s"
    if s < 3600: return f"{int(s//60)}m {int(s%60)}s"
    return f"{int(s//3600)}h {int((s%3600)//60)}m"

def create_prompt(topic_data, count=10):
    """Create a compact prompt for faster generation"""
    diff = random.choice(["easy", "medium", "hard"])
    sub = random.choice(topic_data["subtopics"])
    
    return f"""<s>[INST] Generate {count} MCQs for OSSC exam.
Subject: {topic_data["subject"]} | Topic: {topic_data["topic"]} | Subtopic: {sub} | Difficulty: {diff}

Return JSON array ONLY:
[{{"question":"Q1?","options":{{"A":"opt1","B":"opt2","C":"opt3","D":"opt4"}},"correctAnswer":"A","explanation":"why A"}},...]

{count} questions: [/INST]"""

def parse_response(text, topic_data):
    """Parse model output to questions"""
    questions = []
    
    # Extract JSON array
    try:
        match = re.search(r'\[[\s\S]*?\]', text)
        if match:
            arr = json.loads(match.group(0))
            for q in arr:
                if all(k in q for k in ["question", "options", "correctAnswer"]):
                    if isinstance(q["options"], dict) and len(q["options"]) == 4:
                        if q["correctAnswer"] in ["A", "B", "C", "D"]:
                            questions.append({
                                "id": generate_id(),
                                "subject": topic_data["subject"],
                                "topic": topic_data["topic"],
                                "subtopic": random.choice(topic_data["subtopics"]),
                                "difficulty": random.choice(["easy", "medium", "hard"]),
                                "question": q["question"],
                                "options": q["options"],
                                "correctAnswer": q["correctAnswer"],
                                "explanation": q.get("explanation", ""),
                                "generatedAt": datetime.now().isoformat()
                            })
    except:
        pass
    
    return questions

def save_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Saved {len(data)} questions to {filename}")

print("✅ Functions ready!")

# ==================== CELL 7: Batch Generation with vLLM ====================

def generate_batch_parallel(topics, batch_size=10, num_prompts=8):
    """Generate multiple batches in parallel using vLLM"""
    
    # Create multiple prompts
    prompts = []
    topic_refs = []
    
    for _ in range(num_prompts):
        topic = random.choices(topics, weights=[t["weight"] for t in topics])[0]
        prompts.append(create_prompt(topic, batch_size))
        topic_refs.append(topic)
    
    # Generate all at once (vLLM handles parallelism)
    outputs = llm.generate(prompts, sampling_params)
    
    # Parse results
    all_questions = []
    for output, topic in zip(outputs, topic_refs):
        text = output.outputs[0].text
        questions = parse_response(text, topic)
        all_questions.extend(questions)
    
    return all_questions

# Quick test
print("🧪 Testing parallel generation...")
test_qs = generate_batch_parallel(SYLLABUS, batch_size=5, num_prompts=2)
print(f"✅ Test: Generated {len(test_qs)} questions")
if test_qs:
    print(f"   Sample: {test_qs[0]['question'][:50]}...")

# ==================== CELL 8: Main Fast Generation Loop ====================

def run_fast_generation(target=10000, batch_size=10, num_parallel=8, save_every=100):
    """Ultra-fast generation using vLLM parallelism"""
    
    print("=" * 60)
    print("⚡ ULTRA-FAST OSSC Question Generator")
    print("=" * 60)
    print(f"🎯 Target: {target} questions")
    print(f"📦 Batch: {batch_size} per prompt × {num_parallel} parallel = {batch_size * num_parallel} per cycle")
    print(f"💾 Save every: {save_every}")
    print("=" * 60)
    
    all_questions = []
    hashes = set()
    stats = {"added": 0, "dupes": 0, "failed": 0}
    
    # Load existing
    if Path(OUTPUT_FILE).exists():
        try:
            with open(OUTPUT_FILE, 'r') as f:
                all_questions = json.load(f)
                for q in all_questions:
                    hashes.add(get_hash(q["question"]))
            print(f"📂 Loaded {len(all_questions)} existing questions")
        except:
            pass
    
    remaining = target - len(all_questions)
    if remaining <= 0:
        print(f"✅ Already have {len(all_questions)} questions!")
        return all_questions
    
    print(f"\n🚀 Generating {remaining} questions...\n")
    
    start = time.time()
    last_save = len(all_questions)
    cycle_times = []
    
    while len(all_questions) < target:
        cycle_start = time.time()
        
        # Generate batch
        try:
            new_qs = generate_batch_parallel(SYLLABUS, batch_size, num_parallel)
        except Exception as e:
            print(f"\n❌ Error: {str(e)[:50]}")
            stats["failed"] += 1
            continue
        
        # Add unique questions
        added = 0
        for q in new_qs:
            h = get_hash(q["question"])
            if h in hashes:
                stats["dupes"] += 1
                continue
            hashes.add(h)
            all_questions.append(q)
            added += 1
            stats["added"] += 1
        
        cycle_time = time.time() - cycle_start
        cycle_times.append(cycle_time)
        
        # Progress
        current = len(all_questions)
        pct = (current / target) * 100
        bar = '█' * int(30 * current // target) + '░' * (30 - int(30 * current // target))
        
        # ETA calculation
        if cycle_times:
            avg_time = sum(cycle_times[-20:]) / len(cycle_times[-20:])
            qs_per_cycle = (batch_size * num_parallel) * 0.7  # ~70% success rate
            remaining_cycles = (target - current) / max(qs_per_cycle, 1)
            eta = remaining_cycles * avg_time
            speed = (stats["added"] / max(time.time() - start, 1)) * 3600
            eta_str = format_time(eta)
        else:
            eta_str = "..."
            speed = 0
        
        print(f"\r⚡ |{bar}| {current}/{target} ({pct:.1f}%) | +{added} | {speed:.0f}/hr | ETA: {eta_str}   ", end='', flush=True)
        
        # Auto-save
        if current - last_save >= save_every:
            save_json(all_questions, OUTPUT_FILE)
            last_save = current
    
    # Final save
    save_json(all_questions, OUTPUT_FILE)
    
    # Stats
    elapsed = time.time() - start
    print("\n\n" + "=" * 60)
    print("✅ GENERATION COMPLETE!")
    print("=" * 60)
    print(f"📊 Total: {len(all_questions)} questions")
    print(f"⏱️  Time: {format_time(elapsed)}")
    print(f"⚡ Speed: {len(all_questions)/max(elapsed,1)*3600:.0f} questions/hour")
    print(f"🔄 Duplicates: {stats['dupes']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"📁 File: {OUTPUT_FILE}")
    print("=" * 60)
    
    return all_questions

# ==================== CELL 9: RUN FAST GENERATION ====================

questions = run_fast_generation(
    target=TARGET_QUESTIONS,
    batch_size=10,      # 10 questions per prompt
    num_parallel=8,     # 8 prompts in parallel = 80 questions per cycle
    save_every=100
)

# ==================== CELL 10: Download ====================

files.download(OUTPUT_FILE)

# Create subject-wise files
print("\n📂 Creating subject files...")
by_subj = {}
for q in questions:
    s = q["subject"]
    if s not in by_subj:
        by_subj[s] = []
    by_subj[s].append(q)

for s, qs in by_subj.items():
    fn = re.sub(r'[^a-z0-9]', '_', s.lower()) + '.json'
    with open(fn, 'w') as f:
        json.dump(qs, f, indent=2)
    print(f"   ✅ {fn}: {len(qs)}")
    files.download(fn)

print("\n✅ Done!")
