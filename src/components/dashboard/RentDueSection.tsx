import React, { useEffect, useState } from "react";
import { get } from "@/helper/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarClock, Calendar } from "lucide-react";

interface RentDueEntry {
  propertyId: string;
  address: string;
  landlordName: string | null;
  rentPerMonth: string;
  dueDate: string;
}

interface RentDueData {
  overdue: RentDueEntry[];
  dueThisWeek: RentDueEntry[];
  dueThisMonth: RentDueEntry[];
}

const EMPTY: RentDueData = { overdue: [], dueThisWeek: [], dueThisMonth: [] };

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function RentDueList({ entries, emptyLabel }: { entries: RentDueEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</div>;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {entries.map((entry) => (
        <div
          key={entry.propertyId}
          className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <div className="font-medium truncate">{entry.address || "Unknown property"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {entry.landlordName || "No landlord"} · Due {formatDate(entry.dueDate)}
            </div>
          </div>
          <div className="font-mono text-sm whitespace-nowrap">£{entry.rentPerMonth}</div>
        </div>
      ))}
    </div>
  );
}

export function RentDueSection() {
  const [data, setData] = useState<RentDueData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: apiData } = await get<RentDueData>("/dashboard/analytics/rent-due");
        if (!cancelled && apiData && !("message" in apiData)) setData(apiData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Rent due</h2>
        <p className="text-[11px] text-muted-foreground/80">
          Estimated from rent amount and effective date — not a payment record
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-medium">Overdue</h3>
            <Badge variant="destructive" className="ml-auto">{data.overdue.length}</Badge>
          </div>
          <RentDueList entries={data.overdue} emptyLabel="No overdue rent" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-medium">Due this week</h3>
            <Badge variant="secondary" className="ml-auto">{data.dueThisWeek.length}</Badge>
          </div>
          <RentDueList entries={data.dueThisWeek} emptyLabel="Nothing due this week" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Due this month</h3>
            <Badge variant="secondary" className="ml-auto">{data.dueThisMonth.length}</Badge>
          </div>
          <RentDueList entries={data.dueThisMonth} emptyLabel="Nothing else due this month" />
        </Card>
      </div>
    </div>
  );
}
