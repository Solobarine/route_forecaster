import type { RouteMapData } from "./route-map";

export type CoordinatePair = [number, number];

export interface PlanSearch {
  origin?: string;
  destination?: string;
  departure_datetime?: string;
  load_weight_lbs?: string;
}

export interface PlanRequest {
  origin: CoordinatePair;
  destination: CoordinatePair;
  departure_datetime: string;
  load_weight_lbs: number;
}

export interface WeatherData {
  wind_mph: number;
  rain_inches_per_hour: number;
  snow_inches_per_hour: number;
}

export type RiskLevel = "Low" | "Moderate" | "High" | "Severe" | "No Travel";

export interface ForecastRisk {
  risk: RiskLevel;
  weather: WeatherData;
}

export interface RouteCheckpoint {
  coordinates: CoordinatePair;
  distance_miles: number;
  eta: string;
  risk: RiskLevel;
  weather: WeatherData;
  forecast_risks: ForecastRisk[];
}

export interface RoutePlan {
  route_id: number;
  coordinates: CoordinatePair[];
  distance_miles: number;
  duration_hours: number;
  arrival_time: string;
  average_risk: number | string;
  risk_miles: {
    Severe: number;
    High: number;
    "No Travel": number;
  };
  checkpoints: RouteCheckpoint[];
}

export interface PlanResponse {
  recommended_route_id: number;
  routes: RoutePlan[];
  map_data: RouteMapData;
  map_html?: string;
  map?: string;
}
