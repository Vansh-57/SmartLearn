from django.shortcuts import render
from django.http import JsonResponse
from .Smart_api import ask_ai

def home(request):
    return render(request, 'Smartlearn_app/index.html') 

def get_ai_response(request):
    prompt=request.GET.get("prompt" , "")
    if prompt =="":
        return JsonResponse({"response": "please enter Something "})
    
    result=ask_ai(prompt)
    return JsonResponse({"response" : result})