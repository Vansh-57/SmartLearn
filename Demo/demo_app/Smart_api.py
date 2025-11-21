import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time
import traceback
import re

load_dotenv(r'C:\Users\VANSH\Desktop\Demo\.env')

API_KEY = os.getenv("SMARTLEARN_API_KEY")

print("="*50)
print("🔑 API_KEY =", API_KEY[:20] + "..." if API_KEY else "❌ NO API KEY FOUND") 
print("="*50)

if not API_KEY:
    print("❌ CRITICAL: No API key found!")
    exit(1)

genai.configure(api_key=API_KEY)

# ============================================
# LIST ALL AVAILABLE MODELS
# ============================================
def list_available_models():
    """List all models available for your API key"""
    print("\n🔍 Discovering available models...\n")
    available_models = []
    
    try:
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                model_name = model.name.replace('models/', '')
                available_models.append(model_name)
                print(f"   ✅ Found: {model_name}")
        
        if not available_models:
            print("   ❌ No models found!")
        
        return available_models
        
    except Exception as e:
        print(f"   ❌ Error listing models: {e}")
        return []

# Get available models
AVAILABLE_MODELS = list_available_models()

if not AVAILABLE_MODELS:
    print("\n⚠️ NO MODELS AVAILABLE!")
    print("Possible issues:")
    print("1. API key is invalid or expired")
    print("2. API key doesn't have access to Gemini models")
    print("3. Network/firewall blocking access")
    print("\nTry:")
    print("- Create a NEW API key at: https://aistudio.google.com/app/apikey")
    print("- Make sure you're using a Google account with Gemini access")
    
    # Use fallback for development
    AVAILABLE_MODELS = ['gemini-pro']
    print(f"\n⚠️ Using fallback model: {AVAILABLE_MODELS[0]}")

AI_MODEL = None

# ============================================
# Rate Limiting
# ============================================
last_api_call = None
API_CALL_DELAY = 10  # 10 seconds between calls

def rate_limit_wait():
    """Wait between API calls"""
    global last_api_call
    if last_api_call:
        elapsed = time.time() - last_api_call
        if elapsed < API_CALL_DELAY:
            wait = API_CALL_DELAY - elapsed
            print(f"⏳ Waiting {wait:.1f}s...")
            time.sleep(wait)
    last_api_call = time.time()

# ============================================
# Find Working Model
# ============================================
def find_working_model():
    """Find first working model from available list"""
    global AI_MODEL
    
    if AI_MODEL:
        return AI_MODEL
    
    print("\n🔍 Testing available models...\n")
    
    for model_name in AVAILABLE_MODELS:
        try:
            print(f"   Testing: {model_name}...", end=" ", flush=True)
            
            time.sleep(3)  # Rate limit during testing
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                "Say hello",
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=10,
                    temperature=0.7,
                )
            )
            
            if response and response.text:
                AI_MODEL = model_name
                print(f"✅ WORKS!")
                print(f"\n{'='*50}")
                print(f"✅ USING MODEL: {AI_MODEL}")
                print(f"{'='*50}\n")
                return AI_MODEL
                
        except Exception as e:
            error_str = str(e)
            if '429' in error_str:
                print(f"❌ Rate limit - waiting...")
                time.sleep(60)
            elif '404' in error_str:
                print(f"❌ Not found")
            else:
                print(f"❌ {error_str[:40]}")
            continue
    
    print("\n❌ NO WORKING MODEL!")
    return None

# Try to find working model on startup
find_working_model()

# ============================================
# AI Call with Retry
# ============================================
def call_ai_with_retry(prompt, max_tokens=2000, max_retries=2):
    """Call AI with retry"""
    
    if not AI_MODEL:
        find_working_model()
    
    if not AI_MODEL:
        print("❌ No working model available")
        return "Error: No AI model available. Please check your API key."
    
    for attempt in range(max_retries):
        try:
            print(f"🔵 AI Call {attempt + 1}/{max_retries} (Model: {AI_MODEL})")
            
            # Rate limiting
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
            print(f"❌ Error: {str(e)[:100]}")
            
            # Rate limit
            if '429' in error_str or 'quota' in error_str:
                wait_time = 60 if attempt == 0 else 120
                print(f"⏳ Rate limit! Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            # Retry on other errors
            if attempt < max_retries - 1:
                time.sleep(15)
                continue
            
            return f"Error: {str(e)[:100]}"
    
    return "Error: AI request failed after retries"

# ============================================
# JSON Cleaning
# ============================================
def clean_ai_json(text):
    """Clean AI JSON response"""
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]
    
    text = text.strip()
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
        return result or "Failed to get response. Please try again."
    
    print(f"✅ ask_ai success")
    return result

