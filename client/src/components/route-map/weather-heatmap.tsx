import { CircleMarker, Polyline } from "react-leaflet";
import type {
  RiskLevel,
  RouteCheckpoint,
  RouteData,
} from "../../types/route-map";

// Weather heatmap along the route corridor.
export default function WeatherHeatmap({
  route,
  forecastHour,
  riskColors,
  coordinatesToPosition,
  getCheckpointRisk,
  getSegmentRisk,
}: {
  route: RouteData;
  forecastHour: number;
  riskColors: Record<RiskLevel, string>;
  coordinatesToPosition: (coordinates: [number, number]) => [number, number];
  getCheckpointRisk: (
    checkpoint: RouteCheckpoint,
    forecastHour: number,
  ) => RiskLevel;
  getSegmentRisk: (
    checkpoint: RouteCheckpoint,
    nextCheckpoint: RouteCheckpoint,
    forecastHour: number,
  ) => RiskLevel;
}) {
  const checkpoints = route.checkpoints;

  if (checkpoints.length === 0) return null;

  // A single checkpoint still gets a visible heatmap indicator.
  if (checkpoints.length === 1) {
    const checkpoint = checkpoints[0];
    const risk = getCheckpointRisk(checkpoint, forecastHour);
    const color = riskColors[risk];

    return (
      <CircleMarker
        center={coordinatesToPosition(checkpoint.coordinates)}
        radius={16}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
          opacity: 0.5,
        }}
        interactive={false}
      />
    );
  }

  return (
    <>
      {checkpoints.slice(0, -1).map((checkpoint, index) => {
        const nextCheckpoint = checkpoints[index + 1];

        const risk = getSegmentRisk(checkpoint, nextCheckpoint, forecastHour);

        const color = riskColors[risk];

        const positions = [
          coordinatesToPosition(checkpoint.coordinates),
          coordinatesToPosition(nextCheckpoint.coordinates),
        ];

        return (
          <Polyline
            key={`heat-${route.route_id}-${index}`}
            positions={positions}
            pathOptions={{
              color,
              weight: 20,
              opacity: 0.35,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
        );
      })}

      {/* Heatmap intensity around individual checkpoints */}
      {checkpoints.map((checkpoint, index) => {
        const risk = getCheckpointRisk(checkpoint, forecastHour);

        const color = riskColors[risk];

        return (
          <CircleMarker
            key={`heat-point-${route.route_id}-${index}`}
            center={coordinatesToPosition(checkpoint.coordinates)}
            radius={13}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.3,
              weight: 1,
              opacity: 0.4,
            }}
            interactive={false}
          />
        );
      })}
    </>
  );
}
