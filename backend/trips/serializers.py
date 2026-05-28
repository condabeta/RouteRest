from rest_framework import serializers

from .models import Trip


class TripInputSerializer(serializers.Serializer):
    """Validates the four required trip inputs from the client."""

    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)

    def validate_current_cycle_used(self, value):
        if value < 0 or value > 70:
            raise serializers.ValidationError(
                "Current cycle used must be between 0 and 70 hours."
            )
        return value


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "plan",
            "created_at",
        ]
        read_only_fields = ["id", "plan", "created_at"]
