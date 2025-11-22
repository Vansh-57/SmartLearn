"""
Run this script to find the correct Gemini model name for your API key
Save as: test_gemini_models.py
Run: python test_gemini_models.py
"""

import os
from google import genai
from dotenv import load_dotenv

# Load your .env file
load_dotenv(r'C:\Users\VANSH\Desktop\Demo\.env')

API_KEY = os.getenv("SMARTLEARN_API_KEY")

if not API_KEY:
    print("❌ NO API KEY FOUND!")
    print("   Make sure SMARTLEARN_API_KEY is set in your .env file")
    exit(1)

print("="*60)
print("🔑 API Key Found:", API_KEY[:20] + "...")
print("="*60)

client = genai.Client(api_key=API_KEY)

print("\n📋 Listing all available models...\n")

try:
    # List all available models
    models = client.models.list()
    
    print("✅ Available Models:")
    print("-" * 60)
    
    flash_models = []
    pro_models = []
    other_models = []
    
    for model in models:
        model_name = model.name
        
        # Check if model supports generateContent
        if hasattr(model, 'supported_generation_methods'):
            if 'generateContent' in model.supported_generation_methods:
                print(f"✅ {model_name}")
                
                if 'flash' in model_name.lower():
                    flash_models.append(model_name)
                elif 'pro' in model_name.lower():
                    pro_models.append(model_name)
                else:
                    other_models.append(model_name)
            else:
                print(f"⚠️  {model_name} (doesn't support generateContent)")
        else:
            print(f"   {model_name}")
    
    print("\n" + "="*60)
    print("🎯 RECOMMENDED MODELS FOR YOUR PROJECT:")
    print("="*60)
    
    if flash_models:
        print("\n🚀 FLASH MODELS (Fast & Efficient):")
        for model in flash_models:
            print(f"   • {model}")
    
    if pro_models:
        print("\n💎 PRO MODELS (More Powerful):")
        for model in pro_models:
            print(f"   • {model}")
    
    if other_models:
        print("\n📦 OTHER MODELS:")
        for model in other_models:
            print(f"   • {model}")
    
    # Test the first flash model
    if flash_models:
        test_model = flash_models[0]
        print(f"\n🧪 Testing model: {test_model}")
        print("-" * 60)
        
        try:
            response = client.models.generate_content(
                model=test_model,
                contents="Say 'Hello, SmartLearn is working!' in one sentence."
            )
            print(f"✅ SUCCESS! Response: {response.text}")
            print("\n" + "="*60)
            print(f"✅ USE THIS MODEL IN YOUR Smart_api.py:")
            print(f"   AI_MODEL = \"{test_model}\"")
            print("="*60)
        except Exception as e:
            print(f"❌ Test failed: {e}")
    
except Exception as e:
    print(f"❌ Error listing models: {e}")
    print("\n💡 If you see authentication errors, check your API key.")
    print("💡 Get your key from: https://aistudio.google.com/app/apikey")