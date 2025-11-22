import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time
import traceback
import re
import sys

# ============================================
# LOAD ENVIRONMENT VARIABLES
# ============================================# ============================================
# LOAD ENVIRONMENT VARIABLES
# ============================================
# LOAD ENVIRONMENT VARIABLES
# ============================================
# For local development
if os.path.exists('.env'):
    load_dotenv('.env')
elif os.path.exists(r'C:\Users\VANSH\Desktop\SmartLearn_v2\.env'):
    load_dotenv(r'C:\Users\VANSH\Desktop\SmartLearn_v2\.env')
# For Render deployment, environment variables are set in dashboard (no .env file needed)

print("\n" + "="*70)
print("🚀 SMARTLEARN API - STARTUP SEQUENCE")
print("="*70 + "\n")
# ============================================
# MULTIPLE API KEYS SUPPORT (Up to 10 keys)
# ============================================
print("📡 [1/5] Loading API Keys...")
print("-" * 70)

API_KEYS = []
loaded_keys = []

# Try to load up to 10 API keys from environment
for i in range(1, 11):
    if i == 1:
        key = os.getenv("SMARTLEARN_API_KEY")
    else:
        key = os.getenv(f"SMARTLEARN_API_KEY_{i}")
    
    if key:
        API_KEYS.append(key)
        loaded_keys.append(f"Key {i}")
        print(f"   ✅ API Key {i}: {key[:18]}...{key[-6:]}")
    else:
        if i > 1:
            break

if not API_KEYS:
    print("\n❌ CRITICAL ERROR: No API keys found in .env!")
    print(f"   Expected .env at: {env_path}")
    sys.exit(1)

print(f"\n   ✅ Successfully loaded {len(API_KEYS)} API key(s)")
print("-" * 70 + "\n")

# Configure with first API key
current_api_key_index = 0
genai.configure(api_key=API_KEYS[current_api_key_index])

# ============================================
# LIST ALL AVAILABLE MODELS
# ============================================
print("🔍 [2/5] Discovering available models...\n")

def list_available_models():
    """List all models available"""
    available_models = []
    try:
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                model_name = model.name.replace('models/', '')
                available_models.append(model_name)
                print(f"   ✅ Found: {model_name}")
        return available_models
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        return []

AVAILABLE_MODELS = list_available_models()

if not AVAILABLE_MODELS:
    print("❌ NO MODELS AVAILABLE!")
    sys.exit(1)

print(f"\n✅ Found {len(AVAILABLE_MODELS)} model(s)")
print("-" * 70 + "\n")

AI_MODEL = None

# ============================================
# Rate Limiting & API Key Rotation
# ============================================
last_api_call = None
API_CALL_DELAY = 3

def switch_api_key():
    """Switch to next API key"""
    global current_api_key_index, API_KEYS
    if len(API_KEYS) < 2:
        return False
    current_api_key_index = (current_api_key_index + 1) % len(API_KEYS)
    genai.configure(api_key=API_KEYS[current_api_key_index])
    print(f"🔄 Switched to API Key {current_api_key_index + 1}/{len(API_KEYS)}")
    return True

def rate_limit_wait():
    """Wait between API calls"""
    global last_api_call
    if last_api_call:
        elapsed = time.time() - last_api_call
        if elapsed < API_CALL_DELAY:
            time.sleep(API_CALL_DELAY - elapsed)
    last_api_call = time.time()

# ============================================
# Find Working Model
# ============================================
print("⚡ [3/5] Selecting optimal model...\n")

def find_working_model():
    """Select best model"""
    global AI_MODEL
    if AI_MODEL:
        return AI_MODEL
    
    if not AVAILABLE_MODELS:
        return None
    
    model_priority = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro']
    
    for priority_model in model_priority:
        for available in AVAILABLE_MODELS:
            if priority_model in available.lower():
                AI_MODEL = available
                print(f"   ✅ Selected: {AI_MODEL}")
                return AI_MODEL
    
    AI_MODEL = AVAILABLE_MODELS[0]
    print(f"   ✅ Selected: {AI_MODEL}")
    return AI_MODEL

find_working_model()
print("-" * 70 + "\n")

print("✅ [4/5] System Ready\n")
print("="*70)

# ============================================
# HELPER FUNCTIONS FOR JSON CLEANING
# ============================================

def fix_unescaped_quotes(text):
    """Fix unescaped quotes in JSON strings"""
    # This regex finds quotes inside JSON string values and escapes them
    # Pattern: finds text between "key": " and the closing "
    def replace_quotes(match):
        content = match.group(1)
        # Replace internal quotes with escaped quotes
        fixed = content.replace('"', '\\"')
        return f'": "{fixed}"'
    
    # Fix quotes in JSON string values
    pattern = r'": "([^"]*(?:"[^"]*)*)"'
    result = re.sub(pattern, replace_quotes, text)
    return result

