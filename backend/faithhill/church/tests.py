"""Smoke tests for the Faith Hill API.

Covers the public read endpoints, visitor write-only submissions, and the
staff-only manage API with JWT auth.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from church.models import Event, Sermon, ServiceTime
from engagement.models import ContactMessage, NewsletterSubscriber, PrayerRequest


def make_staff_user():
    return get_user_model().objects.create_user(
        username="staff1", password="pass123", is_staff=True
    )


class PublicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health(self):
        self.assertEqual(self.client.get("/api/health/").status_code, 200)

    def test_public_lists_are_anonymous_friendly(self):
        for url in (
            "/api/sermons/",
            "/api/sermon-series/",
            "/api/events/",
            "/api/announcements/",
            "/api/ministries/",
            "/api/team/",
            "/api/service-times/",
            "/api/values/",
            "/api/beliefs/",
            "/api/next-steps/",
            "/api/testimonies/",
            "/api/gallery/",
            "/api/giving/",
        ):
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_unpublished_sermon_hidden_from_public(self):
        from church.models import Sermon

        Sermon.objects.create(title="Draft sermon", is_published=False)
        response = self.client.get("/api/sermons/")
        self.assertEqual(response.data["count"], 0)


class SubmissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_prayer_request_submit(self):
        response = self.client.post(
            "/api/submit/prayer-request/",
            {"name": "Ada", "request": "Please pray for my exams."},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(PrayerRequest.objects.count(), 1)

    def test_contact_submit(self):
        response = self.client.post(
            "/api/submit/contact/",
            {"name": "Ada", "email": "ada@example.com", "message": "Hello!"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_newsletter_subscribe_idempotent(self):
        for _ in range(2):
            response = self.client.post(
                "/api/submit/newsletter/", {"email": "ada@example.com"}
            )
            self.assertIn(response.status_code, (200, 201))
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_rsvp_requires_rsvp_enabled_event(self):
        event = Event.objects.create(
            title="Vigil",
            summary="All-night vigil",
            start_datetime=timezone.now() + timedelta(days=3),
            rsvp_enabled=True,
        )
        response = self.client.post(
            "/api/submit/rsvp/",
            {"event": event.slug, "name": "Ada", "email": "ada@example.com"},
        )
        self.assertEqual(response.status_code, 201)
        event.rsvp_enabled = False
        event.save()
        response = self.client.post(
            "/api/submit/rsvp/",
            {"event": event.slug, "name": "Ada", "email": "ada@example.com"},
        )
        self.assertEqual(response.status_code, 400)

    def test_visitor_cannot_read_submissions(self):
        self.assertEqual(self.client.get("/api/manage/prayer-requests/").status_code, 401)
        self.assertEqual(self.client.get("/api/manage/contact-messages/").status_code, 401)


class ManageApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_staff_user()
        token = self.client.post(
            "/api/auth/token/",
            {"username": "staff1", "password": "pass123"},
        ).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_staff_can_read_inbox(self):
        PrayerRequest.objects.create(name="Ada", request="Pray for me.")
        response = self.client.get("/api/manage/prayer-requests/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_staff_can_update_prayer_status(self):
        request_obj = PrayerRequest.objects.create(name="Ada", request="Pray for me.")
        response = self.client.patch(
            f"/api/manage/prayer-requests/{request_obj.pk}/",
            {"status": "in_progress"},
        )
        self.assertEqual(response.status_code, 200)

    def test_staff_can_create_sermon(self):
        response = self.client.post(
            "/api/manage/sermons/",
            {"title": "New sermon", "speaker": "Pastor", "sermon_date": "2026-11-01"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["slug"])


class YouTubeLinkTests(TestCase):
    """Staff paste any YouTube URL shape; the API stores one canonical form."""

    def setUp(self):
        self.client = APIClient()
        make_staff_user()
        token = self.client.post(
            "/api/auth/token/",
            {"username": "staff1", "password": "pass123"},
        ).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_share_link_is_normalized_on_save(self):
        response = self.client.post(
            "/api/manage/sermons/",
            {
                "title": "Mountain Moving Faith",
                "sermon_date": "2026-11-01",
                "video_url": "https://youtu.be/dQw4w9WgXcQ?t=30",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["video_url"], "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        )

    def test_embed_snippet_is_normalized(self):
        response = self.client.post(
            "/api/manage/sermons/",
            {
                "title": "Embed Input",
                "sermon_date": "2026-11-02",
                "video_url": '<iframe src="https://www.youtube.com/embed/abc123XYZ_-"></iframe>',
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["video_url"], "https://www.youtube.com/watch?v=abc123XYZ_-"
        )

    def test_video_id_and_youtube_thumbnail_are_exposed(self):
        Sermon.objects.create(
            title="Derived Fields",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        )
        response = self.client.get("/api/sermons/")
        row = response.data["results"][0]
        self.assertEqual(row["video_id"], "dQw4w9WgXcQ")
        self.assertEqual(
            row["youtube_thumbnail"],
            "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        )

    def test_uploaded_thumbnail_wins_over_youtube_poster(self):
        sermon = Sermon.objects.create(
            title="Has Own Art",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            thumbnail="sermons/thumbnails/custom.jpg",
        )
        self.assertEqual(sermon.video_url, "https://youtu.be/dQw4w9WgXcQ")
        response = self.client.get("/api/sermons/")
        # Falls back to the uploaded image, so no YouTube poster is advertised.
        self.assertIsNone(response.data["results"][0]["youtube_thumbnail"])

    def test_non_youtube_links_are_preserved(self):
        response = self.client.post(
            "/api/manage/sermons/",
            {
                "title": "Vimeo Sermon",
                "sermon_date": "2026-11-03",
                "video_url": "https://vimeo.com/123456789",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["video_url"], "https://vimeo.com/123456789")


class HealthAndPaginationTests(TestCase):
    def test_health_reports_database_status(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "ok")

    def test_page_size_query_param_is_honoured(self):
        """The dashboard's FK dropdowns ask for page_size=100."""
        for i in range(25):
            ServiceTime.objects.create(
                name=f"Service {i}", day_of_week=6, start_time="09:00"
            )
        response = self.client.get("/api/service-times/?page_size=100")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 25)
