import type { RouteData } from "../types/route-map";

// Route visibility controls.
export default function RouteVisibility({
  routes,
  visibleRoutes,
  recommendedRouteId,
  onToggle,
  onToggleAll,
  getRouteColor,
}: {
  routes: RouteData[];
  visibleRoutes: Set<number>;
  recommendedRouteId: number;
  onToggle: (routeId: number) => void;
  onToggleAll: () => void;
  getRouteColor: (route: RouteData, recommended_route_id: number) => string;
}) {
  const allVisible = routes.every((route) => visibleRoutes.has(route.route_id));

  return (
    <div className="absolute top-4 right-4 z-1000 w-56 rounded-xl border bg-white/95 shadow-lg backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Routes</h3>

        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {allVisible ? "Hide all" : "Show all"}
        </button>
      </div>

      <div className="space-y-3">
        {routes.map((route) => {
          const visible = visibleRoutes.has(route.route_id);

          const recommended = route.route_id === recommendedRouteId;

          const color = getRouteColor(route, recommendedRouteId);

          return (
            <label
              key={route.route_id}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={() => onToggle(route.route_id)}
                className="h-4 w-4 rounded accent-blue-600"
              />

              <span
                className="h-1 w-5 rounded-full shrink-0"
                style={{
                  backgroundColor: color,
                  opacity: visible ? 1 : 0.3,
                }}
              />

              <span className={visible ? "text-gray-900" : "text-gray-400"}>
                Route {route.route_id}
              </span>

              {recommended && (
                <span className="text-[10px] text-green-600 font-semibold">
                  Recommended
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
