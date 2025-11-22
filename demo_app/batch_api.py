"""
Batch API Handler - Generate all content in optimized calls
Handles: Search/Explanation, Story, Flashcards, MCQs, Keywords
Returns everything in one response
"""

import json
import time
from .Smart_api import call_ai_with_retry, clean_ai_json
from .cache import save_to_cache, load_from_cache, get_cache_key, get_content_hash

def generate_all_content(topic, content=None, include_story=True):
    """
    Generate ALL content in optimized batch calls:
    - Main explanation/search result
    - Story (optional)
    - 5 Flashcards
    - 5 MCQs
    - 5 Keywords
    
    Returns: {'search': '', 'story': '', 'flashcards': [], 'mcqs': [], 'keywords': []}
    """
    
    print(f"\n{'='*60}")
    print(f"🚀 BATCH GENERATION: {topic}")
    print(f"{'='*60}\n")
    
    # Generate cache key
    content_hash = get_content_hash(content) if content else ""
    cache_key = get_cache_key(topic, content_hash)
    
    # Check cache
    cached = load_from_cache(cache_key)
    if cached:
        print(f"✨ Using cached results for: {topic}\n")
        return cached
    
    results = {
        'topic': topic,
        'search': '',
        'story': '',
        'flashcards': [],
        'mcqs': [],
        'keywords': [],
        'errors': []
    }
    
    # ============================================
    # BATCH 1: Main Explanation & Story (Single Call)
    # ============================================
    print("📝 [BATCH 1/2] Generating explanation + story...")
    
    batch1_prompt = f"""You are an expert educator. Generate TWO outputs for: {topic}

1. EXPLANATION (500-700 words):
   Comprehensive explanation with key concepts, examples, and practical applications. Be detailed and thorough.

2. STORY (300-400 words):
   An engaging {topic} story that teaches the concept naturally with narrative flow.

Format your response EXACTLY like this:
---EXPLANATION---
[your detailed explanation here]

---STORY---
[your engaging story here]
---END---

Make sure explanations and stories are COMPLETE and DETAILED. Do not truncate or shorten."""
    
    batch1_response = call_ai_with_retry(batch1_prompt, max_tokens=3000)
    
    if batch1_response and not batch1_response.startswith("Error"):
        try:
            # Parse batch 1 response
            if '---EXPLANATION---' in batch1_response and '---STORY---' in batch1_response:
                explanation = batch1_response.split('---EXPLANATION---')[1].split('---STORY---')[0].strip()
                story = batch1_response.split('---STORY---')[1].split('---END---')[0].strip()
                
                results['search'] = explanation
                if include_story:
                    results['story'] = story
                
                print(f"   ✅ Explanation: {len(explanation)} chars")
                print(f"   ✅ Story: {len(story)} chars")
        except Exception as e:
            print(f"   ⚠️ Parse error: {e}")
            results['errors'].append(f"Batch 1 parse: {str(e)}")
    else:
        results['errors'].append(f"Batch 1 failed: {batch1_response}")
        print(f"   ❌ Batch 1 failed")
    
    # Wait between batches
    time.sleep(2)
    
    # ============================================
    # BATCH 2: Flashcards, MCQs, Keywords (Single Call)
    # ============================================
    print("\n📚 [BATCH 2/2] Generating flashcards, MCQs, keywords...")
    
    content_for_batch = content[:1000] if content else results['search'][:1000]
    
    batch2_prompt = f"""Create educational materials for: {topic}

Context: {content_for_batch}

Return ONLY valid JSON (no markdown, no code blocks, no extra text):

{{
  "flashcards": [
    {{"q":"Question 1?","a":"Complete answer with full explanation","type":"definition"}},
    {{"q":"Question 2?","a":"Complete answer with full explanation","type":"keypoints"}},
    {{"q":"Question 3?","a":"Complete answer with full explanation","type":"process"}},
    {{"q":"Question 4?","a":"Complete answer with full explanation","type":"definition"}},
    {{"q":"Question 5?","a":"Complete answer with full explanation","type":"keypoints"}}
  ],
  "mcqs": [
    {{"q":"Question 1?","opts":["Option A","Option B","Option C","Option D"],"ans":0,"explanation":"Detailed explanation"}},
    {{"q":"Question 2?","opts":["Option A","Option B","Option C","Option D"],"ans":1,"explanation":"Detailed explanation"}},
    {{"q":"Question 3?","opts":["Option A","Option B","Option C","Option D"],"ans":2,"explanation":"Detailed explanation"}},
    {{"q":"Question 4?","opts":["Option A","Option B","Option C","Option D"],"ans":0,"explanation":"Detailed explanation"}},
    {{"q":"Question 5?","opts":["Option A","Option B","Option C","Option D"],"ans":3,"explanation":"Detailed explanation"}}
  ],
  "keywords": [
    {{"k":"Term 1","d":"Complete definition"}},
    {{"k":"Term 2","d":"Complete definition"}},
    {{"k":"Term 3","d":"Complete definition"}},
    {{"k":"Term 4","d":"Complete definition"}},
    {{"k":"Term 5","d":"Complete definition"}}
  ]
}}

Ensure all answers and definitions are COMPLETE. Return ONLY the JSON object, no extra text."""

    batch2_response = call_ai_with_retry(batch2_prompt, max_tokens=3500)
    
    if batch2_response and not batch2_response.startswith("Error"):
        try:
            # Clean and parse JSON
            cleaned = clean_ai_json(batch2_response)
            data = json.loads(cleaned)
            
            if 'flashcards' in data and isinstance(data['flashcards'], list):
                results['flashcards'] = data['flashcards'][:5]
                print(f"   ✅ Flashcards: {len(results['flashcards'])} generated")
            
            if 'mcqs' in data and isinstance(data['mcqs'], list):
                results['mcqs'] = data['mcqs'][:5]
                print(f"   ✅ MCQs: {len(results['mcqs'])} generated")
            
            if 'keywords' in data and isinstance(data['keywords'], list):
                results['keywords'] = data['keywords'][:5]
                print(f"   ✅ Keywords: {len(results['keywords'])} generated")
                
        except json.JSONDecodeError as e:
            results['errors'].append(f"JSON parse: {str(e)}")
            print(f"   ⚠️ JSON parse error: {e}")
        except Exception as e:
            results['errors'].append(f"Batch 2 parse: {str(e)}")
            print(f"   ⚠️ Parse error: {e}")
    else:
        results['errors'].append(f"Batch 2 failed: {batch2_response}")
        print(f"   ❌ Batch 2 failed")
    
    # ============================================
    # Cache Results
    # ============================================
    save_to_cache(cache_key, results, ttl_hours=72)
    
    # ============================================
    # Get Quota Info
    # ============================================
    from .Smart_api import get_quota_info
    quota = get_quota_info()
    
    # ============================================
    # Summary with Quota
    # ============================================
    print(f"\n{'='*60}")
    print(f"✅ BATCH COMPLETE")
    print(f"{'='*60}")
    print(f"📄 Explanation: {len(results['search'])} chars")
    print(f"📖 Story: {len(results['story'])} chars")
    print(f"🎴 Flashcards: {len(results['flashcards'])} items")
    print(f"❓ MCQs: {len(results['mcqs'])} items")
    print(f"🔑 Keywords: {len(results['keywords'])} items")
    if results['errors']:
        print(f"⚠️  Errors: {len(results['errors'])}")
    
    print(f"\n📊 API QUOTA STATUS:")
    print(f"   Calls Used: {quota['calls_made']}/{quota['quota_limit']}")
    print(f"   Remaining: {quota['remaining']} calls")
    print(f"   Usage: {quota['usage_percent']}%")
    print(f"{'='*60}\n")
    
    # Add quota info to results
    results['quota_info'] = quota
    
    return results


def generate_search_only(topic):
    """Quick search/explanation only (no story, flashcards, etc)"""
    print(f"\n🔍 Quick search: {topic}")
    
    cache_key = get_cache_key(topic, "search_only")
    cached = load_from_cache(cache_key)
    if cached:
        return cached
    
    prompt = f"Explain '{topic}' in detail with key concepts, examples, and practical applications."
    result = call_ai_with_retry(prompt, max_tokens=2000)
    
    response = {
        'topic': topic,
        'search': result if result and not result.startswith("Error") else "Failed to generate explanation"
    }
    
    save_to_cache(cache_key, response, ttl_hours=72)
    return response
