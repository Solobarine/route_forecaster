import type { RouteData } from "../types/route-map";

export default function RouteSummary({
  route,
  recommended,
}: {
  route: RouteData;
  recommended: boolean;
}) {
  return (
    <div className="min-w-55 space-y-2 text-sm">
      <h3 className="font-bold text-base">Route {route.route_id}</h3>

      {recommended && (
        <div className="text-green-600 font-semibold">Recommended route</div>
      )}

      <div>Distance: {route.distance_miles.toFixed(1)} miles</div>

      <div>Duration: {route.duration_hours.toFixed(2)} hours</div>

      <div>Arrival: {route.arrival_time}</div>
      <div>Average risk: {route.average_risk}</div>

      <hr />

      <div>Severe miles: {route.risk_miles.Severe.toFixed(1)}</div>

      <div>High miles: {route.risk_miles.High.toFixed(1)}</div>

      <div>No Travel miles: {route.risk_miles["No Travel"].toFixed(1)}</div>
    </div>
  );
}
