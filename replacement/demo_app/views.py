from django.shortcuts import render
from django.http import JsonResponse
from .Smart_api import ask_ai

def home(request):
    return render(request, 'demo_app/index.html') 

# Search AI endpoint (already working)
def get_ai_response(request):
    prompt = request.GET.get("prompt", "")
    if not prompt:
        return JsonResponse({"response": "Please enter something."})
    
    result = ask_ai(prompt)
    return JsonResponse({"response": result})

# Concept ➜ Story endpoint
def generate_story(request):
    concept = request.GET.get("concept", "")
    tone = request.GET.get("tone", "simple")

    if not concept:
        return JsonResponse({"story": "Please enter a concept."})

    # Modify prompt for story generation
    prompt = f"Write a {tone} story explaining the concept: {concept}"

    story_result = ask_ai(prompt)
    return JsonResponse({"story": story_result})