def aggressive_json_fix(text):
    """Aggressive JSON fixing"""
    # Remove all newlines and extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Try to extract just the array part
    if '[' in text and ']' in text:
        start = text.find('[')
        end = text.rfind(']') + 1
        text = text[start:end]
    
    # Replace curly quotes with straight quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace("'", "'").replace("'", "'")
    
    # Fix common issues
    text = text.replace('\n', ' ')
    text = text.replace('\r', ' ')
    text = text.replace('\t', ' ')
    
    return text

def clean_text(text):
    """Clean text for safe JSON"""
    if not isinstance(text, str):
        return str(text)
    
    # Remove problematic characters
    text = text.replace('\n', ' ')
    text = text.replace('\r', ' ')
    text = text.replace('\t', ' ')
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Limit length
    if len(text) > 500:
        text = text[:497] + '...'
    
    return text

# ============================================
# AI Call with Retry & Smart Key Rotation
# ============================================

def call_ai_with_retry(prompt, max_tokens=2000, max_retries=3):
    """Call AI with retry and key rotation"""
    
    if not AI_MODEL:
        find_working_model()
    
    if not AI_MODEL:
        return "Error: No AI model available"
    
    keys_tried = set()
    
    for attempt in range(max_retries):
        try:
            print(f"🔵 AI Call {attempt + 1}/{max_retries} (Model: {AI_MODEL}, Key: {current_api_key_index + 1})")
            
            rate_limit_wait()
            
            model = genai.GenerativeModel(AI_MODEL)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                )
            )
            
            if not response or not response.text:
                print("❌ Empty response")
                if attempt < max_retries - 1:
                    time.sleep(10)
                    continue
                return None
            
            result = response.text
            print(f"✅ Response: {len(result)} chars")
            return result
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Rate limit - try next key
            if '429' in error_str or 'quota' in error_str or 'rate' in error_str:
                print(f"⚠️ Rate limit hit")
                
                if len(API_KEYS) > 1 and current_api_key_index not in keys_tried:
                    keys_tried.add(current_api_key_index)
                    if switch_api_key():
                        print(f"   Retrying with new key...")
                        time.sleep(5)
                        continue
                
                wait_time = 60
                print(f"   Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            # Invalid key
            elif '401' in error_str or 'invalid' in error_str:
                print(f"❌ Invalid API key")
                if len(API_KEYS) > 1 and current_api_key_index not in keys_tried:
                    keys_tried.add(current_api_key_index)
                    if switch_api_key():
                        time.sleep(2)
                        continue
                return "Error: Invalid API key"
            
            # Other errors
            else:
                print(f"❌ Error: {str(e)[:100]}")
                if attempt < max_retries - 1:
                    time.sleep(10)
                    continue
            
            return f"Error: {str(e)[:100]}"
    
    return "Error: Request failed after retries"

# ============================================
# JSON Cleaning
# ============================================

def clean_ai_json(text):
    """Clean AI JSON response"""
    # Remove markdown
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]
    
    text = text.strip()
    
    # Remove newlines
    text = text.replace('\n', ' ')
    text = text.replace('\r', ' ')
    text = text.replace('\t', ' ')
    text = re.sub(r'\s+', ' ', text)
    
    return text

# ============================================
# Basic Query
# ============================================

def ask_ai(prompt, max_tokens=2000):
    """Basic AI query"""
    print(f"🔵 ask_ai: {len(prompt)} chars")
    result = call_ai_with_retry(prompt, max_tokens)
    
    if not result or result.startswith("Error:"):
        print("❌ ask_ai failed")
        return result or "Failed to get response"
    
    print(f"✅ ask_ai success")
    return result

# ============================================
# FLASHCARDS - AI GENERATED (NO HARDCODING)
# ============================================

