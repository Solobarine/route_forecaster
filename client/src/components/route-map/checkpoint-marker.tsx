import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { RiskLevel } from "../../types/results";
import type {
  ForecastRisk,
  RouteCheckpoint,
  WeatherData,
} from "../../types/route-map";

function WeatherDetails({ weather }: { weather: WeatherData }) {
  return (
    <div className="text-sm space-y-1 mt-2">
      <div>Wind: {weather.wind_mph.toFixed(1)} mph</div>
      <div>Rain: {weather.rain_inches_per_hour.toFixed(2)} in/hr</div>
      <div>Snow: {weather.snow_inches_per_hour.toFixed(2)} in/hr</div>
    </div>
  );
}

export default function CheckpointMarker({
  checkpoint,
  routeId,
  forecastHour,
  riskColors,
  getForecast,
  coordinatesToPosition,
}: {
  checkpoint: RouteCheckpoint;
  routeId: number;
  forecastHour: number;
  riskColors: Record<RiskLevel, string>;
  coordinatesToPosition: (coordinates: [number, number]) => [number, number];
  getForecast: (
    checkpoint: RouteCheckpoint,
    forecastHour: number,
  ) => ForecastRisk | undefined;
}) {
  const forecast = getForecast(checkpoint, forecastHour);

  const risk = forecast?.risk ?? checkpoint.risk;
  const weather = forecast?.weather ?? checkpoint.weather;

  const color = riskColors[risk];

  return (
    <CircleMarker
      center={coordinatesToPosition(checkpoint.coordinates)}
      radius={7}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }}
    >
      <Tooltip>
        Route {routeId}: {risk} risk
      </Tooltip>

      <Popup>
        <div className="min-w-45">
          <strong>Route {routeId}</strong>

          <div className="mt-1">
            Distance: {checkpoint.distance_miles.toFixed(1)} miles
          </div>

          <div>ETA: {checkpoint.eta}</div>

          <div className="font-semibold mt-2">Forecast risk: {risk}</div>

          <WeatherDetails weather={weather} />
        </div>
      </Popup>
    </CircleMarker>
  );
}
