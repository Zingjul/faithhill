"""
Deployment diagnostics.

A misconfigured deploy is hard to diagnose from the browser: a CORS rejection
and a wrong API URL look identical (the request simply fails), and neither says
anything about the server's own settings. This endpoint reports the values that
actually matter, so the problem can be identified without guessing.
"""

from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class DiagnosticsView(APIView):
    """
    Read-only summary of the running configuration.

    Deliberately exposes no secrets: no key fragments, no passwords, no
    connection strings. Only presence flags, hostnames and origins — the values
    needed to tell a CORS mistake from a URL mistake.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        database = settings.DATABASES.get("default", {})
        engine = database.get("ENGINE", "").rsplit(".", 1)[-1]

        return Response(
            {
                "debug": settings.DEBUG,
                "database": {
                    "engine": engine,
                    # "sqlite" in production means DATA IS NOT PERSISTED.
                    "persistent": engine != "sqlite3",
                    "host": database.get("HOST") or "local file",
                },
                "allowed_hosts": settings.ALLOWED_HOSTS,
                "cors_allowed_origins": settings.CORS_ALLOWED_ORIGINS,
                # If this equals the origin you are browsing from, CORS is not
                # the problem. If it does not, it is.
                "request_origin": request.headers.get("Origin", "(none)"),
                "origin_is_allowed": request.headers.get("Origin")
                in settings.CORS_ALLOWED_ORIGINS,
                "storage": {
                    "backend": settings.STORAGES["default"]["BACKEND"].rsplit(".", 1)[-1],
                    # False means uploads land on the container's ephemeral disk
                    # and disappear on the next deploy.
                    "persistent": getattr(settings, "USE_SUPABASE_STORAGE", False),
                },
                "throttle_rates": settings.REST_FRAMEWORK.get(
                    "DEFAULT_THROTTLE_RATES", {}
                ),
            }
        )
