import type { RiskLevel } from "../types/route-map";

export default function ForecastSlider({
  hour,
  onChange,
  counts,
  riskColors,
}: {
  hour: number;
  onChange: (hour: number) => void;
  counts: Record<RiskLevel, number>;
  riskColors: any;
}) {
  return (
    <div
      className="
      absolute bottom-5 left-1/2 -translate-x-1/2
      z-1000 bg-white rounded-xl shadow-xl
      p-4 w-90 max-w-[90%]
    "
    >
      <h3 className="font-semibold text-sm mb-3">
        Weather forecast along route
      </h3>

      <div className="flex justify-between text-xs text-gray-500">
        <span>0 hours</span>
        <strong className="text-blue-600">+{hour} hours</strong>
        <span>48 hours</span>
      </div>

      <input
        type="range"
        min={0}
        max={48}
        step={1}
        value={hour}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full mt-3 accent-blue-600"
      />

      <div className="mt-3 text-xs text-gray-600">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {(Object.entries(counts) as [RiskLevel, number][]).map(
            ([risk, count]) => (
              <span key={risk} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: riskColors[risk] }}
                />
                {risk}: {count}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
