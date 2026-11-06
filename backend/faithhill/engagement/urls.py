"""Visitor engagement routes.

POST-only submission endpoints at /api/submit/<form>/;
staff inbox endpoints at /api/manage/<resource>/.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import manage_views, views

manage_router = DefaultRouter()
manage_router.register("prayer-requests", manage_views.PrayerRequestManageViewSet, basename="manage-prayer-requests")
manage_router.register("contact-messages", manage_views.ContactMessageManageViewSet, basename="manage-contact-messages")
manage_router.register("newsletter", manage_views.NewsletterSubscriberManageViewSet, basename="manage-newsletter")
manage_router.register("rsvps", manage_views.EventRSVPManageViewSet, basename="manage-rsvps")

urlpatterns = [
    path("submit/prayer-request/", views.PrayerRequestSubmitView.as_view(), name="submit-prayer-request"),
    path("submit/contact/", views.ContactMessageSubmitView.as_view(), name="submit-contact"),
    path("submit/newsletter/", views.NewsletterSubscribeView.as_view(), name="submit-newsletter"),
    path("submit/rsvp/", views.EventRSVPSubmitView.as_view(), name="submit-rsvp"),
    path("manage/", include(manage_router.urls)),
]
