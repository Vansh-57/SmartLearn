from django.shortcuts import render
from django.http import JsonResponse
from .models import Person
def home(request):
    return render(request , "Dark_app/index.html")

def sign(request):
    return render(request ,'Dark_app/sign.html')

def success(request):
    return render(request, 'Dark_app/success.html')

def save_user_api(request):
    if request=="POST":
        name=request.POST.get("name")
        email=request.POST.get("email")

        if name and email:
            Person.create.object(name=name,Email=email)
            return render(request ,'Dark_app\success.html')
    return render(request , "Dark_app/success.html")