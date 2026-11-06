"""
Supabase Storage backend for Django's default file storage.

Render's filesystem is ephemeral: anything written to /media disappears on the
next deploy or restart. Uploads (sermon thumbnails, series artwork, team photos,
event flyers) therefore live in a Supabase Storage bucket instead.

Supabase Storage exposes an S3-compatible endpoint, so this uses boto3 rather
than a bespoke HTTP client. Public buckets serve files over a plain CDN URL,
which is what `url()` returns — meaning the API hands the browser a direct,
permanent image URL instead of routing image bytes through Render.

Required environment variables
------------------------------
SUPABASE_PROJECT_REF   project ref (e.g. "abcdefghijklmnop")
SUPABASE_SERVICE_KEY   service_role key (server-side only — never expose it)
SUPABASE_BUCKET        bucket name (default: "faithhill-media")
SUPABASE_REGION        S3 region for Supabase Storage (default: "us-east-1")

The bucket must exist and be marked public; see DEPLOYMENT.md.
"""

from functools import cached_property

from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

DEFAULT_BUCKET = "faithhill-media"


@deconstructible
class SupabaseStorage(Storage):
    """S3-protocol storage pointed at a Supabase Storage bucket."""

    def __init__(self, bucket: str | None = None, **kwargs):
        from django.conf import settings as dj_settings

        self.bucket = bucket or getattr(
            dj_settings, "SUPABASE_BUCKET", DEFAULT_BUCKET
        )
        self._settings = dj_settings
        super().__init__(**kwargs)

    # -- configuration -----------------------------------------------------

    @property
    def project_ref(self) -> str:
        return self._settings.SUPABASE_PROJECT_REF

    @property
    def endpoint_url(self) -> str:
        return f"https://{self.project_ref}.supabase.co/storage/v1/s3"

    @property
    def public_base_url(self) -> str:
        return (
            f"https://{self.project_ref}.supabase.co/storage/v1/object/public/"
            f"{self.bucket}"
        )

    @cached_property
    def client(self):
        import boto3
        from botocore.config import Config

        return boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=getattr(self._settings, "SUPABASE_REGION", "us-east-1"),
            aws_access_key_id=self._settings.SUPABASE_ACCESS_KEY or self.project_ref,
            aws_secret_access_key=self._settings.SUPABASE_SERVICE_KEY,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                retries={"max_attempts": 3, "mode": "standard"},
            ),
        )

    # -- Django Storage API ------------------------------------------------

    def _normalize(self, name: str) -> str:
        return name.replace("\\", "/").lstrip("/")

    def _open(self, name, mode="rb"):
        key = self._normalize(name)
        obj = self.client.get_object(Bucket=self.bucket, Key=key)
        return obj["Body"]

    def _save(self, name, content):
        key = self._normalize(name)
        extra = {}
        content_type = getattr(content, "content_type", None)
        if content_type:
            extra["ContentType"] = content_type
        # Public + cacheable: images are content-addressed by Django's
        # get_available_name(), so a year of caching is safe.
        extra["CacheControl"] = "public, max-age=31536000, immutable"
        self.client.upload_fileobj(
            content, self.bucket, key, ExtraArgs=extra or None
        )
        return key

    def delete(self, name):
        if not name:
            return
        try:
            self.client.delete_object(Bucket=self.bucket, Key=self._normalize(name))
        except Exception:  # noqa: BLE001 - deleting a missing key is fine
            pass

    def exists(self, name) -> bool:
        from botocore.exceptions import ClientError

        try:
            self.client.head_object(Bucket=self.bucket, Key=self._normalize(name))
            return True
        except ClientError:
            return False

    def url(self, name) -> str:
        if not name:
            return ""
        return f"{self.public_base_url}/{self._normalize(name)}"

    def size(self, name) -> int:
        obj = self.client.head_object(Bucket=self.bucket, Key=self._normalize(name))
        return obj["ContentLength"]

    def get_modified_time(self, name):
        from datetime import timezone

        obj = self.client.head_object(Bucket=self.bucket, Key=self._normalize(name))
        return obj["LastModified"].astimezone(timezone.utc)

    # Supabase Storage has no cheap "list everything" equivalent and Django
    # only needs these for management commands, so they stay unimplemented.
    def listdir(self, path):
        raise NotImplementedError("SupabaseStorage does not support listdir().")
