
import math
import json
import requests

from django.conf import settings
from datetime import datetime, timedelta, timezone

ORS_API_KEY = settings.ORS_API_KEY

ORS_URL = (
    "https://api.openrouteservice.org/v2/"
    "directions/driving-hgv/geojson"
)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

MILES_TO_METERS = 1609.344

RISK_SCORE = {
    "Low": 0,
    "Moderate": 1,
    "High": 2,
    "Severe": 3,
    "No Travel": 4
}

RISK_COLORS = {
    "Low": "#16a34a",
    "Moderate": "#eab308",
    "High": "#f97316",
    "Severe": "#dc2626",
    "No Travel": "#7f1d1d"
}

# --------------------------------------------------
# DISTANCE AND GEOMETRY
# --------------------------------------------------

def haversine(a, b):
    """Distance between two [longitude, latitude] points."""

    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    value = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 6371000 * 2 * math.asin(math.sqrt(value))

def interpolate_route(coords, interval_miles):
    """
    Generate checkpoints at regular distance intervals.
    Returns [longitude, latitude, distance_from_start_meters].
    """

    if len(coords) < 2:
        raise ValueError("Route must contain at least two coordinates.")

    cumulative = [0.0]

    for i in range(1, len(coords)):
        cumulative.append(
            cumulative[-1] + haversine(coords[i - 1], coords[i])
        )

    total_distance = cumulative[-1]
    interval = interval_miles * MILES_TO_METERS

    distances = list(
        range(0, int(total_distance), int(interval))
    )

    distances.append(total_distance)

    checkpoints = []

    for target in distances:
        if target == total_distance:
            point = coords[-1]

        else:
            index = next(
                i for i in range(1, len(cumulative))
                if cumulative[i] >= target
            )

            segment_start = cumulative[index - 1]
            segment_end = cumulative[index]

            ratio = (
                (target - segment_start)
                / max(segment_end - segment_start, 1)
            )

            start = coords[index - 1]
            end = coords[index]

            point = [
                start[0] + ratio * (end[0] - start[0]),
                start[1] + ratio * (end[1] - start[1])
            ]

        checkpoints.append({
            "coordinates": point,
            "distance_miles": target / MILES_TO_METERS
        })

    return checkpoints

# --------------------------------------------------
# WEATHER RISK CLASSIFICATION
# --------------------------------------------------

def classify_weather(wind, rain, snow, load_weight_lbs):
    """
    Classify checkpoint weather using the supplied rules.

    Wind: mph
    Rain: inches/hour
    Snow: inches/hour
    """

    # Wind classification
    if wind >= 55:
        wind_risk = "No Travel"
    elif wind >= 45:
        wind_risk = "Severe"
    elif wind >= 35:
        wind_risk = "High"
    elif wind >= 25:
        wind_risk = "Moderate"
    else:
        wind_risk = "Low"

    # Rain classification
    if rain > 1.00:
        rain_risk = "No Travel"
    elif rain >= 0.50:
        rain_risk = "Severe"
    elif rain >= 0.25:
        rain_risk = "High"
    elif rain >= 0.10:
        rain_risk = "Moderate"
    else:
        rain_risk = "Low"

    # Snow classification
    if snow > 3.00:
        snow_risk = "No Travel"
    elif snow >= 2.00:
        snow_risk = "Severe"
    elif snow >= 1.00:
        snow_risk = "High"
    elif snow >= 0.50:
        snow_risk = "Moderate"
    else:
        snow_risk = "Low"

    # Combine weather risks
    risks = [wind_risk, rain_risk, snow_risk]

    risk = max(risks, key=lambda x: RISK_SCORE[x])

    # Load-specific overrides
    if wind >= 55:
        risk = "No Travel"

    elif 45 <= wind < 55 and load_weight_lbs > 30000:
        risk = "No Travel"

    elif 35 <= wind < 45 and load_weight_lbs > 40000:
        risk = "Severe"

    return {
        "risk": risk,
        "wind_risk": wind_risk,
        "rain_risk": rain_risk,
        "snow_risk": snow_risk
    }

# --------------------------------------------------
# WEATHER API
# --------------------------------------------------