def generate_flashcards_ai(topic, content):
    """Generate 6 AI flashcards - NO HARDCODING"""
    print(f"🔵 Flashcards: {topic}")
    
    # ✅ ULTRA STRICT PROMPT - Prevents JSON errors
    prompt = f"""You are creating study flashcards. Topic: {topic}

Reference content: {content[:1000]}

CRITICAL INSTRUCTIONS:
1. Create exactly 6 flashcards
2. Return ONLY a JSON array - NO other text
3. Use ONLY simple text - NO quotes inside answers
4. Keep answers SHORT (max 50 words each)
5. NO line breaks in text
6. Replace all quotes with apostrophes

EXACT JSON FORMAT REQUIRED:
[
  {{"q": "Question 1 about {topic}", "a": "Short answer without quotes", "type": "definition"}},
  {{"q": "Question 2 about {topic}", "a": "Short answer without quotes", "type": "keypoints"}},
  {{"q": "Question 3 about {topic}", "a": "Short answer without quotes", "type": "process"}},
  {{"q": "Question 4 about {topic}", "a": "Short answer without quotes", "type": "keypoints"}},
  {{"q": "Question 5 about {topic}", "a": "Short answer without quotes", "type": "definition"}},
  {{"q": "Question 6 about {topic}", "a": "Short answer without quotes", "type": "process"}}
]

Generate 6 flashcards about {topic}. Return ONLY the JSON array above."""

    try:
        result = call_ai_with_retry(prompt, 2000)
        
        if not result or result.startswith("Error:"):
            print("❌ API call failed")
            return None
        
        # ✅ AGGRESSIVE CLEANING
        result = clean_ai_json(result)
        
        # ✅ FIX: Remove problematic characters
        # Replace curly quotes
        result = result.replace('"', '"').replace('"', '"')
        result = result.replace("'", "'").replace("'", "'")
        
        # ✅ FIX: Extract only the JSON array
        if '[' in result and ']' in result:
            start = result.find('[')
            end = result.rfind(']') + 1
            result = result[start:end]
        
        print(f"🔵 Cleaned JSON length: {len(result)} chars")
        print(f"🔵 First 200 chars: {result[:200]}")
        
        # ✅ PARSE JSON
        try:
            flashcards = json.loads(result)
        except json.JSONDecodeError as je:
            print(f"❌ JSON Parse Error at char {je.pos}")
            print(f"🔴 Error area: {result[max(0, je.pos-50):min(len(result), je.pos+50)]}")
            
            # ✅ LAST RESORT: Aggressive fix
            print("🔧 Attempting aggressive fix...")
            result = aggressive_json_fix(result)
            try:
                flashcards = json.loads(result)
                print("✅ Aggressive fix worked!")
            except:
                print("❌ Aggressive fix failed")
                return None
        
        # ✅ VALIDATE
        if not isinstance(flashcards, list):
            print(f"❌ Not a list: {type(flashcards)}")
            return None
        
        if len(flashcards) < 3:
            print(f"❌ Too few flashcards: {len(flashcards)}")
            return None
        
        # ✅ CLEAN EACH FLASHCARD
        valid_flashcards = []
        for fc in flashcards:
            if isinstance(fc, dict) and 'q' in fc and 'a' in fc:
                fc['q'] = clean_text(fc.get('q', ''))
                fc['a'] = clean_text(fc.get('a', ''))
                fc['type'] = fc.get('type', 'definition')
                
                # Only add if both q and a are non-empty
                if fc['q'] and fc['a']:
                    valid_flashcards.append(fc)
        
        if len(valid_flashcards) == 0:
            print(f"❌ No valid flashcards after cleaning")
            return None
        
        print(f"✅ Generated {len(valid_flashcards)} AI flashcards")
        return json.dumps(valid_flashcards)
        
    except Exception as e:
        print(f"❌ Flashcard error: {e}")
        traceback.print_exc()
        return None

# ============================================
# MCQs - AI GENERATED (BULLETPROOF)
# ============================================

