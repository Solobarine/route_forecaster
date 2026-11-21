import { useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function parseCoordinates(value: string): [number, number] | null {
  try {
    const coordinates = value.trim().startsWith("[")
      ? JSON.parse(value)
      : value.split(",").map((part) => Number(part.trim()));

    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every(
        (coordinate) =>
          typeof coordinate === "number" && Number.isFinite(coordinate),
      )
    ) {
      return null;
    }

    const [longitude, latitude] = coordinates;

    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return null;
    }

    return [longitude, latitude];
  } catch {
    return null;
  }
}

export function RouteComponent() {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [loadWeight, setLoadWeight] = useState("35000");
  const [error, setError] = useState("");

  function handleSubmit(event: React.SubmitEvent) {
    event.preventDefault();
    setError("");

    const parsedOrigin = parseCoordinates(origin);
    const parsedDestination = parseCoordinates(destination);

    if (!parsedOrigin) {
      setError(
        "Enter a valid origin as longitude, latitude (e.g. -0.1276, 51.5072).",
      );
      return;
    }

    if (!parsedDestination) {
      setError(
        "Enter a valid destination as longitude, latitude (e.g. -1.2577, 51.7520).",
      );
      return;
    }

    const weight = Number(loadWeight);

    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a valid load weight in pounds.");
      return;
    }

    if (!departureTime || Number.isNaN(Date.parse(departureTime))) {
      setError("Select a valid departure date and time.");
      return;
    }

    navigate({
      to: "/results",
      search: {
        origin: JSON.stringify(parsedOrigin),
        destination: JSON.stringify(parsedDestination),
        departure_datetime: new Date(departureTime).toISOString(),
        load_weight_lbs: String(weight),
      },
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Route Forecaster Intelligence
        </span>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Plan smarter routes.
          <br />
          <span className="text-emerald-600">Drive with confidence.</span>
        </h1>

        <p className="mt-4 text-lg text-slate-500">
          Find efficient truck routes with weather forecasts, road conditions,
          and potential hazards considered.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-semibold text-slate-900">
            Your journey
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Starting point
              </label>
              <input
                required
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="-0.1276, 51.5072"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter longitude, latitude.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Destination
              </label>
              <input
                required
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="-1.2577, 51.7520"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter longitude, latitude.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Departure date and time
              </label>
              <input
                required
                type="datetime-local"
                value={departureTime}
                onChange={(event) => setDepartureTime(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Load weight (lbs)
              </label>
              <input
                required
                type="number"
                min="1"
                step="any"
                value={loadWeight}
                onChange={(event) => setLoadWeight(event.target.value)}
                placeholder="35000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-8 w-full rounded-xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700"
          >
            Generate route
          </button>
        </form>

        <aside className="flex flex-col justify-between rounded-2xl bg-slate-900 p-8 text-white">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
              <span>↗</span>
            </div>

            <h2 className="text-2xl font-semibold">
              More than just directions.
            </h2>

            <p className="mt-3 leading-7 text-slate-400">
              Your route plan considers conditions along the journey, helping
              you anticipate weather disruptions and make better travel
              decisions.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            {[
              ["01", "Weather-aware routing"],
              ["02", "Route and checkpoint analysis"],
              ["03", "Potential hazard identification"],
            ].map(([number, label]) => (
              <div key={number} className="flex items-center gap-4">
                <span className="text-sm font-semibold text-emerald-400">
                  {number}
                </span>
                <span className="text-sm text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
