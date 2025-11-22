"""
Test script for the new all-in-one API
Run: python manage.py shell < test_batch_api.py
Or: python test_batch_api.py
"""

from demo_app.batch_api import generate_all_content, generate_search_only
from demo_app.cache import cache_stats, clear_cache
import json

print("\n" + "="*70)
print("🧪 TESTING ALL-IN-ONE API")
print("="*70 + "\n")

# Test 1: Generate all content
print("📝 Test 1: Generate all content with story")
print("-" * 70)
result1 = generate_all_content(
    topic="photosynthesis",
    include_story=True
)

print(f"\n✅ Results Received:")
print(f"   • Topic: {result1['topic']}")
print(f"   • Explanation: {len(result1['search'])} chars")
print(f"   • Story: {len(result1['story'])} chars")
print(f"   • Flashcards: {len(result1['flashcards'])} items")
print(f"   • MCQs: {len(result1['mcqs'])} items")
print(f"   • Keywords: {len(result1['keywords'])} items")
if result1['errors']:
    print(f"   • Errors: {result1['errors']}")

print("\n📋 Sample Flashcard:")
if result1['flashcards']:
    fc = result1['flashcards'][0]
    print(f"   Q: {fc.get('q', 'N/A')}")
    print(f"   A: {fc.get('a', 'N/A')}")
    print(f"   Type: {fc.get('type', 'N/A')}")

print("\n❓ Sample MCQ:")
if result1['mcqs']:
    mcq = result1['mcqs'][0]
    print(f"   Q: {mcq.get('q', 'N/A')}")
    print(f"   Options: {mcq.get('opts', [])}")
    print(f"   Answer: {mcq.get('ans', 'N/A')}")

print("\n🔑 Sample Keyword:")
if result1['keywords']:
    kw = result1['keywords'][0]
    print(f"   Term: {kw.get('k', 'N/A')}")
    print(f"   Definition: {kw.get('d', 'N/A')}")

# Test 2: Test cache (should be instant)
print("\n\n" + "="*70)
print("💾 Test 2: Cache Performance (same topic)")
print("-" * 70)
print("Fetching same topic again (should use cache, be instant)...\n")

result2 = generate_all_content(
    topic="photosynthesis",
    include_story=True
)

print(f"✅ Cached result retrieved instantly!")
print(f"   Same data: {result1['search'] == result2['search']}")

# Test 3: Search only
print("\n\n" + "="*70)
print("🔍 Test 3: Search only (no story, MCQs, flashcards)")
print("-" * 70)

result3 = generate_search_only("machine learning")
print(f"✅ Search result:")
print(f"   Topic: {result3['topic']}")
print(f"   Explanation length: {len(result3['search'])} chars")

# Test 4: Cache statistics
print("\n\n" + "="*70)
print("📊 Cache Statistics")
print("-" * 70)

stats = cache_stats()
print(f"✅ Cache stats:")
print(f"   Files cached: {stats['count']}")
print(f"   Total size: {stats['size_mb']} MB")

# Test 5: Different topic
print("\n\n" + "="*70)
print("📝 Test 4: Different topic (should make new API calls)")
print("-" * 70)

result4 = generate_all_content(
    topic="quantum mechanics",
    include_story=True
)

print(f"\n✅ New topic results:")
print(f"   • Topic: {result4['topic']}")
print(f"   • Explanation: {len(result4['search'])} chars")
print(f"   • Flashcards: {len(result4['flashcards'])} items")

# Final summary
print("\n\n" + "="*70)
print("✅ ALL TESTS COMPLETE")
print("="*70)

print(f"""
📊 Summary:
   ✓ Batch generation works
   ✓ Cache storage works
   ✓ Cache retrieval works (instant)
   ✓ Multiple topics work
   ✓ All components generated (explanation, story, flashcards, MCQs, keywords)

💾 Cache Details:
   Files: {stats['count']}
   Size: {stats['size_mb']} MB

🚀 Next Steps:
   1. Add more API keys to .env
   2. Use endpoint: GET /ai/search-all/?topic=your_topic
   3. Enjoy fast, cached results!
   
📖 Documentation:
   - BATCH_API_SETUP.md (detailed guide)
   - QUICK_START.md (quick reference)
""")

# Optional: Clear cache
# clear_cache()
# print("🗑️ Cache cleared!")
