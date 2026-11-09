"""
Django settings for faithhill project.

Faith Hill Prophetic Assembly Church — API backend.

Every deployment-specific value comes from the environment so the same code
runs locally (SQLite + local media + DEBUG) and on Render (Postgres on
Supabase + Supabase Storage + HTTPS). See DEPLOYMENT.md.
"""

import os
from datetime import timedelta
from pathlib import Path

import django
import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/faithhill/.env (or backend/.env) before reading any setting, so
# `python manage.py ...` picks up the file without exporting variables by hand.
# On Render there is no .env file and this is a no-op — real env vars win.
for candidate in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    load_dotenv(candidate, override=False)


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------


def env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


def env_bool(key: str, default: bool = False) -> bool:
    raw = os.environ.get(key)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def env_list(key: str, default: str = "") -> list[str]:
    raw = os.environ.get(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

# DEBUG defaults to True so local development needs no .env at all.
# Render sets DEBUG=False explicitly (see render.yaml).
DEBUG = env_bool("DEBUG", True)

# A real secret is mandatory in production. In development we generate one and
# persist it to .env, so local commands never fail and sessions stay valid
# across restarts (a fresh random key each run would log you out every time).
SECRET_KEY = env("SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError(
            "SECRET_KEY is not set. Set it in the environment. "
            "Render generates one automatically; anywhere else run: "
            'python -c "import secrets; print(secrets.token_urlsafe(64))"'
        )
    import secrets

    SECRET_KEY = secrets.token_urlsafe(64)
    try:
        env_file = BASE_DIR / ".env"
        existing = env_file.read_text(encoding="utf-8") if env_file.exists() else ""
        if "SECRET_KEY=" not in existing:
            with env_file.open("a", encoding="utf-8") as handle:
                handle.write(
                    ("\n" if existing and not existing.endswith("\n") else "")
                    + f"SECRET_KEY={SECRET_KEY}\n"
                )
    except OSError:
        pass  # read-only filesystem: the ephemeral key is still fine for dev

# Render injects RENDER_EXTERNAL_HOSTNAME; explicit ALLOWED_HOSTS wins if set.
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", ".e2b.app"]
    if env("RENDER_EXTERNAL_HOSTNAME"):
        ALLOWED_HOSTS.append(env("RENDER_EXTERNAL_HOSTNAME"))
    if not DEBUG:
        ALLOWED_HOSTS.append(".onrender.com")

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    # Project apps
    "church",
    "engagement",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise must sit directly after SecurityMiddleware so it can serve
    # /static/ (Django admin CSS) without a separate web server.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "faithhill.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "faithhill.wsgi.application"


# ---------------------------------------------------------------------------
# Database — Supabase Postgres in production, SQLite locally
# ---------------------------------------------------------------------------

DATABASE_URL = env("DATABASE_URL")


def check_database_url(url: str) -> None:
    """
    Catch the three mistakes Supabase's dashboard makes easy.

    Each one otherwise surfaces as "password authentication failed", which
    sends you hunting for the wrong problem.
    """
    from urllib.parse import urlparse

    # Checked on the raw string: the brackets are not valid in a URL and would
    # make urlparse() raise before we can give a useful message.
    if "[" in url or "]" in url:
        raise RuntimeError(
            "DATABASE_URL still contains the [YOUR-PASSWORD] placeholder. "
            "Replace it with the database password you set when creating the "
            "Supabase project (Project Settings -> Database -> Reset password)."
        )

    # '#' starts the fragment, so an unencoded one in the password truncates the
    # URL: urlparse() then reports no host/user and Django tries to connect to
    # something nonsensical. It must be percent-encoded as %23.
    if "#" in url:
        raise RuntimeError(
            "DATABASE_URL contains an unencoded '#' — everything after it is "
            "treated as a URL fragment, so the host and password are lost. "
            "Percent-encode it as %23, or reset the password in Supabase "
            "(Project Settings -> Database) to letters and digits only."
        )

    parsed = urlparse(url)
    try:
        port = parsed.port
    except ValueError:
        raise RuntimeError(
            "DATABASE_URL could not be parsed — the port is not a number, "
            "which usually means an unencoded '/' or '?' in the password. "
            "Percent-encode it (/ -> %2F, ? -> %3F, @ -> %40), or reset the "
            "password to letters and digits only."
        ) from None

    host = parsed.hostname or ""
    user = parsed.username or ""

    if not user or not host or not parsed.password:
        raise RuntimeError(
            "DATABASE_URL could not be parsed — it is missing a username, "
            "password or host. Copy the string again with Supabase's Copy "
            "button rather than selecting it by eye; the field is visually "
            "truncated and hand-copying loses the tail."
        )

    if port == 6543:
        raise RuntimeError(
            "DATABASE_URL uses port 6543 (transaction pooling), which breaks "
            "Django. In Supabase use Connect -> Connection pooling -> SESSION "
            "mode (port 5432)."
        )

    if "pooler.supabase.com" in host and "." not in user:
        raise RuntimeError(
            f'DATABASE_URL username is "{user}", but Supabase\'s pooler needs '
            f'"{user}.<project-ref>" (for example "postgres.abcdefghijklmnop"). '
            "Copy the whole string from Connect -> Connection pooling."
        )


if DATABASE_URL:
    check_database_url(DATABASE_URL)
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            # Supabase's pooler terminates TLS with a certificate chain that
            # psycopg validates fine; require SSL unless explicitly disabled.
            ssl_require=not env_bool("DATABASE_SSL_DISABLE", False),
        )
    }
