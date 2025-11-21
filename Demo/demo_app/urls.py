from django.urls import path
from . import views  # ✅ import your app views

urlpatterns = [
    path('', views.home, name="home"),  # root URL
    path("ai/", views.get_ai_response, name="ai_response"),
    path('story/', views.generate_story, name='generate_story'),

    # ✅ Authentication URLs
    path('auth/signup/', views.signup_view, name='signup'),
    path('auth/signin/', views.signin_view, name='signin'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/check-auth/', views.check_auth, name='check_auth'),

    # ✅ History URLs
    path('history/save/', views.save_search_history, name='save_history'),
    path('history/get/', views.get_search_history, name='get_history'),
    path('history/delete/<int:history_id>/', views.delete_history, name='delete_history'),
    path('history/clear/', views.clear_all_history, name='clear_history'),
    
    # ✨ NEW: AI Generation Endpoints
    path('ai/generate-flashcards/', views.generate_flashcards_endpoint, name='generate_flashcards'),
    path('ai/generate-mcqs/', views.generate_mcqs_endpoint, name='generate_mcqs'),
    path('ai/extract-keywords/', views.extract_keywords_endpoint, name='extract_keywords'),
]