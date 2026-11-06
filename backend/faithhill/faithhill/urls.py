"""
URL configuration for faithhill project.

API layout
----------
api/health/                    liveness probe
api/auth/token/                JWT login (staff dashboard)
api/auth/token/refresh/        JWT refresh
api/...                        public read-only content (church app)
api/submit/...                 public write-only visitor forms (engagement app)
api/manage/...                 staff CRUD API (JWT + is_staff required)
admin/                         Django admin (developer / superadmin fallback)
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from .api_auth import MeView, ThrottledTokenObtainPairView


def health(_request):
    """
    Liveness + readiness probe.

    Verifies the database connection because Render restarts a service whose
    health check fails — a container that cannot reach Supabase should be
    replaced, not kept alive.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as exc:  # noqa: BLE001
        return JsonResponse(
            {"status": "error", "database": str(exc)[:200]}, status=503
        )
    return JsonResponse({"status": "ok", "database": "ok"})


def root_index(_request):
    """Handy landing page for anyone who opens the API port's preview."""
    return HttpResponse(
        """
        <html><body style="font-family:system-ui;max-width:520px;margin:80px auto;line-height:1.6">
        <h1>⛰ Faith Hill API</h1>
        <p>The Django backend is healthy. This preview serves the API only — try:</p>
        <ul>
          <li><a href="/api/health/">/api/health/</a> — liveness probe</li>
          <li><a href="/api/sermons/">/api/sermons/</a>, <a href="/api/events/">/api/events/</a>,
              <a href="/api/team/">/api/team/</a> … — public content</li>
          <li><a href="/admin/">/admin/</a> — Django admin (developer login)</li>
        </ul>
        <p><strong>Public website:</strong> open the preview for port <strong>5173</strong>.<br>
        <strong>Staff dashboard:</strong> open the preview for port <strong>5174</strong>.</p>
        </body></html>
        """,
        content_type="text/html",
    )


urlpatterns = [
    path("", root_index, name="root-index"),
    path("admin/", admin.site.urls),
    path("api/health/", health, name="api-health"),
    path("api/auth/token/", ThrottledTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", MeView.as_view(), name="auth-me"),
    path("api/", include("church.urls")),
    path("api/", include("engagement.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
