from rest_framework import serializers


class TripIn(serializers.Serializer):
    current_location = serializers.CharField(max_length=500, trim_whitespace=True)
    pickup_location = serializers.CharField(max_length=500, trim_whitespace=True)
    dropoff_location = serializers.CharField(max_length=500, trim_whitespace=True)
    current_cycle_used_hrs = serializers.FloatField(min_value=0.0, max_value=70.0)
    trip_start = serializers.DateTimeField(required=False, allow_null=True)
    time_zone = serializers.CharField(
        default="America/Chicago",
        max_length=100,
    )