def fetch_weather(checkpoints, start_time):
    """
    Fetch weather for multiple checkpoints in batches.

    Open-Meteo returns hourly weather data for each location.
    Uses UTC consistently.
    """

    weather_results = []

    # Batch locations to avoid excessively long requests.
    for offset in range(0, len(checkpoints), 40):

        batch = checkpoints[offset:offset + 40]

        latitudes = [
            str(cp["coordinates"][1]) for cp in batch
        ]

        longitudes = [
            str(cp["coordinates"][0]) for cp in batch
        ]

        params = {
            "latitude": ",".join(latitudes),
            "longitude": ",".join(longitudes),
            "hourly": (
                "wind_speed_10m,"
                "precipitation,"
                "snowfall"
            ),
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timezone": "UTC",
            "forecast_days": 16
        }

        response = requests.get(
            WEATHER_URL,
            params=params,
            timeout=60
        )

        response.raise_for_status()

        data = response.json()

        # Multiple coordinates return a list.
        if isinstance(data, dict):
            data = [data]

        weather_results.extend(data)
    return weather_results

def get_weather_at(weather_data, estimated_arrival):
    """
    Get the closest hourly forecast to the truck's ETA.
    """

    hourly = weather_data["hourly"]

    times = [
        datetime.fromisoformat(t).replace(tzinfo=timezone.utc)
        for t in hourly["time"]
    ]

    index = min(
        range(len(times)),
        key=lambda i: abs(
            (times[i] - estimated_arrival).total_seconds()
        )
    )

    # Open-Meteo snowfall is in cm.
    # Convert to inches per hour.
    snowfall_inches = (
        (hourly["snowfall"][index] or 0) / 2.54
    )

    return {
        "forecast_time": times[index].isoformat(),
        "wind_mph": hourly["wind_speed_10m"][index] or 0,
        "rain_inches_per_hour": (
            hourly["precipitation"][index] or 0
        ),
        "snow_inches_per_hour": snowfall_inches
    }

# --------------------------------------------------
# ROUTE GENERATION
# --------------------------------------------------

