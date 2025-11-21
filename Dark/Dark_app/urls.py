from django.urls import path
from . import views

urlpatterns = [
   path('',views.home ,name="home"),
   path("sign" , views.sign , name="Sign"),
   path("Sucess ", views.success , name="success")
]
