import uuid

from django.db import migrations, models


def populate_event_uuids(apps, schema_editor):
    Event = apps.get_model("event", "Event")
    for event in Event.objects.filter(uuid__isnull=True).iterator():
        event.uuid = uuid.uuid4()
        event.save(update_fields=["uuid"])


class Migration(migrations.Migration):
    dependencies = [("event", "0012_event_location_place_id")]

    operations = [
        migrations.AddField(
            model_name="event",
            name="uuid",
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(
            populate_event_uuids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="event",
            name="uuid",
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                unique=True,
            ),
        ),
    ]