def generate_routes(origin, destination):
    """
    Request up to three alternative heavy-goods-vehicle routes.

    Origin/destination must be [longitude, latitude].
    """

    if not ORS_API_KEY:
        raise ValueError("ORS_API_KEY is not configured.")

    payload = {
        "coordinates": [origin, destination],
        "alternative_routes": {
            "target_count": 3,
            "share_factor": 0.8,
            "weight_factor": 1.4
        }
    }

    response = requests.post(
        ORS_URL,
        headers={
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=60
    )

    if not response.ok:
      print("ORS Status:", response.status_code)
      print("ORS Error:", response.text)
      print("ORS Request:", response.request.body)

    response.raise_for_status()

    data = response.json()

    return data["features"]

# --------------------------------------------------
# ROUTE WEATHER ASSESSMENT
# --------------------------------------------------

def assess_route(
    route,
    route_number,
    departure_datetime,
    load_weight_lbs,
    sample_interval_miles
):

    geometry = route["geometry"]
    coordinates = geometry["coordinates"]

    summary = route["properties"]["summary"]

    distance_meters = summary["distance"]
    duration_seconds = summary["duration"]

    checkpoints = interpolate_route(
        coordinates,
        sample_interval_miles
    )

    # Calculate estimated arrival time at every checkpoint.
    for cp in checkpoints:

        progress = (
            cp["distance_miles"] * MILES_TO_METERS
            / max(distance_meters, 1)
        )

        cp["eta"] = (
            departure_datetime
            + timedelta(seconds=duration_seconds * progress)
        )

    weather_data = fetch_weather(
        checkpoints,
        departure_datetime
    )

    risk_miles = {
        "Low": 0.0,
        "Moderate": 0.0,
        "High": 0.0,
        "Severe": 0.0,
        "No Travel": 0.0
    }

    weighted_risk = 0.0
    total_weighted_miles = 0.0

    for index, cp in enumerate(checkpoints):

        # The last checkpoint has no following segment.
        if index + 1 < len(checkpoints):
            segment_miles = (
                checkpoints[index + 1]["distance_miles"]
                - cp["distance_miles"]
            )
        else:
            segment_miles = 0.0

        cp["segment_miles"] = segment_miles

        cp["weather"] = get_weather_at(
            weather_data[index],
            cp["eta"]
        )

        weather = cp["weather"]

        classification = classify_weather(
            wind=weather["wind_mph"],
            rain=weather["rain_inches_per_hour"],
            snow=weather["snow_inches_per_hour"],
            load_weight_lbs=load_weight_lbs
        )

        cp.update(classification)

        risk_miles[cp["risk"]] += segment_miles

        weighted_risk += (
            RISK_SCORE[cp["risk"]] * segment_miles
        )

        total_weighted_miles += segment_miles

        # Forecast risk for every hour on the 0-48 slider.
        cp["forecast_risks"] = []

        for hour in range(49):

            future_eta = cp["eta"] + timedelta(hours=hour)

            future_weather = get_weather_at(
                weather_data[index],
                future_eta
            )

            future_classification = classify_weather(
                wind=future_weather["wind_mph"],
                rain=future_weather["rain_inches_per_hour"],
                snow=future_weather["snow_inches_per_hour"],
                load_weight_lbs=load_weight_lbs
            )

            cp["forecast_risks"].append({
                "risk": future_classification["risk"],
                "weather": future_weather
            })

    average_risk = (
        weighted_risk / total_weighted_miles
        if total_weighted_miles else 0
    )

    return {
        "route_id": route_number,
        "coordinates": coordinates,
        "distance_miles": distance_meters / MILES_TO_METERS,
        "duration_hours": duration_seconds / 3600,
        "arrival_time": (
            departure_datetime
            + timedelta(seconds=duration_seconds)
        ).isoformat(),
        "checkpoints": checkpoints,
        "risk_miles": risk_miles,
        "average_risk": round(average_risk, 3)
    }

# --------------------------------------------------
# ROUTE RECOMMENDATION
# --------------------------------------------------

def recommend_route(routes):
    """
    Rank routes by:
    1. No Travel miles (safety override)
    2. Fewest Severe miles
    3. Fewest High miles
    4. Lowest average risk
    5. Shortest travel time
    """

    ranked = sorted(
        routes,
        key=lambda route: (
            route["risk_miles"]["No Travel"],
            route["risk_miles"]["Severe"],
            route["risk_miles"]["High"],
            route["average_risk"],
            route["duration_hours"]
        )
    )

    return ranked[0]["route_id"]

# --------------------------------------------------
# MAP DATA
# --------------------------------------------------

def create_route_map_data(
    routes,
    recommended_route_id,
    origin,
    destination
):
    return {
        "origin": origin,
        "destination": destination,
        "recommended_route_id": recommended_route_id,
        "routes": [
            {
                "route_id": route["route_id"],
                "coordinates": route["coordinates"],
                "distance_miles": route["distance_miles"],
                "duration_hours": route["duration_hours"],
                "arrival_time": (
                    route["arrival_time"].isoformat()
                    if hasattr(route["arrival_time"], "isoformat")
                    else route["arrival_time"]
                ),
                "average_risk": route["average_risk"],
                "risk_miles": route["risk_miles"],
                "checkpoints": [
                    {
                        "coordinates": cp["coordinates"],
                        "distance_miles": cp["distance_miles"],
                        "eta": (
                            cp["eta"].isoformat()
if hasattr(cp["eta"], "isoformat")
                            else cp["eta"]
                        ),
                        "risk": cp["risk"],
                        "weather": cp["weather"],
                        "forecast_risks": cp["forecast_risks"],
                    }
                    for cp in route["checkpoints"]
                ],
            }
            for route in routes
        ],
    }


# --------------------------------------------------
# MAIN FUNCTION
# --------------------------------------------------

def plan_truck_routes(
    origin,
    destination,
    departure_datetime,
    load_weight_lbs,
    sample_interval_miles=25
):
    """
    Generate, evaluate and visualize three truck routes.

    Coordinates:
        origin: [longitude, latitude]
        destination: [longitude, latitude]

    departure_datetime:
        Timezone-aware datetime.

    load_weight_lbs:
        Total truck load in pounds.

    sample_interval_miles:
        10, 25 or 50 miles.
    """

    if sample_interval_miles not in (10, 25, 50):
        raise ValueError(
            "Sample interval must be 10, 25 or 50 miles."
        )

    if departure_datetime.tzinfo is None:
        raise ValueError(
            "Departure datetime must include a timezone."
        )

    departure_datetime = departure_datetime.astimezone(
        timezone.utc
    )

    if load_weight_lbs < 0:
        raise ValueError("Load weight cannot be negative.")

    # 1. Generate routes.
    raw_routes = generate_routes(origin, destination)

    if not raw_routes:
        raise RuntimeError("Routing API returned no routes.")

    # 2. Assess each route.
    assessed_routes = []

    for index, route in enumerate(raw_routes[:3], start=1):

        assessed_routes.append(
            assess_route(
                route=route,
                route_number=index,
                departure_datetime=departure_datetime,
                load_weight_lbs=load_weight_lbs,
                sample_interval_miles=sample_interval_miles
            )
        )

    # 3. Select best route.
    recommended_id = recommend_route(
        assessed_routes
    ) 

    # 4. Generate map data
    map_data = create_route_map_data(
        routes=assessed_routes,
        recommended_route_id=recommended_id,
        origin=origin,
        destination=destination
    )

    # 5. Return complete results.
    return {
        "recommended_route_id": recommended_id,
        "routes": assessed_routes,
        "map_data": map_data,
    }