def generate_mcqs_ai(topic, content):
    """Generate 7 AI MCQs - BULLETPROOF JSON"""
    print(f"🔵 MCQs: {topic}")
    
    # ✅ ULTRA STRICT PROMPT - Same as flashcards
    prompt = f"""You are creating multiple choice questions. Topic: {topic}

Reference content: {content[:1000]}

CRITICAL INSTRUCTIONS:
1. Create exactly 7 MCQs
2. Return ONLY a JSON array - NO other text
3. Use ONLY simple text - NO quotes inside questions or options
4. Keep options SHORT (max 8 words each)
5. NO line breaks in text
6. Replace all quotes with apostrophes
7. Answer index must be 0, 1, 2, or 3

EXACT JSON FORMAT REQUIRED:
[
  {{"q": "Question 1 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 0, "explanation": "Why correct"}},
  {{"q": "Question 2 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 1, "explanation": "Why correct"}},
  {{"q": "Question 3 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 2, "explanation": "Why correct"}},
  {{"q": "Question 4 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 3, "explanation": "Why correct"}},
  {{"q": "Question 5 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 0, "explanation": "Why correct"}},
  {{"q": "Question 6 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 1, "explanation": "Why correct"}},
  {{"q": "Question 7 about {topic}", "opts": ["Option A", "Option B", "Option C", "Option D"], "ans": 2, "explanation": "Why correct"}}
]

Generate 7 MCQs about {topic}. Return ONLY the JSON array above."""

    try:
        result = call_ai_with_retry(prompt, 2500)
        
        if not result or result.startswith("Error:"):
            print("❌ API call failed")
            return None
        
        # ✅ AGGRESSIVE CLEANING (Same as flashcards)
        result = clean_ai_json(result)
        
        # ✅ FIX: Remove problematic characters
        result = result.replace('"', '"').replace('"', '"')
        result = result.replace("'", "'").replace("'", "'")
        
        # ✅ FIX: Extract only the JSON array
        if '[' in result and ']' in result:
            start = result.find('[')
            end = result.rfind(']') + 1
            result = result[start:end]
        
        print(f"🔵 Cleaned JSON length: {len(result)} chars")
        print(f"🔵 First 200 chars: {result[:200]}")
        
        # ✅ PARSE JSON
        try:
            mcqs = json.loads(result)
        except json.JSONDecodeError as je:
            print(f"❌ JSON Parse Error at char {je.pos}")
            print(f"🔴 Error area: {result[max(0, je.pos-50):min(len(result), je.pos+50)]}")
            
            # ✅ LAST RESORT: Aggressive fix
            print("🔧 Attempting aggressive fix...")
            result = aggressive_json_fix(result)
            try:
                mcqs = json.loads(result)
                print("✅ Aggressive fix worked!")
            except:
                print("❌ Aggressive fix failed")
                return None
        
        # ✅ VALIDATE
        if not isinstance(mcqs, list):
            print(f"❌ Not a list: {type(mcqs)}")
            return None
        
        if len(mcqs) < 3:
            print(f"❌ Too few MCQs: {len(mcqs)}")
            return None
        
        # ✅ CLEAN AND VALIDATE EACH MCQ
        valid_mcqs = []
        for mcq in mcqs:
            if isinstance(mcq, dict) and all(k in mcq for k in ['q', 'opts', 'ans']):
                # Validate structure
                if not isinstance(mcq['opts'], list) or len(mcq['opts']) != 4:
                    print(f"⚠️ Skipping invalid MCQ: wrong options count")
                    continue
                
                if not isinstance(mcq['ans'], int) or not (0 <= mcq['ans'] <= 3):
                    print(f"⚠️ Skipping invalid MCQ: invalid answer index")
                    continue
                
                # Clean text
                mcq['q'] = clean_text(mcq.get('q', ''))
                mcq['opts'] = [clean_text(opt) for opt in mcq['opts']]
                mcq['explanation'] = clean_text(mcq.get('explanation', 'Correct answer'))
                
                # Only add if question and all options are non-empty
                if mcq['q'] and all(mcq['opts']):
                    valid_mcqs.append(mcq)
        
        if len(valid_mcqs) == 0:
            print(f"❌ No valid MCQs after validation")
            return None
        
        print(f"✅ Generated {len(valid_mcqs)} AI MCQs")
        return json.dumps(valid_mcqs)
        
    except Exception as e:
        print(f"❌ MCQ error: {e}")
        traceback.print_exc()
        return None

# ============================================
# Keywords - AI GENERATED
# ============================================

def extract_keywords_ai(topic, content):
    """Extract keywords"""
    print(f"🔵 Keywords: {topic}")
    
    prompt = f"""Extract 6 key terms about: {topic}

Content: {content[:1000]}

Return ONLY valid JSON array (NO markdown):
[{{"k":"Term 1","d":"Short definition"}},{{"k":"Term 2","d":"Brief explanation"}}]

Keep definitions SHORT (max 60 chars). Return ONLY JSON."""

    try:
        result = call_ai_with_retry(prompt, 1500)
        
        if not result or result.startswith("Error:"):
            return None
        
        result = clean_ai_json(result)
        
        # Extract JSON array
        if '[' in result and ']' in result:
            start = result.find('[')
            end = result.rfind(']') + 1
            result = result[start:end]
        
        keywords = json.loads(result)
        
        if isinstance(keywords, list) and len(keywords) > 0:
            valid_keywords = []
            for kw in keywords:
                if 'k' in kw and 'd' in kw:
                    kw['k'] = clean_text(kw['k'])
                    kw['d'] = clean_text(kw['d'])[:120]
                    valid_keywords.append(kw)
            
            if valid_keywords:
                print(f"✅ {len(valid_keywords)} keywords")
                return json.dumps(valid_keywords)
        
        return None
        
    except Exception as e:
        print(f"❌ Keyword error: {e}")
        return None

print("\n" + "="*70)
print("🚀 SmartLearn API Ready")
print(f"📊 {len(API_KEYS)} API key(s) configured")
print(f"🤖 Model: {AI_MODEL}")
print("="*70 + "\n")