else:
    if not DEBUG and not env("ALLOW_SQLITE_IN_PRODUCTION"):
        # A container filesystem is ephemeral: SQLite on Render loses every
        # row on redeploy. Fail at boot (visible in the deploy log) instead of
        # silently serving an empty site.
        raise RuntimeError(
            "DATABASE_URL is not set. Production requires a Postgres "
            "connection string (Supabase). See DEPLOYMENT.md."
        )
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lagos"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Static files (Django admin CSS) — served by WhiteNoise
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# ---------------------------------------------------------------------------
# Media files (sermon thumbnails, series artwork, team photos, event images)
#
# Render's disk is ephemeral, so uploads go to Supabase Storage in
# production. Without Supabase credentials we fall back to local disk,
# which is exactly what local development wants.
# ---------------------------------------------------------------------------

USE_SUPABASE_STORAGE = bool(
    env("SUPABASE_PROJECT_REF") and env("SUPABASE_SERVICE_KEY")
)

if USE_SUPABASE_STORAGE:
    STORAGES["default"] = {"BACKEND": "faithhill.storage.SupabaseStorage"}

    SUPABASE_PROJECT_REF = env("SUPABASE_PROJECT_REF")
    SUPABASE_SERVICE_KEY = env("SUPABASE_SERVICE_KEY")
    SUPABASE_BUCKET = env("SUPABASE_BUCKET", "faithhill-media")
    # Supabase accepts the project ref as the access key id, or a dedicated
    # S3 access key if one was generated in the dashboard.
    SUPABASE_ACCESS_KEY = env("SUPABASE_ACCESS_KEY") or SUPABASE_PROJECT_REF
    SUPABASE_REGION = env("SUPABASE_REGION", "us-east-1")
else:
    MEDIA_URL = "media/"
    MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------

# Django 6.0 introduced the MAILERS multi-backend setting; earlier versions
# use EMAIL_BACKEND. Console backend keeps dev email in the terminal either way.
if django.VERSION >= (6, 0):
    MAILERS = {"default": {"BACKEND": "django.core.mail.backends.console.EmailBackend"}}
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# ---------------------------------------------------------------------------
# CORS — which browser origins may call the API
# ---------------------------------------------------------------------------

# Explicit allowlist from the environment (comma separated), e.g.
#   CORS_ALLOWED_ORIGINS=https://faithhill.org,https://www.faithhill.org,https://fh-staff-7x2k.onrender.com
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

if not CORS_ALLOWED_ORIGINS:
    # Development defaults: the two Vite dev servers.
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

# Arena live-preview proxies (development only — never needed in production).
if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://\d+-[a-z0-9]+\.e2b\.app$"]

# Extra origins (e.g. a temporary preview domain) without editing the list.
CORS_ALLOWED_ORIGINS += env_list("CORS_EXTRA_ORIGINS")


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Default posture: staff-only. Public endpoints opt out with AllowAny.
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAdminUser",),
    # Custom subclass: DRF only supports ?page_size=.. via a pagination class
    # attribute, not a settings key. See faithhill/pagination.py.
    "DEFAULT_PAGINATION_CLASS": "faithhill.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    # Throttling: the login endpoint is the only brute-force target that
    # matters, and visitor forms are the only abusive-write surface.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "login": env("THROTTLE_LOGIN", "10/min"),
        "submit": env("THROTTLE_SUBMIT", "30/hour"),
    },
}


# ---------------------------------------------------------------------------
# JWT auth for the staff dashboard
# ---------------------------------------------------------------------------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=45),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}


# ---------------------------------------------------------------------------
# Production hardening — only applied when DEBUG is off so local dev and the
# test suite are unaffected.
# ---------------------------------------------------------------------------

if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    # Render terminates TLS at its proxy and forwards this header.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"
    X_FRAME_OPTIONS = "DENY"
    # Render health checks hit the app over plain HTTP internally; skip the
    # redirect for them via the exempt path below.
    SECURE_REDIRECT_EXEMPT = [r"^api/health/$"]


# ---------------------------------------------------------------------------
# Logging — readable single-line logs in Render's log stream
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "{levelname} {asctime} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
