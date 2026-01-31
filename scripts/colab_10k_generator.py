# ============================================================
# 🚀 OSSC RI/AI 10,000 Question Generator - Google Colab
# ============================================================
# Just copy-paste each cell into Colab and run!
# ============================================================

#@title **CELL 1: Install Dependencies** { display-mode: "form" }
# Run this first!
!pip install transformers accelerate bitsandbytes sentencepiece -q
print("✅ Dependencies installed!")

#@title **CELL 2: Import Libraries & Setup** { display-mode: "form" }
import json, time, random, re, hashlib, torch
from datetime import datetime
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from google.colab import files
import warnings
warnings.filterwarnings('ignore')

# Configuration
TARGET = 10000
BATCH_SIZE = 5
SAVE_EVERY = 50
MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

print(f"📊 Target: {TARGET} questions")
print(f"📦 Batch: {BATCH_SIZE} per call")

#@title **CELL 3: Complete OSSC Syllabus (All Topics)** { display-mode: "form" }
SYLLABUS = [
    # REASONING (25%)
    ("Reasoning & Mental Ability", "Analogy", ["Word", "Number", "Letter", "Mixed"], 40),
    ("Reasoning & Mental Ability", "Series Completion", ["Number", "Letter", "Alpha-Numeric"], 40),
    ("Reasoning & Mental Ability", "Coding-Decoding", ["Letter", "Number", "Mixed", "Symbol"], 40),
    ("Reasoning & Mental Ability", "Blood Relations", ["Direct", "Coded", "Family Tree"], 35),
    ("Reasoning & Mental Ability", "Direction & Distance", ["Simple", "Complex", "Shadow"], 35),
    ("Reasoning & Mental Ability", "Ranking & Order", ["Linear", "Circular", "Position"], 35),
    ("Reasoning & Mental Ability", "Syllogism", ["Basic", "Either-Or", "Possibility"], 40),
    ("Reasoning & Mental Ability", "Venn Diagrams", ["Two Sets", "Three Sets"], 30),
    ("Reasoning & Mental Ability", "Puzzles", ["Seating", "Floor", "Scheduling", "Box"], 50),
    ("Reasoning & Mental Ability", "Statement-Conclusion", ["Conclusion", "Assumption", "Argument"], 40),
    ("Reasoning & Mental Ability", "Non-Verbal", ["Figure Series", "Mirror", "Paper Folding"], 35),
    ("Reasoning & Mental Ability", "Odd One Out", ["Word", "Number", "Letter"], 30),
    ("Reasoning & Mental Ability", "Classification", ["Word", "Number", "Letter"], 25),
    
    # QUANTITATIVE (25%)
    ("Quantitative Aptitude", "Number System", ["HCF LCM", "Divisibility", "Unit Digit", "Factors"], 45),
    ("Quantitative Aptitude", "Simplification", ["BODMAS", "Fractions", "Decimals", "Surds"], 40),
    ("Quantitative Aptitude", "Percentage", ["Basic", "Successive", "Population", "Price"], 45),
    ("Quantitative Aptitude", "Ratio & Proportion", ["Simple", "Compound", "Partnership", "Mixture"], 45),
    ("Quantitative Aptitude", "Average", ["Simple", "Weighted", "Age Problems"], 40),
    ("Quantitative Aptitude", "Profit & Loss", ["Basic P&L", "Discount", "Marked Price"], 50),
    ("Quantitative Aptitude", "Simple Interest", ["Basic SI", "Rate", "Time"], 35),
    ("Quantitative Aptitude", "Compound Interest", ["Basic CI", "Half-yearly", "Difference"], 40),
    ("Quantitative Aptitude", "Time & Work", ["Basic Work", "Pipes", "Efficiency", "Wages"], 45),
    ("Quantitative Aptitude", "Time Speed Distance", ["Basic TSD", "Trains", "Boats", "Relative"], 50),
    ("Quantitative Aptitude", "Mensuration 2D", ["Rectangle", "Circle", "Triangle", "Trapezium"], 45),
    ("Quantitative Aptitude", "Mensuration 3D", ["Cube", "Cylinder", "Cone", "Sphere"], 40),
    ("Quantitative Aptitude", "Geometry", ["Lines Angles", "Triangles", "Circles"], 40),
    ("Quantitative Aptitude", "Data Interpretation", ["Tables", "Bar", "Pie", "Line"], 45),
    ("Quantitative Aptitude", "Algebra", ["Linear", "Quadratic", "Inequalities"], 35),
    ("Quantitative Aptitude", "Probability", ["Basic", "Dice", "Cards", "Coins"], 30),
    
    # ENGLISH (15%)
    ("English Language", "Grammar - Tenses", ["Present", "Past", "Future", "Mixed"], 40),
    ("English Language", "Grammar - Parts of Speech", ["Articles", "Prepositions", "Conjunctions"], 40),
    ("English Language", "Subject-Verb Agreement", ["Singular-Plural", "Collective", "Compound"], 35),
    ("English Language", "Synonyms", ["Common", "Advanced", "Contextual"], 40),
    ("English Language", "Antonyms", ["Common", "Advanced", "Contextual"], 40),
    ("English Language", "One Word Substitution", ["People", "Places", "Actions"], 35),
    ("English Language", "Idioms & Phrases", ["Common Idioms", "Proverbs", "Phrasal Verbs"], 35),
    ("English Language", "Error Spotting", ["Grammar", "Spelling", "Punctuation"], 40),
    ("English Language", "Sentence Correction", ["Grammar", "Word Usage", "Structure"], 35),
    ("English Language", "Fill in Blanks", ["Single", "Double", "Cloze"], 40),
    ("English Language", "Sentence Rearrangement", ["Para Jumbles", "Sequencing"], 35),
    ("English Language", "Reading Comprehension", ["Fact Based", "Inference", "Theme"], 40),
    ("English Language", "Active-Passive Voice", ["Simple", "Complex", "Interrogative"], 30),
    ("English Language", "Direct-Indirect Speech", ["Statements", "Questions", "Commands"], 30),
    
    # GENERAL KNOWLEDGE (15%)
    ("General Knowledge", "Ancient Indian History", ["Indus Valley", "Vedic", "Maurya", "Gupta"], 45),
    ("General Knowledge", "Medieval Indian History", ["Sultanate", "Mughal", "Vijayanagara", "Maratha"], 45),
    ("General Knowledge", "Modern Indian History", ["British Rule", "Freedom Struggle", "Constitution"], 50),
    ("General Knowledge", "Indian Geography Physical", ["Mountains", "Rivers", "Climate", "Plateaus"], 45),
    ("General Knowledge", "Indian Geography Economic", ["Agriculture", "Industries", "Minerals"], 40),
    ("General Knowledge", "World Geography", ["Continents", "Oceans", "Countries", "Climate"], 35),
    ("General Knowledge", "Indian Constitution", ["Preamble", "Fundamental Rights", "DPSP", "Amendments"], 50),
    ("General Knowledge", "Indian Polity Parliament", ["Lok Sabha", "Rajya Sabha", "Bills"], 45),
    ("General Knowledge", "Indian Polity Executive", ["President", "PM", "Council of Ministers"], 40),
    ("General Knowledge", "Indian Polity Judiciary", ["Supreme Court", "High Courts", "Judicial Review"], 40),
    ("General Knowledge", "Indian Economy Basics", ["GDP", "National Income", "Planning"], 40),
    ("General Knowledge", "Indian Economy Banking", ["RBI", "Banks", "Monetary Policy"], 45),
    ("General Knowledge", "Physics", ["Motion", "Energy", "Light", "Sound", "Electricity"], 45),
    ("General Knowledge", "Chemistry", ["Elements", "Acids Bases", "Reactions", "Organic"], 45),
    ("General Knowledge", "Biology", ["Cell", "Human Body", "Diseases", "Genetics"], 45),
    ("General Knowledge", "Computer Science", ["Basics", "Hardware", "Software", "Internet"], 35),
    ("General Knowledge", "Current Affairs", ["National", "International", "Sports", "Awards"], 40),
    
    # ODISHA GK (10%)
    ("Odisha GK", "Ancient Odisha History", ["Kalinga War", "Kharavela", "Eastern Ganga"], 35),
    ("Odisha GK", "Medieval Odisha History", ["Gajapati", "Suryavamsi", "Mughal Rule"], 30),
    ("Odisha GK", "Modern Odisha History", ["British Rule", "Paika Rebellion", "Freedom Movement"], 40),
    ("Odisha GK", "Odisha Geography Physical", ["Rivers", "Mountains", "Climate", "Forests"], 40),
    ("Odisha GK", "Odisha Geography Districts", ["30 Districts", "Headquarters", "Boundaries"], 35),
    ("Odisha GK", "Odisha Culture Temples", ["Jagannath", "Konark", "Lingaraj", "Others"], 40),
    ("Odisha GK", "Odisha Culture Festivals", ["Rath Yatra", "Raja", "Durga Puja", "Kartik"], 35),
    ("Odisha GK", "Odisha Culture Dance Art", ["Odissi", "Gotipua", "Pattachitra", "Filigree"], 35),
    ("Odisha GK", "Odisha Economy Agriculture", ["Crops", "Irrigation", "Schemes"], 30),
    ("Odisha GK", "Odisha Economy Industries", ["Major Industries", "Mining", "Steel"], 35),
    ("Odisha GK", "Odisha Economy Minerals", ["Iron", "Coal", "Bauxite", "Chromite"], 30),
    ("Odisha GK", "Odisha Polity", ["Legislature", "Governor CM", "High Court", "Panchayati Raj"], 35),
    ("Odisha GK", "Odisha Personalities", ["Writers", "Freedom Fighters", "Reformers"], 35),
    ("Odisha GK", "Odisha Current Affairs", ["Schemes", "Events", "Sports", "Awards"], 30),
    
    # ODIA LANGUAGE (10%)
    ("Odia Language", "Odia Grammar Sandhi", ["Swar", "Vyanjan", "Visarga"], 30),
    ("Odia Language", "Odia Grammar Samas", ["Tatpurusha", "Dwandwa", "Bahubrihi"], 30),
    ("Odia Language", "Odia Grammar Karak", ["Seven Karaks", "Vibhakti"], 25),
    ("Odia Language", "Odia Vocabulary Synonyms", ["Common", "Literary"], 30),
    ("Odia Language", "Odia Vocabulary Antonyms", ["Common", "Literary"], 30),
    ("Odia Language", "Odia One Word Substitution", ["Common", "Literary"], 25),
    ("Odia Language", "Odia Idioms Proverbs", ["Idioms", "Proverbs"], 30),
    ("Odia Language", "Odia Comprehension", ["Passage", "Summary"], 25),
    ("Odia Language", "Odia Literature Ancient", ["Sarala Das", "Jagannath Das"], 30),
    ("Odia Language", "Odia Literature Modern", ["Fakir Mohan", "Radhanath", "Gopabandhu"], 35),
]

