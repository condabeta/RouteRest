from django.urls import path

from . import views

urlpatterns = [
    path("geocode/", views.geocode_suggest_view, name="geocode"),
    path("plan/", views.plan_view, name="plan"),
    path("trips/<int:pk>/", views.trip_detail_view, name="trip-detail"),
]
