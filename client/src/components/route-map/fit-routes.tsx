import { useMemo } from "react";
import { useMap } from "react-leaflet";
import type { RouteMapData } from "../../types/route-map";

export default function FitRoutes({
  data,
  coordinatesToPosition,
}: {
  data: RouteMapData;
  coordinatesToPosition: (coordinates: [number, number]) => [number, number];
}) {
  const map = useMap();

  useMemo(() => {
    const positions: [number, number][] = [
      coordinatesToPosition(data.origin),
      coordinatesToPosition(data.destination),
    ];

    data.routes.forEach((route) => {
      route.coordinates.forEach((coordinate) => {
        positions.push(coordinatesToPosition(coordinate));
      });

      route.checkpoints.forEach((checkpoint) => {
        positions.push(coordinatesToPosition(checkpoint.coordinates));
      });
    });

    if (positions.length > 0) {
      map.fitBounds(positions, {
        padding: [40, 40],
        maxZoom: 12,
      });
    }
  }, [data, map]);

  return null;
}