print(f"📚 Total topics: {len(SYLLABUS)}")

#@title **CELL 4: Load Model** { display-mode: "form" }
print("🔄 Loading model... (takes 2-5 minutes)")

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

print("✅ Model loaded!")

#@title **CELL 5: Helper Functions** { display-mode: "form" }
def gen_id():
    return f"q_{int(time.time()*1000)}_{random.randint(1000,9999)}"

def get_hash(t):
    return hashlib.md5(t.lower().strip()[:100].encode()).hexdigest()

def fmt_time(s):
    if s < 60: return f"{int(s)}s"
    if s < 3600: return f"{int(s//60)}m {int(s%60)}s"
    return f"{int(s//3600)}h {int((s%3600)//60)}m"

def parse_qs(text):
    qs = []
    try:
        m = re.search(r'\[[\s\S]*\]', text)
        if m:
            arr = json.loads(m.group(0))
            if isinstance(arr, list): return arr
    except: pass
    
    for m in re.finditer(r'\{[^{}]*"question"[^{}]*\}', text, re.DOTALL):
        try:
            o = json.loads(m.group(0))
            if "question" in o and "options" in o: qs.append(o)
        except: pass
    return qs

def gen_batch(topic, n=5):
    subj, top, subs, _ = topic
    diff = random.choice(["easy", "medium", "hard"])
    sub = random.choice(subs)
    
    prompt = f"""<s>[INST] Generate {n} unique MCQs for OSSC RI/AI exam.
Subject: {subj} | Topic: {top} | Subtopic: {sub} | Difficulty: {diff}

Return JSON array:
[{{"question": "Q?", "options": {{"A": "", "B": "", "C": "", "D": ""}}, "correctAnswer": "A", "explanation": "Why"}}]

Requirements: 4 options each, one correct answer, include explanation.
[/INST]"""

    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(model.device)
        with torch.no_grad():
            out = model.generate(**inputs, max_new_tokens=1500, temperature=0.8, do_sample=True, top_p=0.9, pad_token_id=tokenizer.eos_token_id)
        resp = tokenizer.decode(out[0], skip_special_tokens=True)
        if "[/INST]" in resp: resp = resp.split("[/INST]")[-1]
        
        valid = []
        for q in parse_qs(resp):
            if not all(k in q for k in ["question", "options", "correctAnswer"]): continue
            if q["correctAnswer"] not in "ABCD": continue
            valid.append({
                "id": gen_id(), "subject": subj, "topic": top, "subtopic": sub,
                "difficulty": diff, "question": q["question"], "options": q["options"],
                "correctAnswer": q["correctAnswer"], "explanation": q.get("explanation", ""),
                "generatedAt": datetime.now().isoformat()
            })
        return valid
    except: return []

