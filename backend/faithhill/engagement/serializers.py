"""Serializers for visitor submissions and the staff inbox.

Public serializers are write-only (visitors can only create, never read).
Manage serializers expose everything, including private staff fields."""

from django.utils import timezone
from rest_framework import serializers

from church.models import Event

from .models import ContactMessage, EventRSVP, NewsletterSubscriber, PrayerRequest


class PrayerRequestSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerRequest
        fields = ["id", "name", "email", "phone", "request", "created_at"]
        read_only_fields = ["created_at"]


class PrayerRequestManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerRequest
        fields = [
            "id", "name", "email", "phone", "request",
            "status", "staff_notes", "created_at",
        ]
        read_only_fields = ["created_at"]


class ContactMessageSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "created_at"]
        read_only_fields = ["created_at"]


class ContactMessageManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id", "name", "email", "subject", "message",
            "is_replied", "created_at",
        ]
        read_only_fields = ["created_at"]


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "is_active", "subscribed_at"]
        read_only_fields = ["subscribed_at"]


class EventRSVPSubmitSerializer(serializers.ModelSerializer):
    event = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Event.objects.filter(is_published=True, rsvp_enabled=True),
        help_text="Slug of a published event that has RSVP enabled",
    )

    class Meta:
        model = EventRSVP
        fields = ["id", "event", "name", "email", "phone", "guests", "created_at"]
        read_only_fields = ["created_at"]

    def validate_event(self, event):
        if not event.is_upcoming:
            raise serializers.ValidationError("This event has already passed.")
        return event


class EventRSVPManageSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = EventRSVP
        fields = [
            "id", "event", "event_title", "name", "email",
            "phone", "guests", "created_at",
        ]
        read_only_fields = ["created_at"]
