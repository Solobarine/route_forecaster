import type { RiskLevel } from "../../types/route-map";

const MAX_FORECAST_HOUR = 48;

// Forecast slider and weather risk legend.
export default function ForecastControls({
  hour,
  onChange,
  counts,
  riskOrder,
  riskColors,
}: {
  hour: number;
  onChange: (hour: number) => void;
  counts: Record<RiskLevel, number>;
  riskOrder: RiskLevel[];
  riskColors: Record<RiskLevel, string>;
}) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="absolute bottom-4 left-4 z-1000 w-[min(420px,calc(100%-32px))] rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Weather forecast</h3>

          <p className="text-xs text-gray-500">
            Conditions along the route corridor
          </p>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold tabular-nums">
            {hour === 0 ? "Now" : `+${hour}h`}
          </div>

          <div className="text-[10px] text-gray-500">
            {hour === 0 ? "Current conditions" : "Forecast"}
          </div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={MAX_FORECAST_HOUR}
        step={1}
        value={hour}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-2 accent-blue-600 cursor-pointer"
        aria-label="Weather forecast hour"
      />

      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>Now</span>
        <span>12h</span>
        <span>24h</span>
        <span>36h</span>
        <span>48h</span>
      </div>

      <div className="border-t mt-3 pt-3">
        <div className="text-xs font-semibold mb-2">Weather risk legend</div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {riskOrder.map((risk) => (
            <div key={risk} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: riskColors[risk] }}
              />

              <span className="text-gray-700">{risk}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>Visible checkpoint risks</span>
          <span className="font-medium text-gray-800">{total}</span>
        </div>

        <div className="flex flex-wrap gap-3 mt-2">
          {riskOrder.map((risk) => (
            <div key={risk} className="flex items-center gap-1 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: riskColors[risk] }}
              />
              <span className="text-gray-600">{counts[risk]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