print("✅ Functions ready!")

#@title **CELL 6: 🚀 START GENERATION (Run This!)** { display-mode: "form" }
# Main generation loop

print("="*60)
print("🚀 OSSC 10K Question Generator")
print("="*60)

all_qs = []
hashes = set()
stats = {"gen": 0, "dup": 0, "fail": 0}
OUTPUT = "ossc_10k_questions.json"

# Load existing
if Path(OUTPUT).exists():
    try:
        with open(OUTPUT) as f:
            all_qs = json.load(f)
            for q in all_qs: hashes.add(get_hash(q["question"]))
        print(f"📂 Loaded {len(all_qs)} existing")
    except: pass

remaining = TARGET - len(all_qs)
if remaining <= 0:
    print(f"✅ Already have {len(all_qs)} questions!")
else:
    print(f"📝 Generating {remaining} questions...\n")
    
    start = time.time()
    times = []
    last_save = len(all_qs)
    weights = [t[3] for t in SYLLABUS]
    
    while len(all_qs) < TARGET:
        t0 = time.time()
        topic = random.choices(SYLLABUS, weights=weights)[0]
        qs = gen_batch(topic, BATCH_SIZE)
        times.append(time.time() - t0)
        
        added = 0
        for q in qs:
            h = get_hash(q["question"])
            if h in hashes:
                stats["dup"] += 1
                continue
            hashes.add(h)
            all_qs.append(q)
            added += 1
        
        stats["gen"] += added
        if not qs: stats["fail"] += 1
        
        # Progress
        cur = len(all_qs)
        pct = cur/TARGET*100
        bar = '█'*int(30*cur//TARGET) + '░'*(30-int(30*cur//TARGET))
        eta = fmt_time(((TARGET-cur)/BATCH_SIZE)*sum(times[-20:])/max(len(times[-20:]),1)) if times else "..."
        print(f"\r⏳ |{bar}| {cur}/{TARGET} ({pct:.1f}%) ETA:{eta} +{added}", end='', flush=True)
        
        # Save
        if cur - last_save >= SAVE_EVERY:
            with open(OUTPUT, 'w') as f: json.dump(all_qs, f, indent=2, ensure_ascii=False)
            last_save = cur
    
    # Final save
    with open(OUTPUT, 'w') as f: json.dump(all_qs, f, indent=2, ensure_ascii=False)
    
    elapsed = time.time() - start
    print(f"\n\n{'='*60}")
    print(f"✅ COMPLETE! {len(all_qs)} questions")
    print(f"⏱️  Time: {fmt_time(elapsed)} | Speed: {len(all_qs)/elapsed*60:.0f}/min")
    print(f"🔄 Duplicates: {stats['dup']} | ❌ Failed: {stats['fail']}")
    print(f"📁 Saved: {OUTPUT}")

#@title **CELL 7: 📥 Download Results** { display-mode: "form" }
from google.colab import files

# Download main file
files.download("ossc_10k_questions.json")

# Create subject-wise files
print("\n📂 Creating subject files...")
by_subj = {}
for q in all_qs:
    s = q["subject"]
    by_subj.setdefault(s, []).append(q)

for subj, qs in by_subj.items():
    fn = re.sub(r'[^a-z0-9]', '_', subj.lower()) + '.json'
    with open(fn, 'w') as f: json.dump(qs, f, indent=2, ensure_ascii=False)
    print(f"   {fn}: {len(qs)}")
    files.download(fn)

print("\n✅ Done! Check Downloads folder.")
