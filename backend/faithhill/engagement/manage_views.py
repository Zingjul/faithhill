"""Staff inbox API: read/manage visitor submissions. Requires JWT + is_staff."""

from rest_framework import mixins, permissions, viewsets

from .models import ContactMessage, EventRSVP, NewsletterSubscriber, PrayerRequest
from .serializers import (
    ContactMessageManageSerializer,
    EventRSVPManageSerializer,
    NewsletterSubscriberSerializer,
    PrayerRequestManageSerializer,
)


class ManageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]


class PrayerRequestManageViewSet(ManageViewSet):
    serializer_class = PrayerRequestManageSerializer
    queryset = PrayerRequest.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ContactMessageManageViewSet(ManageViewSet):
    serializer_class = ContactMessageManageSerializer
    queryset = ContactMessage.objects.all()


class NewsletterSubscriberManageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Staff can review subscribers and remove them (unsubscribe requests)."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = NewsletterSubscriberSerializer
    queryset = NewsletterSubscriber.objects.all()


class EventRSVPManageViewSet(viewsets.ReadOnlyModelViewSet):
    """Registrations per event; staff only need to view/export them."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = EventRSVPManageSerializer
    queryset = EventRSVP.objects.select_related("event")

    def get_queryset(self):
        qs = super().get_queryset()
        event = self.request.query_params.get("event")
        if event:
            qs = qs.filter(event__slug=event)
        return qs
