import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RouteMap } from "../components/route-map/index";
import type {
  CoordinatePair,
  PlanRequest,
  PlanResponse,
  PlanSearch,
  RiskLevel,
} from "../types/results";
import { ChevronDown, ChevronUp } from "lucide-react";
import Loading from "../components/loading";

// Parse a coordinate search parameter.
// Supports JSON arrays and comma-separated coordinates.
function parseCoordinate(
  value: string | undefined,
  name: string,
): CoordinatePair {
  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value.split(",").map((part) => part.trim());
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length !== 2 ||
    !parsed.every(
      (item) =>
        (typeof item === "number" ||
          (typeof item === "string" && item.trim() !== "")) &&
        Number.isFinite(Number(item)),
    )
  ) {
    throw new Error(
      `${name} must be a valid coordinate array: [longitude, latitude].`,
    );
  }

  const [longitude, latitude] = parsed.map(Number);

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error(
      `${name} contains coordinates outside valid longitude/latitude ranges.`,
    );
  }

  return [longitude, latitude];
}

async function fetchRoutePlan(payload: PlanRequest): Promise<PlanResponse> {
  const response = await fetch("http://localhost:8000/plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Unable to generate route plan.";

    try {
      const error = await response.json();
      message = error.error ?? error.message ?? message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json();
}

function validateSearch(search: Record<string, unknown>): PlanSearch {
  return {
    origin: typeof search.origin === "string" ? search.origin : undefined,

    destination:
      typeof search.destination === "string" ? search.destination : undefined,

    departure_datetime:
      typeof search.departure_datetime === "string"
        ? search.departure_datetime
        : undefined,

    load_weight_lbs:
      typeof search.load_weight_lbs === "string"
        ? search.load_weight_lbs
        : undefined,
  };
}

export const Route = createFileRoute("/results")({
  validateSearch,

  beforeLoad: ({ search }) => {
    const { origin, destination, departure_datetime, load_weight_lbs } = search;

    // Redirect when any required parameter is missing.
    if (
      !origin?.trim() ||
      !destination?.trim() ||
      !departure_datetime?.trim() ||
      !load_weight_lbs?.trim()
    ) {
      throw redirect({
        to: "/",
      });
    }

    // Validate coordinates before rendering the page.
    const parsedOrigin = parseCoordinate(origin, "Origin");
    const parsedDestination = parseCoordinate(destination, "Destination");

    if (!Number.isFinite(Date.parse(departure_datetime))) {
      throw new Error("Invalid departure date/time.");
    }

    const weight = Number(load_weight_lbs);

    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error("Load weight must be a positive number.");
    }

    return {
      payload: {
        origin: parsedOrigin,
        destination: parsedDestination,
        departure_datetime,
        load_weight_lbs: weight,
      } satisfies PlanRequest,
    };
  },

  component: ResultsPage,

  errorComponent: ({ error }: { error: any }) => (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-2xl font-semibold text-slate-900">
        Invalid route request
      </h1>

      <p className="mt-2 text-slate-500">{error.message}</p>

      <a
        href="/plans"
        className="inline-block mt-6 text-emerald-600 hover:underline"
      >
        Back to route planning
      </a>
    </main>
  ),
});

function ResultsPage() {
  const { payload } = Route.useRouteContext();

  const [showCheckpoints, setShowCheckpoints] = useState(false);

  const {
    data: plan,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "route-plan",
      payload.origin,
      payload.destination,
      payload.departure_datetime,
      payload.load_weight_lbs,
    ],
    queryFn: () => fetchRoutePlan(payload),
    retry: false,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !plan) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-2xl font-semibold text-slate-900">
          Unable to generate routes
        </h1>

        <p className="mt-2 text-slate-500">
          {error?.message ?? "An unexpected error occurred."}
        </p>

        <a
          href="/"
          className="inline-block mt-6 text-emerald-600 hover:underline"
        >
          Try another route
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Route analysis
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Your weather-aware route alternatives
        </h1>

        <p className="mt-2 text-slate-500">
          Comparing {plan.routes.length} possible journeys.
        </p>
      </div>

      {/* Route summary cards */}

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        {plan.routes.map((route) => {
          const recommended = route.route_id === plan.recommended_route_id;

          const colors = recommended
            ? {
                border: "border-emerald-300",
                bg: "bg-emerald-50/50",
                accent: "bg-emerald-500",
                text: "text-emerald-700",
              }
            : {
                border: "border-slate-200",
                bg: "bg-white",
                accent: "bg-slate-400",
                text: "text-slate-600",
              };

          return (
            <div
              key={route.route_id}
              className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-4 transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${colors.accent}`}
                  />
                  <h2 className="text-sm font-semibold text-slate-800">
                    Route {route.route_id}
                  </h2>
                </div>

                {recommended && (
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Best route
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {route.distance_miles.toFixed(1)}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      mi
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Total distance
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-800">
                    {route.duration_hours.toFixed(1)}
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      hrs
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Travel time</p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200/80 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Average risk</span>

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      route.average_risk === "Low"
                        ? "bg-green-100 text-green-700"
                        : route.average_risk === "Moderate"
                          ? "bg-yellow-100 text-yellow-700"
                          : route.average_risk === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {route.average_risk}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-700" />
                    <span className="text-slate-500">Severe</span>
                    <span className="font-semibold text-slate-800">
                      {route.risk_miles.Severe.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-slate-500">High</span>
                    <span className="font-semibold text-slate-800">
                      {route.risk_miles.High.toFixed(1)}
                    </span>
                  </div>
                </div>

                {route.risk_miles["No Travel"] > 0 && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-2.5 py-1.5 text-xs">
                    <span className="font-medium text-red-700">
                      No-travel sections
                    </span>
                    <span className="font-bold text-red-700">
                      {route.risk_miles["No Travel"].toFixed(1)} mi
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/** Leaflet Map **/}
      <RouteMap data={plan.map_data} />

      {/* Checkpoint information */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowCheckpoints((previous) => !previous)}
          aria-expanded={showCheckpoints}
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50"
        >
          <div>
            <h2 className="font-semibold text-slate-900">
              Weather checkpoints
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed weather conditions along each route
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {plan.routes.reduce(
                (total, route) => total + route.checkpoints.length,
                0,
              )}{" "}
              checkpoints
            </span>

            {showCheckpoints ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </div>
        </button>

        {showCheckpoints && (
          <div className="border-t border-slate-100 p-5">
            <div className="space-y-8">
              {plan.routes.map((route) => (
                <div key={route.route_id}>
                  <h3 className="mb-4 flex items-center gap-2 font-medium text-slate-900">
                    Route {route.route_id}
                    {route.route_id === plan.recommended_route_id && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Recommended
                      </span>
                    )}
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {route.checkpoints.map((checkpoint, index) => (
                      <div
                        key={`${route.route_id}-${index}`}
                        className="rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {checkpoint.distance_miles.toFixed(1)} mi
                          </span>

                          <RiskBadge risk={checkpoint.risk} />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          ETA: {new Date(checkpoint.eta).toLocaleString()}
                        </p>

                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                          <p>
                            Wind: {checkpoint.weather.wind_mph.toFixed(1)} mph
                          </p>
                          <p>
                            Rain:{" "}
                            {checkpoint.weather.rain_inches_per_hour.toFixed(2)}{" "}
                            in/hr
                          </p>
                          <p>
                            Snow:{" "}
                            {checkpoint.weather.snow_inches_per_hour.toFixed(2)}{" "}
                            in/hr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Low: "bg-emerald-100 text-emerald-700",
    Moderate: "bg-amber-100 text-amber-700",
    High: "bg-orange-100 text-orange-700",
    Severe: "bg-red-100 text-red-700",
    "No Travel": "bg-red-200 text-red-900",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[risk]}`}
    >
      {risk}
    </span>
  );
}
