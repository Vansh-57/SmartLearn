from django.urls import path
from . import views  # ✅ import your app views

urlpatterns = [
    path('', views.home, name="home"),  # root URL
    path("ai/" , views.get_ai_response , name="ai rersponse"),
]
