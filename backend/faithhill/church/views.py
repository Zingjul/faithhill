"""Public API: read-only views of published church content.

All views here are anonymous-allowed; querysets are pre-filtered to
published/active/current content so the website never has to filter itself.
"""

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import filters, mixins, permissions, viewsets

from .models import (
    Announcement,
    Belief,
    Event,
    GalleryAlbum,
    GivingOption,
    Ministry,
    NextStep,
    Sermon,
    SermonSeries,
    ServiceTime,
    StaffProfile,
    Testimony,
    Value,
)
from .serializers import (
    AnnouncementSerializer,
    BeliefSerializer,
    EventSerializer,
    GalleryAlbumSerializer,
    GivingOptionSerializer,
    MinistrySerializer,
    NextStepSerializer,
    SermonSerializer,
    SermonSeriesSerializer,
    ServiceTimeSerializer,
    StaffProfileSerializer,
    TestimonySerializer,
    ValueSerializer,
)


class PublicReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]


class SermonSeriesViewSet(PublicReadOnlyViewSet):
    serializer_class = SermonSeriesSerializer
    lookup_field = "slug"
    queryset = SermonSeries.objects.filter(is_active=True)


class SermonViewSet(PublicReadOnlyViewSet):
    serializer_class = SermonSerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "speaker", "scripture", "topic", "description"]
    ordering_fields = ["sermon_date"]

    def get_queryset(self):
        qs = Sermon.objects.filter(is_published=True).select_related("series")
        series = self.request.query_params.get("series")
        if series:
            qs = qs.filter(series__slug=series)
        return qs


class EventViewSet(PublicReadOnlyViewSet):
    serializer_class = EventSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = (
            Event.objects.filter(is_published=True)
            .annotate(rsvp_count=Count("rsvps"))
            .order_by("start_datetime")
        )
        now = timezone.now()
        if self.request.query_params.get("upcoming") == "1":
            qs = qs.filter(Q(start_datetime__gte=now) | Q(end_datetime__gte=now))
        if self.request.query_params.get("past") == "1":
            qs = qs.filter(
                Q(end_datetime__lt=now) | Q(end_datetime__isnull=True, start_datetime__lt=now)
            ).order_by("-start_datetime")
        if self.request.query_params.get("featured") == "1":
            qs = qs.filter(is_featured=True)
        return qs


class AnnouncementViewSet(PublicReadOnlyViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        now = timezone.now()
        return Announcement.objects.filter(
            is_active=True, publish_at__lte=now
        ).filter(Q(expire_at__isnull=True) | Q(expire_at__gt=now))


class MinistryViewSet(PublicReadOnlyViewSet):
    serializer_class = MinistrySerializer
    lookup_field = "slug"
    queryset = Ministry.objects.filter(is_active=True).select_related("leader")


class StaffProfileViewSet(PublicReadOnlyViewSet):
    serializer_class = StaffProfileSerializer
    queryset = StaffProfile.objects.filter(is_active=True)


class ServiceTimeViewSet(PublicReadOnlyViewSet):
    serializer_class = ServiceTimeSerializer
    queryset = ServiceTime.objects.filter(is_active=True)


class ValueViewSet(PublicReadOnlyViewSet):
    serializer_class = ValueSerializer
    queryset = Value.objects.filter(is_active=True)


class BeliefViewSet(PublicReadOnlyViewSet):
    serializer_class = BeliefSerializer
    queryset = Belief.objects.filter(is_active=True)


class NextStepViewSet(PublicReadOnlyViewSet):
    serializer_class = NextStepSerializer
    queryset = NextStep.objects.filter(is_active=True)


class TestimonyViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Visitors read approved testimonies and submit new ones (held for approval)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = TestimonySerializer

    def get_queryset(self):
        if self.request.method == "GET":
            return Testimony.objects.filter(is_approved=True)
        return Testimony.objects.all()


class GalleryAlbumViewSet(PublicReadOnlyViewSet):
    serializer_class = GalleryAlbumSerializer
    lookup_field = "slug"
    queryset = GalleryAlbum.objects.prefetch_related("images")


class GivingOptionViewSet(PublicReadOnlyViewSet):
    serializer_class = GivingOptionSerializer
    queryset = GivingOption.objects.filter(is_active=True)
