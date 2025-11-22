from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from .Smart_api import ask_ai, generate_flashcards_ai, generate_mcqs_ai, extract_keywords_ai
from .models import SearchHistory, Bookmark, StudyStreak
from django.contrib.auth.decorators import login_required
from .utils import update_study_streak_on_search
from .models import SearchHistory
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .Smart_api import generate_flashcards_ai, generate_mcqs_ai, extract_keywords_ai
from .batch_api import generate_all_content, generate_search_only
import json
import traceback


# ============================================
# Home Page
# ============================================
def home(request):
    return render(request, 'demo_app/index.html')


# ============================================
# UNIFIED BATCH ENDPOINT - All Results in One Call
# ============================================
@csrf_exempt
def search_all_in_one(request):
    """
    Generate EVERYTHING in one call:
    - Search/Explanation
    - Story
    - Flashcards (5)
    - MCQs (5)
    - Keywords (5)
    
    Query params:
    - topic: The search topic (required)
    - content: Optional content for context (optional)
    - include_story: Include story? (default: true)
    """
    try:
        topic = request.GET.get("topic", "").strip()
        content = request.GET.get("content", "").strip()
        include_story = request.GET.get("include_story", "true").lower() == "true"
        
        if not topic:
            return JsonResponse({"error": "Please enter a topic"}, status=400)
        
        print(f"🚀 All-in-one search: {topic}")
        
        # Generate all content in batched calls
        results = generate_all_content(topic, content, include_story)
        
        return JsonResponse({
            "success": True,
            "data": results
        })
        
    except Exception as e:
        print(f"❌ All-in-one error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


# ============================================
# Search AI endpoint - FIXED VERSION
# ============================================
def get_ai_response(request):
    """Main search endpoint that returns AI explanation"""
    try:
        prompt = request.GET.get("prompt", "").strip()
        
        if not prompt:
            return JsonResponse({"response": "Please enter something."})
        
        print(f"🔵 Searching for: {prompt}")
        
        # Call AI with better prompt
        enhanced_prompt = f"Explain '{prompt}' in detail. Provide a comprehensive explanation with key concepts, examples, and practical applications."
        
        result = ask_ai(enhanced_prompt)
        
        if not result or result.strip() == "":
            print("⚠️ Empty AI response")
            return JsonResponse({"response": "I couldn't generate a response. Please try rephrasing your query."})
        
        print(f"✅ AI Response length: {len(result)} chars")
        return JsonResponse({"response": result})
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        traceback.print_exc()
        return JsonResponse({"response": f"Error: {str(e)}"}, status=500)


# ============================================
# Concept ➜ Story endpoint
# ============================================
def generate_story(request):
    concept = request.GET.get("concept", "")
    tone = request.GET.get("tone", "simple")

    if not concept:
        return JsonResponse({"story": "Please enter a concept."})

    # Modify prompt for story generation
    prompt = f"Write a {tone} story explaining the concept: {concept}"

    story_result = ask_ai(prompt)
    return JsonResponse({"story": story_result})


# ============================================
# AUTHENTICATION VIEWS
# ============================================
import re
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

@csrf_exempt
def signin_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            # ===== VALIDATION =====
            if not email or not password:
                return JsonResponse({'success': False, 'message': 'Please enter both email and password'})

            # Validate email format
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse({'success': False, 'message': 'Please enter a valid email address'})

            # ===== CHECK IF USER EXISTS =====
            if not User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'message': 'No account found with this email. Please sign up first.'})

            # ===== AUTHENTICATE =====
            user = authenticate(request, username=email, password=password)

            if user is not None:
                login(request, user)

                print(f"✅ User logged in: {user.email}")

                # ✅ Update streak
                from .utils import update_study_streak_on_search
                current_streak = update_study_streak_on_search(user)

                print(f"✅ Streak updated: {current_streak}")

                # ✅ Get streak data
                streak_data = None
                try:
                    streak = StudyStreak.objects.get(user=user)
                    streak_data = {
                        'current_streak': streak.current_streak,
                        'longest_streak': streak.longest_streak,
                        'total_logins': streak.total_logins
                    }
                    print(f"✅ Streak data: {streak_data}")
                except StudyStreak.DoesNotExist:
                    print(f"⚠️ No streak found for {user.email}")
                    pass

                return JsonResponse({
                    'success': True,
                    'message': 'Login successful!',
                    'user': {
                        'id': user.id,
                        'name': user.first_name or user.username,
                        'email': user.email
                    },
                    'streak': streak_data
                })
            else:
                return JsonResponse({'success': False, 'message': 'Incorrect password. Please try again.'})

        except Exception as e:
            print(f"Signin error: {str(e)}")
            return JsonResponse({'success': False, 'message': 'An error occurred. Please try again.'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@csrf_exempt
def signup_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            # ===== VALIDATION =====
            if not name or not email or not password:
                return JsonResponse({'success': False, 'message': 'All fields are required'})
            
            if len(name) < 2:
                return JsonResponse({'success': False, 'message': 'Name must be at least 2 characters'})
            
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse({'success': False, 'message': 'Please enter a valid email address'})
            
            if len(password) < 8:
                return JsonResponse({'success': False, 'message': 'Password must be at least 8 characters'})
            
            # ===== CHECK IF USER EXISTS =====
            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'message': 'This email is already registered. Please sign in instead.'})
            
            if User.objects.filter(username=email).exists():
                return JsonResponse({'success': False, 'message': 'This email is already registered. Please sign in instead.'})
            
            # ===== CREATE USER =====
            try:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=name
                )
                print(f"✅ User created: {user.email}")
            except Exception as e:
                print(f"❌ Error creating user: {str(e)}")
                return JsonResponse({'success': False, 'message': 'Error creating account. Please try again.'})
            
            # ===== AUTO LOGIN =====
            try:
                login(request, user)
                print(f"✅ User logged in: {user.email}")
            except Exception as e:
                print(f"⚠️ Login error: {str(e)}")
            
            # ===== CREATE STREAK =====
            streak_data = None
            try:
                from .utils import update_study_streak_on_search
                current_streak = update_study_streak_on_search(user)
                print(f"✅ Streak created: {current_streak}")
                
                streak = StudyStreak.objects.get(user=user)
                streak_data = {
                    'current_streak': streak.current_streak,
                    'longest_streak': streak.longest_streak,
                    'total_logins': streak.total_logins
                }
                print(f"✅ Streak data: {streak_data}")
                
            except ImportError as e:
                print(f"⚠️ utils.py import error: {str(e)}")
                try:
                    from datetime import date
                    streak = StudyStreak.objects.create(
                        user=user,
                        last_login_date=date.today(),
                        current_streak=1,
                        longest_streak=1,
                        total_logins=1
                    )
                    streak_data = {
                        'current_streak': 1,
                        'longest_streak': 1,
                        'total_logins': 1
                    }
                    print(f"✅ Streak created manually: {streak_data}")
                except Exception as e2:
                    print(f"❌ Manual streak creation error: {str(e2)}")
                    
            except Exception as e:
                print(f"⚠️ Streak creation error: {str(e)}")
                traceback.print_exc()
            
            return JsonResponse({
                'success': True, 
                'message': 'Account created successfully!',
                'user': {
                    'id': user.id,
                    'name': name, 
                    'email': email
                },
                'streak': streak_data
            })
            
        except Exception as e:
            print(f"❌ Signup error: {str(e)}")
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': 'An error occurred. Please try again.'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# ============================================
# Search History Management
# ============================================
@csrf_exempt
def save_search_history(request):
    """Save search history - works for both logged in and logged out users"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)
    
    try:
        data = json.loads(request.body.decode('utf-8') or '{}')
        query = (data.get('query') or '').strip()
        flashcard_count = int(data.get('flashcard_count') or 0)
        mcq_count = int(data.get('mcq_count') or 0)

        if not query:
            return JsonResponse({'success': False, 'message': 'Query required'}, status=400)

        # ✅ Save to database if user is logged in
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                query=query,
                flashcard_count=flashcard_count,
                mcq_count=mcq_count
            )
            print(f"✅ History saved to DB for user: {request.user.email}")
        else:
            print(f"⚠️ User not authenticated, history saved to localStorage only")
        
        return JsonResponse({'success': True, 'message': 'History saved'})
        
    except Exception as e:
        print(f"❌ Save history error: {e}")
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@login_required
def get_search_history(request):
    try:
        history = SearchHistory.objects.filter(user=request.user).order_by('-timestamp')[:50]
        history_list = [{
            'id': h.id,
            'query': h.query,
            'timestamp': h.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'flashcard_count': h.flashcard_count,
            'mcq_count': h.mcq_count
        } for h in history]
        return JsonResponse({'success': True, 'history': history_list})
    except Exception as e:
        print(f"❌ Get history error: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
@login_required
def delete_history(request, history_id):
    if request.method not in ('POST', 'DELETE'):
        return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)
    try:
        history = SearchHistory.objects.get(id=history_id, user=request.user)
        history.delete()
        return JsonResponse({'success': True, 'message': 'History deleted'})
    except SearchHistory.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'History not found'}, status=404)
    except Exception as e:
        print(f"❌ Delete history error: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
@login_required
def clear_all_history(request):
    if request.method not in ('POST', 'DELETE'):
        return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)
    try:
        SearchHistory.objects.filter(user=request.user).delete()
        return JsonResponse({'success': True, 'message': 'All history cleared'})
    except Exception as e:
        print(f"❌ Clear history error: {e}")
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def search_view(request):
    query = request.GET.get('q', '')

    current_streak = 0
    if request.user.is_authenticated and query:
        SearchHistory.objects.create(user=request.user, query=query)
        current_streak = update_study_streak_on_search(request.user)
    
    return render(request, 'demo_app/index.html', {
        'query': query,
        'current_streak': current_streak
    })


def logout_view(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully'})


def check_auth(request):
    if request.user.is_authenticated:
        streak_data = None
        try:
            streak = StudyStreak.objects.get(user=request.user)
            streak_data = {
                'current_streak': streak.current_streak,
                'longest_streak': streak.longest_streak,
                'total_logins': streak.total_logins
            }
        except StudyStreak.DoesNotExist:
            pass
        
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'name': request.user.first_name or request.user.username,
                'email': request.user.email,
                'streak': streak_data
            }
        })
    return JsonResponse({'authenticated': False})


# ============================================
# AI-POWERED GENERATION ENDPOINTS - FIXED
# ============================================

@csrf_exempt
def generate_flashcards_endpoint(request):
    """AI-powered flashcard generation - FIXED"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            topic = request.GET.get('topic', '').strip()
            content = data.get('content', '').strip()
            
            print(f"🔵 Flashcard request - Topic: '{topic}', Content length: {len(content)}")
            
            if not topic:
                return JsonResponse({'error': 'Missing topic'}, status=400)
            
            if not content:
                return JsonResponse({'error': 'Missing content'}, status=400)
            
            # Call AI function
            flashcards = generate_flashcards_ai(topic, content)
            
            if flashcards:
                print(f"✅ Flashcards generated successfully")
                return JsonResponse({'success': True, 'flashcards': flashcards})
            else:
                print(f"❌ Flashcard generation returned None")
                return JsonResponse({'error': 'Flashcard generation failed - AI returned no data'}, status=500)
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            return JsonResponse({'error': 'Invalid JSON in request'}, status=400)
        except Exception as e:
            print(f"❌ Error in flashcard endpoint: {e}")
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'POST method required'}, status=400)


