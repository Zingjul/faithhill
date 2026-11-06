"""Church content routes.

Public read-only endpoints live at /api/<resource>/;
staff CRUD endpoints live at /api/manage/<resource>/.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import manage_views, views

public_router = DefaultRouter()
public_router.register("sermon-series", views.SermonSeriesViewSet, basename="sermon-series")
public_router.register("sermons", views.SermonViewSet, basename="sermons")
public_router.register("events", views.EventViewSet, basename="events")
public_router.register("announcements", views.AnnouncementViewSet, basename="announcements")
public_router.register("ministries", views.MinistryViewSet, basename="ministries")
public_router.register("team", views.StaffProfileViewSet, basename="team")
public_router.register("service-times", views.ServiceTimeViewSet, basename="service-times")
public_router.register("values", views.ValueViewSet, basename="values")
public_router.register("beliefs", views.BeliefViewSet, basename="beliefs")
public_router.register("next-steps", views.NextStepViewSet, basename="next-steps")
public_router.register("testimonies", views.TestimonyViewSet, basename="testimonies")
public_router.register("gallery", views.GalleryAlbumViewSet, basename="gallery")
public_router.register("giving", views.GivingOptionViewSet, basename="giving")

manage_router = DefaultRouter()
manage_router.register("sermon-series", manage_views.SermonSeriesManageViewSet, basename="manage-sermon-series")
manage_router.register("sermons", manage_views.SermonManageViewSet, basename="manage-sermons")
manage_router.register("events", manage_views.EventManageViewSet, basename="manage-events")
manage_router.register("announcements", manage_views.AnnouncementManageViewSet, basename="manage-announcements")
manage_router.register("ministries", manage_views.MinistryManageViewSet, basename="manage-ministries")
manage_router.register("team", manage_views.StaffProfileManageViewSet, basename="manage-team")
manage_router.register("service-times", manage_views.ServiceTimeManageViewSet, basename="manage-service-times")
manage_router.register("values", manage_views.ValueManageViewSet, basename="manage-values")
manage_router.register("beliefs", manage_views.BeliefManageViewSet, basename="manage-beliefs")
manage_router.register("next-steps", manage_views.NextStepManageViewSet, basename="manage-next-steps")
manage_router.register("testimonies", manage_views.TestimonyManageViewSet, basename="manage-testimonies")
manage_router.register("gallery", manage_views.GalleryAlbumManageViewSet, basename="manage-gallery")
manage_router.register("gallery-images", manage_views.GalleryImageManageViewSet, basename="manage-gallery-images")
manage_router.register("giving", manage_views.GivingOptionManageViewSet, basename="manage-giving")

urlpatterns = [
    path("", include(public_router.urls)),
    path("manage/", include(manage_router.urls)),
]
