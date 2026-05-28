from datetime import datetime, time, timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Trip
from .serializers import TripInputSerializer, TripSerializer
from .services.geocoding import GeocodingError, geocode
from .services.routing import RoutingError, get_route
from .services.hos_planner import plan_trip

# Trips start the duty day at 08:00 home-terminal time on the current date.
DEFAULT_START_HOUR = 8


def _default_start_time() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime.combine(
        now.date(), time(hour=DEFAULT_START_HOUR), tzinfo=timezone.utc
    )


@api_view(["POST"])
def plan_view(request):
    """Geocode the inputs, compute the route, run the HOS planner, persist
    the trip, and return the full plan."""
    serializer = TripInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # 1. Geocode the three locations.
    try:
        current = geocode(data["current_location"])
        pickup = geocode(data["pickup_location"])
        dropoff = geocode(data["dropoff_location"])
    except GeocodingError as exc:
        return Response(
            {"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST
        )

    # 2. Route current -> pickup -> dropoff.
    try:
        route = get_route([current, pickup, dropoff])
    except RoutingError as exc:
        return Response(
            {"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
        )

    if len(route.legs) < 2:
        return Response(
            {"error": "Routing did not return the expected legs."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # 3. Run the HOS simulation.
    plan = plan_trip(
        current=current,
        pickup=pickup,
        dropoff=dropoff,
        route=route,
        cycle_used=data["current_cycle_used"],
        start_time=_default_start_time(),
    )

    # 4. Attach geo + route context for the map.
    plan["route"] = route.as_dict()
    plan["locations"] = {
        "current": current.as_dict(),
        "pickup": pickup.as_dict(),
        "dropoff": dropoff.as_dict(),
    }

    # 5. Persist for history / reload.
    trip = Trip.objects.create(
        current_location=data["current_location"],
        pickup_location=data["pickup_location"],
        dropoff_location=data["dropoff_location"],
        current_cycle_used=data["current_cycle_used"],
        plan=plan,
    )

    return Response(
        {"id": trip.id, "inputs": serializer.data, "plan": plan},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def trip_detail_view(request, pk):
    try:
        trip = Trip.objects.get(pk=pk)
    except Trip.DoesNotExist:
        return Response(
            {"error": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
        )
    return Response(
        {
            "id": trip.id,
            "inputs": TripSerializer(trip).data,
            "plan": trip.plan,
        }
    )