@csrf_exempt
def generate_mcqs_endpoint(request):
    """AI-powered MCQ generation - FIXED"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            topic = request.GET.get('topic', '').strip()
            content = data.get('content', '').strip()
            
            print(f"🔵 MCQ request - Topic: '{topic}', Content length: {len(content)}")
            
            if not topic:
                return JsonResponse({'error': 'Missing topic'}, status=400)
            
            if not content:
                return JsonResponse({'error': 'Missing content'}, status=400)
            
            # Call AI function
            mcqs = generate_mcqs_ai(topic, content)
            
            if mcqs:
                print(f"✅ MCQs generated successfully")
                return JsonResponse({'success': True, 'mcqs': mcqs})
            else:
                print(f"❌ MCQ generation returned None")
                return JsonResponse({'error': 'MCQ generation failed - AI returned no data'}, status=500)
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            return JsonResponse({'error': 'Invalid JSON in request'}, status=400)
        except Exception as e:
            print(f"❌ Error in MCQ endpoint: {e}")
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'POST method required'}, status=400)


@csrf_exempt
def extract_keywords_endpoint(request):
    """AI-powered keyword extraction - FIXED"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            topic = request.GET.get('topic', '').strip()
            content = data.get('content', '').strip()
            
            print(f"🔵 Keyword request - Topic: '{topic}', Content length: {len(content)}")
            
            if not topic:
                return JsonResponse({'error': 'Missing topic'}, status=400)
            
            if not content:
                return JsonResponse({'error': 'Missing content'}, status=400)
            
            # Call AI function
            keywords = extract_keywords_ai(topic, content)
            
            if keywords:
                print(f"✅ Keywords extracted successfully")
                return JsonResponse({'success': True, 'keywords': keywords})
            else:
                print(f"❌ Keyword extraction returned None")
                return JsonResponse({'error': 'Keyword extraction failed - AI returned no data'}, status=500)
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            return JsonResponse({'error': 'Invalid JSON in request'}, status=400)
        except Exception as e:
            print(f"❌ Error in keyword endpoint: {e}")
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'POST method required'}, status=400)