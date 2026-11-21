import json

from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from core.services import route_planner

@csrf_exempt
@require_POST
def plan_truck_routes(request):
    data = json.loads(request.body)

    departure_datetime = datetime.fromisoformat(
      data["departure_datetime"].replace("Z", "+00:00")
    )

    response = route_planner.plan_truck_routes(data["origin"], data["destination"], departure_datetime, data["load_weight_lbs"], sample_interval_miles=25)
    return JsonResponse(response)
