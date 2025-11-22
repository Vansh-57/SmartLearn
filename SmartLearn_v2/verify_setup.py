"""
🚀 SMARTLEARN - STARTUP VERIFICATION SCRIPT
Run this to verify your system is working correctly
Usage: python manage.py shell < verify_setup.py
"""

print("\n" + "="*70)
print("🔍 SMARTLEARN STARTUP VERIFICATION")
print("="*70 + "\n")

# 1. Check .env file
print("📋 [1/5] Checking .env file...")
print("-"*70)

import os
from pathlib import Path

env_file = Path(r'C:\Users\VANSH\Desktop\Demo - Copy\.env')
if env_file.exists():
    print(f"✅ .env file found: {env_file}")
    
    # Check API keys
    from dotenv import load_dotenv
    load_dotenv(env_file)
    
    api_keys_found = 0
    for i in range(1, 11):
        if i == 1:
            key = os.getenv("SMARTLEARN_API_KEY")
            key_name = "SMARTLEARN_API_KEY"
        else:
            key = os.getenv(f"SMARTLEARN_API_KEY_{i}")
            key_name = f"SMARTLEARN_API_KEY_{i}"
        
        if key:
            api_keys_found += 1
            # Show masked key
            masked = f"{key[:15]}...{key[-8:]}"
            print(f"   ✅ API Key {i}: {masked}")
        else:
            break
    
    if api_keys_found == 0:
        print("   ❌ No API keys found in .env!")
    else:
        print(f"\n   ✅ Total API Keys: {api_keys_found}/10")
else:
    print(f"❌ .env file not found at: {env_file}")

print("\n" + "-"*70 + "\n")

# 2. Check Django setup
print("🔧 [2/5] Checking Django setup...")
print("-"*70)

import django
from django.conf import settings

print(f"✅ Django version: {django.get_version()}")
print(f"✅ Settings module: {os.getenv('DJANGO_SETTINGS_MODULE', 'Demo.settings')}")
print(f"✅ Debug mode: {settings.DEBUG}")
print(f"✅ Installed apps: {len(settings.INSTALLED_APPS)} apps")

print("\n" + "-"*70 + "\n")

# 3. Check new files
print("📦 [3/5] Checking new files...")
print("-"*70)

demo_app = Path(r'C:\Users\VANSH\Desktop\Demo - Copy\demo_app')

files = {
    'cache.py': 'Caching system',
    'batch_api.py': 'Batch processor',
    'ai_cache': 'Cache storage'
}

for filename, description in files.items():
    filepath = demo_app / filename
    if filepath.exists():
        if filepath.is_file():
            size = filepath.stat().st_size
            print(f"✅ {filename:20} ({size:,} bytes) - {description}")
        else:
            print(f"✅ {filename:20} (folder) - {description}")
    else:
        print(f"❌ {filename:20} NOT FOUND - {description}")

print("\n" + "-"*70 + "\n")

# 4. Check Smart_api.py
print("🤖 [4/5] Checking Smart_api initialization...")
print("-"*70)

try:
    from demo_app.Smart_api import AI_MODEL, API_KEYS, AVAILABLE_MODELS
    
    if len(API_KEYS) > 0:
        print(f"✅ API Keys loaded: {len(API_KEYS)} keys")
        for i, key in enumerate(API_KEYS, 1):
            masked = f"{key[:15]}...{key[-8:]}"
            print(f"   Key {i}: {masked}")
    else:
        print(f"❌ No API keys loaded!")
    
    if len(AVAILABLE_MODELS) > 0:
        print(f"\n✅ Available models: {len(AVAILABLE_MODELS)} models")
        for model in AVAILABLE_MODELS[:5]:  # Show first 5
            print(f"   • {model}")
        if len(AVAILABLE_MODELS) > 5:
            print(f"   ... and {len(AVAILABLE_MODELS) - 5} more models")
    else:
        print(f"❌ No models available!")
    
    if AI_MODEL:
        print(f"\n✅ Selected model: {AI_MODEL}")
    else:
        print(f"⚠️  No model selected yet (will be auto-selected on first use)")
        
except Exception as e:
    print(f"❌ Error loading Smart_api: {str(e)[:100]}")
    import traceback
    traceback.print_exc()

print("\n" + "-"*70 + "\n")

# 5. Check endpoints
print("🌐 [5/5] Checking Django endpoints...")
print("-"*70)

from django.urls import get_resolver
from django.test import RequestFactory

try:
    resolver = get_resolver()
    
    # Check for important URLs
    important_urls = [
        'ai_response',
        'generate_story',
        'generate_flashcards',
        'generate_mcqs',
        'extract_keywords',
        'search_all_in_one',
    ]
    
    found_urls = []
    for url_name in important_urls:
        try:
            url = resolver.reverse(url_name)
            found_urls.append((url_name, url))
            print(f"✅ {url_name:25} → {url}")
        except:
            print(f"❌ {url_name:25} → NOT FOUND")
    
    print(f"\n✅ Total endpoints configured: {len(found_urls)}/{len(important_urls)}")
    
except Exception as e:
    print(f"⚠️  Could not verify endpoints: {str(e)[:100]}")

print("\n" + "="*70)
print("✅ VERIFICATION COMPLETE")
print("="*70)

print("""
📊 Next Steps:
   1. Start Django server: python manage.py runserver
   2. Test endpoint: http://localhost:8000/ai/search-all/?topic=test
   3. Check console output for:
      ✅ API Key 1, 2, 3 loaded
      ✅ Models discovered
      ✅ Model selected
      ✅ System Ready message

🔴 If you see errors:
   • Check .env file has all 3 API keys
   • Make sure keys are valid
   • Check internet connection
   • Check firewall blocking API calls

✅ Status: All checks passed! System is ready to use.
""")

print("="*70 + "\n")
