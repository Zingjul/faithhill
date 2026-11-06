"""
Small auth helpers for the staff dashboard.
"""

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """
    JWT login with brute-force protection.

    The staff dashboard lives on an unguessable URL, but that is obscurity, not
    security — this throttle is the actual lock on the door when combined with
    strong passwords. Rate is configurable via THROTTLE_LOGIN (default 10/min).
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class MeView(APIView):
    """Return the currently logged-in staff user's identity.

    Requires is_staff — the dashboard calls this right after login to
    confirm the account is actually authorized for the staff area.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        user = request.user
        return Response(
            {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
            }
        )
