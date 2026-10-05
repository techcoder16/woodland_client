import { useEffect, useState } from "react";
import { get } from "@/helper/api";
import { cachedOccupancyMeta, loadOccupancyMeta, OccupancyMeta } from "./occupancyShared";

// Staff screens: occupancy enums/labels from GET occupancy/meta.
export function useOccupancyMeta() {
  const [meta, setMeta] = useState<OccupancyMeta | null>(cachedOccupancyMeta());
  useEffect(() => {
    if (meta) return;
    loadOccupancyMeta(async () => (await get<OccupancyMeta>("occupancy/meta")).data).then(setMeta);
  }, [meta]);
  return meta;
}
