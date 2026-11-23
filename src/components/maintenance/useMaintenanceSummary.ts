import { useCallback, useEffect, useState } from "react";
import { get } from "@/helper/api";

export interface MaintenanceSummary {
  chaseUp: number;
  overdue: number;
  waitingAuthorization: number;
  unassigned: number;
  byPriority: { Critical: number; High: number; Medium: number; Low: number };
}

const REFRESH_MS = 5 * 60 * 1000;

/** Counts for the maintenance summary strip and the side-menu badge. Quietly does nothing when disabled or on error. */
export function useMaintenanceSummary(enabled: boolean) {
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);

  const reload = useCallback(async () => {
    try {
      const { data } = await get<MaintenanceSummary>("property-management/job-type/summary");
      if (data) setSummary(data);
    } catch {
      // The counts are a convenience; the pages still work without them.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    reload();
    const timer = setInterval(reload, REFRESH_MS);
    return () => clearInterval(timer);
  }, [enabled, reload]);

  return { summary, reload };
}
