from django.db import models


class Trip(models.Model):
    """A planned trip and its computed HOS-compliant route + log plan.

    Inputs are the four fields required by the assessment. The computed
    plan (route geometry, stops, daily logs) is cached on the row as JSON
    so a trip can be reloaded without re-hitting the geocoding/routing APIs.
    """

    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(
        help_text="Hours already used in the current 70hr/8day cycle."
    )

    # Cached, computed plan returned to the client.
    plan = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip #{self.pk}: {self.pickup_location} -> {self.dropoff_location}"
