export type RiskLevel = "Low" | "Moderate" | "High" | "Severe" | "No Travel";

export type Coordinates = [number, number];

export interface RouteCheckpoint {
  coordinates: Coordinates;
  distance_miles: number;
  eta: string;
  risk: RiskLevel;
  weather: WeatherData;
  forecast_risks: ForecastRisk[];
}

export interface RouteMapData {
  origin: Coordinates;
  destination: Coordinates;
  recommended_route_id: number;
  routes: RouteData[];
}

export interface WeatherData {
  wind_mph: number;
  rain_inches_per_hour: number;
  snow_inches_per_hour: number;
}

export interface ForecastRisk {
  risk: RiskLevel;
  weather: WeatherData;
}

export interface RouteRiskMiles {
  Severe: number;
  High: number;
  "No Travel": number;
}

export interface RouteData {
  route_id: number;
  coordinates: [number, number][];
  distance_miles: number;
  duration_hours: number;
  arrival_time: string;
  average_risk: RiskLevel;
  risk_miles: RouteRiskMiles;
  checkpoints: RouteCheckpoint[];
}
