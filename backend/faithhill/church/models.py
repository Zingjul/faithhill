"""
Content models powering the public Faith Hill website.

Everything here is editable by trained staff through the staff dashboard
(via the /api/manage/ endpoints) or by the developer via Django admin.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def unique_slug(instance, value):
    """Return a slug unique for the instance's model (excluding itself)."""
    base = slugify(value)[:200] or "item"
    model = type(instance)
    slug, n = base, 2
    while model.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AutoSlugModel(TimeStampedModel):
    """Adds a slug auto-generated from `slug_source` when left blank."""

    slug_source = "title"

    slug = models.SlugField(max_length=220, unique=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, getattr(self, self.slug_source))
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Sermons
# ---------------------------------------------------------------------------


class SermonSeries(AutoSlugModel):
    """A sermon series/grouping ("Up Next" links sermons in the same series)."""

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    artwork = models.ImageField(upload_to="series/", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "sermon series"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Sermon(AutoSlugModel):
    series = models.ForeignKey(
        SermonSeries,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sermons",
    )
    title = models.CharField(max_length=200)
    speaker = models.CharField(max_length=150, blank=True)
    sermon_date = models.DateField(default=timezone.localdate)
    scripture = models.CharField(
        max_length=200, blank=True, help_text='e.g. "John 3:16-21"'
    )
    topic = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    video_url = models.URLField(
        blank=True, help_text="YouTube/Vimeo link or embed URL"
    )
    audio_file = models.FileField(upload_to="sermons/audio/", blank=True)
    notes = models.TextField(
        blank=True,
        help_text="Fill-in-the-blank sermon notes (Markdown supported)",
    )
    thumbnail = models.ImageField(upload_to="sermons/thumbnails/", blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-sermon_date", "-created_at"]

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------


class Event(AutoSlugModel):
    title = models.CharField(max_length=200)
    summary = models.CharField(
        max_length=300,
        help_text="One-liner shown in the collapsed accordion view",
    )
    description = models.TextField(blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)
    location = models.CharField(
        max_length=255, blank=True, help_text='e.g. "Faith Hill Auditorium"'
    )
    image = models.ImageField(upload_to="events/", blank=True)
    is_featured = models.BooleanField(default=False)
    rsvp_enabled = models.BooleanField(
        default=False, help_text="Allow visitors to register for this event"
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["start_datetime"]

    def __str__(self):
        return self.title

    @property
    def is_upcoming(self):
        return (self.end_datetime or self.start_datetime) >= timezone.now()


class Announcement(TimeStampedModel):
    title = models.CharField(max_length=200)
    body = models.TextField()
    publish_at = models.DateTimeField(default=timezone.now)
    expire_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-publish_at"]

    def __str__(self):
        return self.title

    @property
    def is_current(self):
        now = timezone.now()
        return (
            self.is_active
            and self.publish_at <= now
            and (self.expire_at is None or self.expire_at > now)
        )


# ---------------------------------------------------------------------------
# People & ministries
# ---------------------------------------------------------------------------


class StaffProfile(TimeStampedModel):
    """Shown on the "Staff & Leaders" page; clicking a card opens the profile."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_profile",
        help_text="Login account, if this person needs staff dashboard access",
    )
    name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=150, help_text='e.g. "ArchBishop", "Worship Director"'
    )
    summary = models.CharField(max_length=300, blank=True)
    about = models.TextField(blank=True, help_text="Full bio")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    photo = models.ImageField(upload_to="staff/", blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "staff & leaders"
        ordering = ["order", "name"]

    def __str__(self):
        return f"{self.name} — {self.role}"


class Ministry(AutoSlugModel):
    slug_source = "name"

    name = models.CharField(max_length=150)
    summary = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    leader = models.ForeignKey(
        StaffProfile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ministries_led",
    )
    image = models.ImageField(upload_to="ministries/", blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "ministries"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Service times & About page content
# ---------------------------------------------------------------------------


class ServiceTime(models.Model):
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY = range(7)
    DAYS_OF_WEEK = [
        (MONDAY, "Monday"),
        (TUESDAY, "Tuesday"),
        (WEDNESDAY, "Wednesday"),
        (THURSDAY, "Thursday"),
        (FRIDAY, "Friday"),
        (SATURDAY, "Saturday"),
        (SUNDAY, "Sunday"),
    ]

    name = models.CharField(max_length=120, default="Sunday Service")
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    notes = models.CharField(
        max_length=200, blank=True, help_text='e.g. "First Sunday of the month"'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.name} — {self.get_day_of_week_display()} {self.start_time:%H:%M}"


class Value(models.Model):
    """"Our Values" cards on the About page."""

    title = models.CharField(max_length=120)
    description = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class Belief(models.Model):
    """Belief statements, shown as accordion dropdowns on the About page."""

    title = models.CharField(max_length=150)
    description = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class NextStep(models.Model):
    """Core next-step cards (Connect / Pray / Contact / Give)."""

    title = models.CharField(max_length=120)
    description = models.TextField()
    link = models.CharField(
        max_length=200, blank=True, help_text='"/give" or a full https:// URL'
    )
    icon = models.CharField(
        max_length=60, blank=True, help_text="Icon name used by the frontend"
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Testimonies, gallery & giving
# ---------------------------------------------------------------------------


class Testimony(models.Model):
    name = models.CharField(max_length=150)
    body = models.TextField()
    is_approved = models.BooleanField(
        default=False, help_text="Only approved testimonies appear on the website"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "testimonies"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Testimony by {self.name}"


class GalleryAlbum(AutoSlugModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover = models.ImageField(upload_to="gallery/covers/", blank=True)
    event = models.ForeignKey(
        Event,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="albums",
        help_text="Optionally tie this album to an event",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class GalleryImage(TimeStampedModel):
    album = models.ForeignKey(
        GalleryAlbum, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="gallery/")
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.caption or f"Photo {self.pk} in {self.album}"


class GivingOption(models.Model):
    """Ways to give shown on the Give page."""

    label = models.CharField(
        max_length=120, help_text='e.g. "Bank transfer", "Paystack"'
    )
    instructions = models.TextField(blank=True)
    url = models.URLField(blank=True, help_text="External giving link, if any")
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "giving options"
        ordering = ["order", "label"]

    def __str__(self):
        return self.label
