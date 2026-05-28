from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def health(_request):
    return JsonResponse({"status": "ok", "service": "eld-trip-planner"})


urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/", include("trips.urls")),
]
