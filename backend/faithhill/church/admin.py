"""Django admin — developer/superadmin fallback. Staff use the dashboard."""

from django.contrib import admin

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


@admin.register(SermonSeries)
class SermonSeriesAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title",)


@admin.register(Sermon)
class SermonAdmin(admin.ModelAdmin):
    list_display = ("title", "speaker", "sermon_date", "series", "is_published")
    list_filter = ("is_published", "series", "sermon_date")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "speaker", "scripture", "topic")
    date_hierarchy = "sermon_date"


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "start_datetime",
        "location",
        "is_featured",
        "rsvp_enabled",
        "is_published",
    )
    list_filter = ("is_published", "is_featured", "rsvp_enabled")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "location")
    date_hierarchy = "start_datetime"


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "publish_at", "expire_at", "is_active", "is_current")
    list_filter = ("is_active",)
    search_fields = ("title", "body")


class GalleryImageInline(admin.TabularInline):
    model = GalleryImage
    extra = 3


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(admin.ModelAdmin):
    list_display = ("title", "event", "created_at")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [GalleryImageInline]


@admin.register(Ministry)
class MinistryAdmin(admin.ModelAdmin):
    list_display = ("name", "leader", "order", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("order",)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "order", "is_active")
    list_editable = ("order",)
    search_fields = ("name", "role")


@admin.register(ServiceTime)
class ServiceTimeAdmin(admin.ModelAdmin):
    list_display = ("name", "day_of_week", "start_time", "is_active")
    list_filter = ("is_active", "day_of_week")


for model in (Value, Belief, NextStep, GivingOption):
    admin.site.register(
        model,
        type(
            f"{model.__name__}Admin",
            (admin.ModelAdmin,),
            {
                "list_display": ("title" if hasattr(model, "title") else "label", "order", "is_active"),
                "list_editable": ("order", "is_active"),
            },
        ),
    )


@admin.register(Testimony)
class TestimonyAdmin(admin.ModelAdmin):
    list_display = ("name", "is_approved", "created_at")
    list_editable = ("is_approved",)
    list_filter = ("is_approved",)
    search_fields = ("name", "body")


admin.site.site_header = "Faith Hill CMS"
admin.site.site_title = "Faith Hill"
admin.site.index_title = "Church content"
