import uuid

from django.db import migrations, models


def populate_profile_uuids(apps, schema_editor):
    Profile = apps.get_model("user", "Profile")
    for profile in Profile.objects.filter(uuid__isnull=True).iterator():
        profile.uuid = uuid.uuid4()
        profile.save(update_fields=["uuid"])


class Migration(migrations.Migration):
    dependencies = [("user", "0017_alter_profile_has_seen_feed_tour")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="uuid",
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(
            populate_profile_uuids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="profile",
            name="uuid",
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                unique=True,
            ),
        ),
    ]