# ============================================
# Flashcards
# ============================================
def generate_flashcards_ai(topic, content):
    """Generate flashcards"""
    print(f"🔵 Flashcards: {topic}")
    
    prompt = f"""Create 5 flashcards about: {topic}

Content: {content[:1200]}

Return valid JSON:
[{{"q":"Question 1","a":"Answer 1","type":"definition"}},{{"q":"Question 2","a":"Answer 2","type":"keypoints"}},{{"q":"Question 3","a":"Answer 3","type":"process"}},{{"q":"Question 4","a":"Answer 4","type":"keypoints"}},{{"q":"Question 5","a":"Answer 5","type":"definition"}}]

Keep answers under 80 words. Return ONLY JSON array."""

    try:
        result = call_ai_with_retry(prompt, 1800)
        
        if not result or result.startswith("Error:"):
            print("⚠️ Using fallback flashcards")
            return json.dumps([
                {"q": f"What is {topic}?", "a": "Core concept explanation.", "type": "definition"},
                {"q": f"Key points of {topic}?", "a": "Important aspects.", "type": "keypoints"},
                {"q": f"How {topic} works?", "a": "Process description.", "type": "process"}
            ])
        
        result = clean_ai_json(result)
        flashcards = json.loads(result)
        
        if isinstance(flashcards, list) and len(flashcards) > 0:
            print(f"✅ {len(flashcards)} flashcards")
            return json.dumps(flashcards)
        
        return None
        
    except Exception as e:
        print(f"❌ Flashcard error: {e}")
        return None

# ============================================
# MCQs
# ============================================
def generate_mcqs_ai(topic, content):
    """Generate MCQs"""
    print(f"🔵 MCQs: {topic}")
    
    prompt = f"""Create 5 MCQs about: {topic}

Content: {content[:1200]}

Return valid JSON:
[{{"q":"Question 1?","opts":["A","B","C","D"],"ans":0,"explanation":"Why"}},{{"q":"Question 2?","opts":["A","B","C","D"],"ans":1,"explanation":"Why"}}]

Keep short. Return ONLY JSON array."""

    try:
        result = call_ai_with_retry(prompt, 2000)
        
        if not result or result.startswith("Error:"):
            print("❌ MCQ generation failed")
            return None
        
        result = clean_ai_json(result)
        mcqs = json.loads(result)
        
        if isinstance(mcqs, list) and len(mcqs) > 0:
            valid_mcqs = [m for m in mcqs if all(k in m for k in ['q','opts','ans']) and len(m['opts'])==4]
            if valid_mcqs:
                print(f"✅ {len(valid_mcqs)} MCQs")
                return json.dumps(valid_mcqs)
        
        return None
        
    except Exception as e:
        print(f"❌ MCQ error: {e}")
        return None

# ============================================
# Keywords
# ============================================
def extract_keywords_ai(topic, content):
    """Extract keywords"""
    print(f"🔵 Keywords: {topic}")
    
    prompt = f"""Extract 5 keywords about: {topic}

Content: {content[:1200]}

Return valid JSON:
[{{"k":"Term 1","d":"Definition 1"}},{{"k":"Term 2","d":"Definition 2"}},{{"k":"Term 3","d":"Definition 3"}},{{"k":"Term 4","d":"Definition 4"}},{{"k":"Term 5","d":"Definition 5"}}]

Keep short. Return ONLY JSON array."""

    try:
        result = call_ai_with_retry(prompt, 1500)
        
        if not result or result.startswith("Error:"):
            print("❌ Keyword extraction failed")
            return None
        
        result = clean_ai_json(result)
        keywords = json.loads(result)
        
        if isinstance(keywords, list) and len(keywords) > 0:
            print(f"✅ {len(keywords)} keywords")
            return json.dumps(keywords)
        
        return None
        
    except Exception as e:
        print(f"❌ Keyword error: {e}")
        return None

print("\n" + "="*50)
print("🚀 Smart API initialized")
print("="*50 + "\n")