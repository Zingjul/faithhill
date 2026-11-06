"""Public submission endpoints — write-only visitor forms.

Visitors can create records but never read them back; the records land
in the staff dashboard inbox."""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NewsletterSubscriber
from .serializers import (
    ContactMessageSubmitSerializer,
    EventRSVPSubmitSerializer,
    PrayerRequestSubmitSerializer,
)


class SubmitView(generics.CreateAPIView):
    """Base class: anonymous, create-only."""

    permission_classes = [permissions.AllowAny]


class PrayerRequestSubmitView(SubmitView):
    serializer_class = PrayerRequestSubmitSerializer


class ContactMessageSubmitView(SubmitView):
    serializer_class = ContactMessageSubmitSerializer


class EventRSVPSubmitView(SubmitView):
    serializer_class = EventRSVPSubmitSerializer


class NewsletterSubscribeView(APIView):
    """Idempotent subscribe: re-subscribing re-activates quietly."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"email": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email, defaults={"is_active": True}
        )
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save(update_fields=["is_active"])
        return Response(
            {"detail": "You are subscribed to the newsletter."},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
