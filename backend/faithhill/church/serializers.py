"""Serializers for church content. Same serializers serve public reads and
staff writes — all fields are non-secret; visibility is enforced by querysets
(is_published / is_active filters), not by field hiding. The exception is
StaffProfile, which hides login-account info from the public API."""

from rest_framework import serializers

from . import youtube
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


class SermonSeriesSerializer(serializers.ModelSerializer):
    sermon_count = serializers.SerializerMethodField()

    class Meta:
        model = SermonSeries
        fields = [
            "id", "title", "slug", "description", "artwork",
            "is_active", "sermon_count", "created_at",
        ]
        read_only_fields = ["slug"]

    def get_sermon_count(self, obj):
        return obj.sermons.filter(is_published=True).count()


class SermonSerializer(serializers.ModelSerializer):
    series_detail = SermonSeriesSerializer(source="series", read_only=True)
    video_id = serializers.SerializerMethodField()
    youtube_thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Sermon
        fields = [
            "id", "title", "slug", "speaker", "sermon_date", "scripture",
            "topic", "description", "video_url", "video_id",
            "youtube_thumbnail", "audio_file", "notes", "thumbnail", "series",
            "series_detail", "is_published", "created_at", "updated_at",
        ]
        read_only_fields = ["slug"]
        extra_kwargs = {"series": {"required": False, "allow_null": True}}

    def get_video_id(self, obj) -> str | None:
        return youtube.extract_video_id(obj.video_url)

    def get_youtube_thumbnail(self, obj) -> str | None:
        """Fallback poster frame when staff didn't upload a thumbnail."""
        if obj.thumbnail:
            return None
        return youtube.youtube_thumbnail(obj.video_url)

    def to_internal_value(self, data):
        """
        Normalize the video link *before* field validation.

        Staff sometimes paste a full <iframe> snippet or a bare video id; both
        would fail URLField's own validation, so they are canonicalized into a
        watch URL first. That keeps the field strict (no junk stored) while
        accepting whatever YouTube's share button produces.
        """
        if hasattr(data, "copy"):
            data = data.copy()
            raw = data.get("video_url")
            if raw and isinstance(raw, str):
                normalized = youtube.normalize_video_url(raw)
                if normalized:
                    data["video_url"] = normalized
        return super().to_internal_value(data)


class EventSerializer(serializers.ModelSerializer):
    is_upcoming = serializers.ReadOnlyField()
    rsvp_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Event
        fields = [
            "id", "title", "slug", "summary", "description", "start_datetime",
            "end_datetime", "location", "image", "is_featured", "rsvp_enabled",
            "is_upcoming", "rsvp_count", "is_published", "created_at",
        ]
        read_only_fields = ["slug"]


class AnnouncementSerializer(serializers.ModelSerializer):
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "body", "publish_at", "expire_at",
            "is_active", "is_current", "created_at",
        ]


class StaffProfileSerializer(serializers.ModelSerializer):
    """Public — never exposes the linked login account."""

    class Meta:
        model = StaffProfile
        fields = [
            "id", "name", "role", "summary", "about",
            "email", "phone", "photo", "order",
        ]


class StaffProfileManageSerializer(serializers.ModelSerializer):
    """Staff — additionally links a login user to the profile."""

    class Meta:
        model = StaffProfile
        fields = "__all__"
        extra_kwargs = {"user": {"required": False, "allow_null": True}}


class MinistrySerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source="leader.name", read_only=True)

    class Meta:
        model = Ministry
        fields = [
            "id", "name", "slug", "summary", "description",
            "leader", "leader_name", "image", "order", "is_active",
        ]
        read_only_fields = ["slug"]
        extra_kwargs = {"leader": {"required": False, "allow_null": True}}


class ServiceTimeSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(
        source="get_day_of_week_display", read_only=True
    )

    class Meta:
        model = ServiceTime
        fields = [
            "id", "name", "day_of_week", "day_name",
            "start_time", "end_time", "notes", "is_active",
        ]


class ValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Value
        fields = ["id", "title", "description", "order", "is_active"]


class BeliefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Belief
        fields = ["id", "title", "description", "order", "is_active"]


class NextStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = NextStep
        fields = ["id", "title", "description", "link", "icon", "order", "is_active"]


class TestimonySerializer(serializers.ModelSerializer):
    """Visitors can submit; is_approved is staff-controlled."""

    class Meta:
        model = Testimony
        fields = ["id", "name", "body", "is_approved", "created_at"]
        read_only_fields = ["is_approved"]


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = ["id", "album", "image", "caption", "order"]


class GalleryAlbumSerializer(serializers.ModelSerializer):
    images = GalleryImageSerializer(many=True, read_only=True)

    class Meta:
        model = GalleryAlbum
        fields = ["id", "title", "slug", "description", "cover", "event", "images"]
        read_only_fields = ["slug"]
        extra_kwargs = {"event": {"required": False, "allow_null": True}}


class GivingOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GivingOption
        fields = ["id", "label", "instructions", "url", "order", "is_active"]
