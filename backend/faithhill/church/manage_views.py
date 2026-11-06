"""Staff dashboard API: full CRUD over all church content.

Requires JWT auth + is_staff (enforced by IsAdminUser). These endpoints
back the custom React staff dashboard; the queryset is NOT pre-filtered
so staff can see and edit unpublished/inactive content too."""

from django.db.models import Count
from rest_framework import permissions, viewsets

from .models import (
    Announcement,
    Belief,
    Event,
    GalleryAlbum,
    GalleryImage,
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
    GalleryImageSerializer,
    GivingOptionSerializer,
    MinistrySerializer,
    NextStepSerializer,
    SermonSerializer,
    SermonSeriesSerializer,
    ServiceTimeSerializer,
    StaffProfileManageSerializer,
    TestimonySerializer,
    ValueSerializer,
)


class ManageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]


class SermonSeriesManageViewSet(ManageViewSet):
    serializer_class = SermonSeriesSerializer
    queryset = SermonSeries.objects.all()


class SermonManageViewSet(ManageViewSet):
    serializer_class = SermonSerializer
    queryset = Sermon.objects.select_related("series")


class EventManageViewSet(ManageViewSet):
    serializer_class = EventSerializer
    queryset = Event.objects.annotate(rsvp_count=Count("rsvps"))


class AnnouncementManageViewSet(ManageViewSet):
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.all()


class MinistryManageViewSet(ManageViewSet):
    serializer_class = MinistrySerializer
    queryset = Ministry.objects.select_related("leader")


class StaffProfileManageViewSet(ManageViewSet):
    serializer_class = StaffProfileManageSerializer
    queryset = StaffProfile.objects.select_related("user")


class ServiceTimeManageViewSet(ManageViewSet):
    serializer_class = ServiceTimeSerializer
    queryset = ServiceTime.objects.all()


class ValueManageViewSet(ManageViewSet):
    serializer_class = ValueSerializer
    queryset = Value.objects.all()


class BeliefManageViewSet(ManageViewSet):
    serializer_class = BeliefSerializer
    queryset = Belief.objects.all()


class NextStepManageViewSet(ManageViewSet):
    serializer_class = NextStepSerializer
    queryset = NextStep.objects.all()


class TestimonyManageViewSet(ManageViewSet):
    """Staff can approve/unapprove testimonies here. ?approved=1|0 filters."""

    serializer_class = TestimonySerializer
    queryset = Testimony.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        approved = self.request.query_params.get("approved")
        if approved in ("0", "1"):
            qs = qs.filter(is_approved=approved == "1")
        return qs

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        if not self.request.user.is_anonymous and self.request.user.is_staff:
            serializer.fields["is_approved"].read_only = False
        return serializer


class GalleryAlbumManageViewSet(ManageViewSet):
    serializer_class = GalleryAlbumSerializer
    queryset = GalleryAlbum.objects.prefetch_related("images")


class GalleryImageManageViewSet(ManageViewSet):
    serializer_class = GalleryImageSerializer
    queryset = GalleryImage.objects.select_related("album")


class GivingOptionManageViewSet(ManageViewSet):
    serializer_class = GivingOptionSerializer
    queryset = GivingOption.objects.all()
