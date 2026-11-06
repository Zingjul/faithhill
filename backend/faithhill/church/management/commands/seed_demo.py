"""Seed demo content so the API has data during development.

Idempotent — safe to run multiple times (uses get_or_create on natural keys).
Run with: python manage.py seed_demo
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from church.models import (
    Announcement,
    Belief,
    Event,
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


class Command(BaseCommand):
    help = "Create demo church content for development (idempotent)."

    def handle(self, *args, **options):
        created = []

        archbishop, c = StaffProfile.objects.get_or_create(
            name="ArchBishop Emmanuel Musa Jatau",
            defaults={
                "role": "ArchBishop & Founder",
                "summary": "Founder and presiding ArchBishop of Faith Hill "
                "Prophetic Assembly Church.",
                "order": 0,
            },
        )
        created.append(("StaffProfile: ArchBishop", c))

        admin_profile, c = StaffProfile.objects.get_or_create(
            name="Chioma Adebayo (sample)",
            defaults={
                "role": "Church Administrator",
                "summary": "Coordinates church operations and member care.",
                "order": 1,
            },
        )
        created.append(("StaffProfile: Administrator (sample)", c))

        services = [
            ("Sunday Worship Service", ServiceTime.SUNDAY, "09:00", "11:30", ""),
            ("Wednesday Bible Study", ServiceTime.WEDNESDAY, "18:00", "19:30", ""),
            ("Friday Prophetic Service", ServiceTime.FRIDAY, "18:00", "20:00", ""),
        ]
        for name, day, start, end, notes in services:
            _, c = ServiceTime.objects.get_or_create(
                name=name,
                defaults={
                    "day_of_week": day,
                    "start_time": start,
                    "end_time": end,
                    "notes": notes,
                },
            )
            created.append((f"ServiceTime: {name}", c))

        beliefs = [
            ("The Bible", "We believe the Bible is the inspired, infallible Word of God."),
            ("The Trinity", "We believe in one God, eternally existing in three persons: Father, Son and Holy Spirit."),
            ("Salvation", "We believe salvation is received by grace through faith in Jesus Christ."),
            ("The Holy Spirit", "We believe in the present-day ministry and gifts of the Holy Spirit, including the prophetic."),
            ("The Second Coming", "We believe Jesus Christ will return in glory to gather His Church."),
        ]
        for i, (title, desc) in enumerate(beliefs):
            _, c = Belief.objects.get_or_create(
                title=title, defaults={"description": desc, "order": i}
            )
            created.append((f"Belief: {title}", c))

        values = [
            ("Word-Centred", "Everything we do flows from the teaching of Scripture."),
            ("Prayer", "Prayer is the engine room of Faith Hill — we seek God first."),
            ("Love & Fellowship", "A family where everyone belongs, regardless of background."),
            ("Excellence", "We serve God and people with our very best."),
        ]
        for i, (title, desc) in enumerate(values):
            _, c = Value.objects.get_or_create(
                title=title, defaults={"description": desc, "order": i}
            )
            created.append((f"Value: {title}", c))

        steps = [
            ("Connect", "Join a community group and find your people.", "/connect", "users"),
            ("Pray", "Submit a prayer request — our team prays over every one.", "/pray", "hands"),
            ("Contact", "Reach out with any question at all.", "/contact", "mail"),
            ("Give", "Partner with what God is doing here.", "/give", "gift"),
        ]
        for i, (title, desc, link, icon) in enumerate(steps):
            _, c = NextStep.objects.get_or_create(
                title=title,
                defaults={"description": desc, "link": link, "icon": icon, "order": i},
            )
            created.append((f"NextStep: {title}", c))

        ministries = [
            ("Worship & Music", "Leading the congregation into God's presence every service."),
            ("Children's Church", "Nurturing the next generation in the knowledge of Christ."),
            ("Media & Technical", "Sound, screens and streams — carrying the message beyond the walls."),
            ("Ushering & Hospitality", "The first smile every visitor meets at the door."),
        ]
        for i, (name, summary) in enumerate(ministries):
            _, c = Ministry.objects.get_or_create(
                name=name, defaults={"summary": summary, "order": i}
            )
            created.append((f"Ministry: {name}", c))

        series, c = SermonSeries.objects.get_or_create(
            title="Foundations of Faith",
            defaults={"description": "A series on the bedrock truths of Christianity."},
        )
        created.append((f"SermonSeries: {series.title}", c))

        sermons = [
            ("Why Faith Still Moves Mountains", "Hebrews 11:1-6", "Faith", 0),
            ("The God Who Speaks", "1 Samuel 3:1-10", "Hearing God", 7),
        ]
        for title, scripture, topic, days_ago in sermons:
            _, c = Sermon.objects.get_or_create(
                title=title,
                defaults={
                    "series": series,
                    "speaker": "ArchBishop Emmanuel Musa Jatau",
                    "sermon_date": timezone.localdate() - timedelta(days=days_ago),
                    "scripture": scripture,
                    "topic": topic,
                    "description": "Sermon summary goes here.",
                },
            )
            created.append((f"Sermon: {title}", c))

        def next_weekday(weekday):
            today = timezone.localdate()
            delta = (weekday - today.weekday()) % 7 or 7
            return timezone.make_aware(
                timezone.datetime.combine(
                    today + timedelta(days=delta), timezone.datetime.min.time()
                )
            )

        event1, c = Event.objects.get_or_create(
            title="Sunday Thanksgiving Service",
            defaults={
                "summary": "A special first-Sunday thanksgiving celebration.",
                "start_datetime": next_weekday(6) + timedelta(hours=9),
                "location": "Faith Hill Auditorium",
                "is_featured": True,
            },
        )
        created.append((f"Event: {event1.title}", c))

        event2, c = Event.objects.get_or_create(
            title="Night of Wonders (Vigil)",
            defaults={
                "summary": "An all-night prophetic worship and prayer vigil.",
                "start_datetime": next_weekday(4) + timedelta(hours=22),
                "end_datetime": next_weekday(4) + timedelta(days=1, hours=4),
                "location": "Faith Hill Auditorium",
                "is_featured": True,
                "rsvp_enabled": True,
            },
        )
        created.append((f"Event: {event2.title}", c))

        _, c = Announcement.objects.get_or_create(
            title="Welcome to the new Faith Hill website!",
            defaults={
                "body": "We are glad you are here. Explore sermons, events and "
                "ways to connect with the family.",
                "expire_at": timezone.now() + timedelta(days=30),
            },
        )
        created.append(("Announcement: Welcome", c))

        _, c = GivingOption.objects.get_or_create(
            label="Bank Transfer",
            defaults={
                "instructions": "Account details to be published here. "
                "Use your phone number as reference.",
                "order": 0,
            },
        )
        created.append(("GivingOption: Bank Transfer", c))

        _, c = Testimony.objects.get_or_create(
            name="Blessing O. (sample)",
            defaults={
                "body": "I walked into Faith Hill broken, and found a family "
                "that prayed me back to wholeness.",
                "is_approved": True,
            },
        )
        created.append(("Testimony: sample", c))

        User = get_user_model()
        user, c = User.objects.get_or_create(
            username="admin", defaults={"is_staff": True, "is_superuser": True}
        )
        if c:
            user.set_password("admin123")
            user.save()
        created.append(("User: admin (password: admin123)", c))

        self.stdout.write("")
        for label, was_created in created:
            mark = "+" if was_created else "·"
            self.stdout.write(f"  {mark} {label}")
        self.stdout.write(self.style.SUCCESS("\nDemo content ready."))
