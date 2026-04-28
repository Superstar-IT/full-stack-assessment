from django.urls import path

from . import views

urlpatterns = [
    path("api/geocode", views.GeocodeSuggestView.as_view(), name="geocode"),
    path("api/plan", views.PlanTripView.as_view(), name="plan"),
]
