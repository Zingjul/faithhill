"""
YouTube helpers.

Staff paste whatever YouTube gives them — a share link, a browser URL, or an
embed snippet. These helpers turn any of those into a canonical watch URL plus
a thumbnail image, so the database always stores clean, predictable data and
the public site can render a poster frame before the video is played.
"""

import re
from urllib.parse import parse_qs, urlparse

# Covers /watch?v=, /embed/, /shorts/, /live/, youtu.be/<id>
_PATTERNS = [
    re.compile(r"(?:youtube\.com|youtube-nocookie\.com)/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,})"),
    re.compile(r"(?:youtube\.com|youtube-nocookie\.com)/embed/([A-Za-z0-9_-]{6,})"),
    re.compile(r"(?:youtube\.com|youtube-nocookie\.com)/shorts/([A-Za-z0-9_-]{6,})"),
    re.compile(r"(?:youtube\.com|youtube-nocookie\.com)/live/([A-Za-z0-9_-]{6,})"),
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{6,})"),
]


def extract_video_id(url: str) -> str | None:
    """Return the YouTube video id from any common YouTube URL shape."""
    if not url:
        return None
    url = url.strip()

    # Someone pasted an <iframe src="..."> snippet.
    if "<iframe" in url:
        match = re.search(r'src=["\']([^"\']+)["\']', url)
        if match:
            url = match.group(1)

    # A bare video id (11 chars) is a reasonable thing for staff to paste.
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url

    for pattern in _PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)

    # Last resort: any URL with a ?v= parameter.
    try:
        query = parse_qs(urlparse(url).query)
    except ValueError:
        return None
    values = query.get("v")
    if values and re.fullmatch(r"[A-Za-z0-9_-]{6,}", values[0]):
        return values[0]
    return None


def normalize_video_url(url: str) -> str:
    """
    Store a canonical, readable watch URL.

    Non-YouTube URLs (Vimeo, self-hosted MP4) are passed through untouched so
    the model stays provider-agnostic.
    """
    video_id = extract_video_id(url)
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    return url.strip()


def youtube_thumbnail(url: str) -> str | None:
    """
    Thumbnail URL for a YouTube video.

    `hqdefault` always exists (maxresdefault is missing on some uploads), and
    it is served from YouTube's CDN — so no storage cost and no broken image
    when a staff member forgets to upload a custom thumbnail.
    """
    video_id = extract_video_id(url)
    if not video_id:
        return None
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
