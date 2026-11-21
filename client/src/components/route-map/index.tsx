import { useMemo, useState } from "react";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";

import L from "leaflet";

import type {
  ForecastRisk,
  RiskLevel,
  RouteCheckpoint,
  RouteData,
  RouteMapData,
} from "../../types/route-map";

import "leaflet/dist/leaflet.css";
import ForecastControls from "./forecast-controls";
import RouteVisibility from "./route-visibility";
import FitRoutes from "./fit-routes";
import WeatherHeatmap from "./weather-heatmap";
import RouteSummary from "./route-summary";
import CheckpointMarker from "./checkpoint-marker";

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Moderate: "#eab308",
  High: "#f97316",
  Severe: "#dc2626",
  "No Travel": "#7f1d1d",
};

const RISK_ORDER: RiskLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Severe",
  "No Travel",
];

const ROUTE_COLORS = ["#2563eb", "#9333ea", "#0891b2"];

function coordinatesToPosition(
  coordinates: [number, number],
): [number, number] {
  const [longitude, latitude] = coordinates;
  return [latitude, longitude];
}

function getRouteColor(route: RouteData, recommendedRouteId: number) {
  if (route.route_id === recommendedRouteId) {
    return "#16a34a";
  }

  return ROUTE_COLORS[(route.route_id - 1) % ROUTE_COLORS.length];
}

function getForecast(
  checkpoint: RouteCheckpoint,
  forecastHour: number,
): ForecastRisk | undefined {
  return checkpoint.forecast_risks?.[forecastHour] as ForecastRisk | undefined;
}

function getCheckpointRisk(
  checkpoint: RouteCheckpoint,
  forecastHour: number,
): RiskLevel {
  return getForecast(checkpoint, forecastHour)?.risk ?? checkpoint.risk;
}

// Return the worst risk between two checkpoints.
// This makes the heatmap conservative when conditions change
// between adjacent forecast locations.
function getSegmentRisk(
  first: RouteCheckpoint,
  second: RouteCheckpoint,
  forecastHour: number,
): RiskLevel {
  const firstRisk = getCheckpointRisk(first, forecastHour);
  const secondRisk = getCheckpointRisk(second, forecastHour);

  return RISK_ORDER.indexOf(firstRisk) >= RISK_ORDER.indexOf(secondRisk)
    ? firstRisk
    : secondRisk;
}

const originIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      background:#16a34a;
      width:18px;
      height:18px;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 1px 6px #555;
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      background:#dc2626;
      width:18px;
      height:18px;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 1px 6px #555;
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function RouteMap({ data }: { data: RouteMapData }) {
  const [forecastHour, setForecastHour] = useState(0);

  // Track hidden routes rather than visible routes.
  // Newly added routes are automatically visible.
  const [hiddenRoutes, setHiddenRoutes] = useState<Set<number>>(
    () => new Set(),
  );

  const visibleRoutes = useMemo(
    () =>
      new Set(
        data.routes
          .filter((route) => !hiddenRoutes.has(route.route_id))
          .map((route) => route.route_id),
      ),
    [data.routes, hiddenRoutes],
  );

  const toggleRoute = (routeId: number) => {
    setHiddenRoutes((previous) => {
      const next = new Set(previous);

      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }

      return next;
    });
  };

  const toggleAllRoutes = () => {
    setHiddenRoutes((previous) => {
      const allVisible = data.routes.every(
        (route) => !previous.has(route.route_id),
      );

      return allVisible
        ? new Set(data.routes.map((route) => route.route_id))
        : new Set();
    });
  };

  // Recalculate visible checkpoint risk counts whenever
  // the forecast hour or visible routes change.
  const counts = useMemo(() => {
    const result: Record<RiskLevel, number> = {
      Low: 0,
      Moderate: 0,
      High: 0,
      Severe: 0,
      "No Travel": 0,
    };

    data.routes
      .filter((route) => visibleRoutes.has(route.route_id))
      .forEach((route) => {
        route.checkpoints.forEach((checkpoint) => {
          const risk = getCheckpointRisk(checkpoint, forecastHour);

          result[risk]++;
        });
      });

    return result;
  }, [data.routes, forecastHour, visibleRoutes]);

  return (
    <div className="relative w-full h-162.5 rounded-xl overflow-hidden border">
      <MapContainer
        style={{ height: "650px", width: "100%" }}
        center={coordinatesToPosition(data.origin)}
        zoom={7}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRoutes data={data} coordinatesToPosition={coordinatesToPosition} />

        {/* Weather heatmap: rendered beneath route lines */}
        {data.routes
          .filter((route) => visibleRoutes.has(route.route_id))
          .map((route) => (
            <WeatherHeatmap
              key={`heatmap-${route.route_id}`}
              route={route}
              forecastHour={forecastHour}
              riskColors={RISK_COLORS}
              coordinatesToPosition={coordinatesToPosition}
              getCheckpointRisk={getCheckpointRisk}
              getSegmentRisk={getSegmentRisk}
            />
          ))}

        {/* Route lines */}
        {data.routes
          .filter((route) => visibleRoutes.has(route.route_id))
          .map((route) => {
            const recommended = route.route_id === data.recommended_route_id;

            const color = getRouteColor(route, data.recommended_route_id);

            const positions = route.coordinates.map(coordinatesToPosition);

            return (
              <Polyline
                key={route.route_id}
                positions={positions}
                pathOptions={{
                  color,
                  weight: recommended ? 6 : 4,
                  opacity: 0.9,
                }}
              >
                <Tooltip sticky>
                  Route {route.route_id}
                  {recommended ? " - Recommended" : ""}
                </Tooltip>

                <Popup>
                  <RouteSummary route={route} recommended={recommended} />
                </Popup>
              </Polyline>
            );
          })}

        {/* Weather checkpoints */}
        {data.routes
          .filter((route) => visibleRoutes.has(route.route_id))
          .map((route) =>
            route.checkpoints.map((checkpoint, index) => (
              <CheckpointMarker
                key={`${route.route_id}-${index}`}
                checkpoint={checkpoint}
                routeId={route.route_id}
                forecastHour={forecastHour}
                riskColors={RISK_COLORS}
                coordinatesToPosition={coordinatesToPosition}
                getForecast={getForecast}
              />
            )),
          )}

        {/* Route summary markers */}
        {data.routes
          .filter((route) => visibleRoutes.has(route.route_id))
          .map((route) => {
            const recommended = route.route_id === data.recommended_route_id;

            const firstCoordinate = route.coordinates[0];

            if (!firstCoordinate) return null;

            return (
              <Marker
                key={`summary-${route.route_id}`}
                position={coordinatesToPosition(firstCoordinate)}
              >
                <Popup>
                  <RouteSummary route={route} recommended={recommended} />
                </Popup>
              </Marker>
            );
          })}

        {/* Origin */}
        <Marker
          position={coordinatesToPosition(data.origin)}
          icon={originIcon}
          interactive={false}
        >
          <Tooltip permanent>Origin</Tooltip>
        </Marker>

        {/* Destination */}
        <Marker
          position={coordinatesToPosition(data.destination)}
          icon={destinationIcon}
          interactive={false}
        >
          <Tooltip permanent>Destination</Tooltip>
        </Marker>
      </MapContainer>

      {/* Route visibility */}
      <RouteVisibility
        routes={data.routes}
        visibleRoutes={visibleRoutes}
        recommendedRouteId={data.recommended_route_id}
        onToggle={toggleRoute}
        onToggleAll={toggleAllRoutes}
        getRouteColor={getRouteColor}
      />

      {/* Forecast slider and legend */}
      <ForecastControls
        hour={forecastHour}
        onChange={setForecastHour}
        counts={counts}
        riskOrder={RISK_ORDER}
        riskColors={RISK_COLORS}
      />
    </div>
  );
}
