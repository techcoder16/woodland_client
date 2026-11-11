import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "@/helper/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingPayment {
  id: string;
  reference: string | null;
  status: "DRAFT" | "PENDING" | "APPROVAL_REQUIRED";
  address: string;
  landlordName: string | null;
  amount: number;
  expectedPaymentDate: string | null;
}

interface PendingData {
  landlordPayments: {
    count: number;
    total: number;
    byStatus: { DRAFT: number; PENDING: number; APPROVAL_REQUIRED: number };
    byDue: Record<"overdue" | "thisMonth" | "nextMonth" | "later" | "noDate", { count: number; total: number }>;
    items: PendingPayment[];
  };
  other: {
    maintenanceToReview: number;
    maintenanceQuoting: number;
    maintenanceOverdue: number;
    draftProperties: number;
    pendingOccupancies: number;
  };
}

const STATUS_LABEL: Record<PendingPayment["status"], string> = {
  DRAFT: "Draft",
  PENDING: "On hold",
  APPROVAL_REQUIRED: "Needs approval",
};

const money = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatDate(value: string | null) {
  if (!value) return "No date set";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function PendingSection() {
  const navigate = useNavigate();
  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: apiData, error } = await get<PendingData>("/dashboard/analytics/pending");
        if (cancelled) return;
        if (error) setLoadError(error.message);
        else if (apiData && "landlordPayments" in apiData) setData(apiData);
        else setLoadError((apiData as any)?.message || "Unexpected response");
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Could not load pending items");
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
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        Could not load pending items: {loadError}
      </div>
    );
  }

  const { landlordPayments: lp, other } = data;
  const tiles: { label: string; value: number; to: string; urgent?: boolean }[] = [
    { label: "Maintenance to review", value: other.maintenanceToReview, to: "/maintenance" },
    { label: "Maintenance overdue", value: other.maintenanceOverdue, to: "/maintenance", urgent: true },
    { label: "Awaiting quote", value: other.maintenanceQuoting, to: "/maintenance" },
    { label: "Occupancies not moved in", value: other.pendingOccupancies, to: "/occupancy" },
    { label: "Draft properties", value: other.draftProperties, to: "/properties" },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Pending</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-medium">Landlord payments pending</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lp.byStatus.APPROVAL_REQUIRED} need approval · {lp.byStatus.PENDING} on hold · {lp.byStatus.DRAFT} draft
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg">{money(lp.total)}</div>
              <div className="text-xs text-muted-foreground">{lp.count} payment{lp.count === 1 ? "" : "s"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {(
              [
                ["overdue", "Overdue"],
                ["thisMonth", "Due this month"],
                ["nextMonth", "Due next month"],
                ["later", "Later"],
                ["noDate", "No date set"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className={`rounded-md border px-2 py-1.5 ${key === "overdue" && lp.byDue[key].count > 0 ? "border-destructive/40 bg-destructive/5" : "border-border/60"}`}
              >
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="font-mono text-sm">{money(lp.byDue[key].total)}</div>
                <div className="text-[11px] text-muted-foreground">{lp.byDue[key].count} payment{lp.byDue[key].count === 1 ? "" : "s"}</div>
              </div>
            ))}
          </div>
          {lp.items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No pending landlord payments</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lp.items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate("/finance/landlord-payments")}
                  className="w-full flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm text-left hover:bg-muted/60 hover:border-border transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.address}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.landlordName || "No landlord"} · {p.reference || "No reference"} · Expected {formatDate(p.expectedPaymentDate)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Badge variant={p.status === "APPROVAL_REQUIRED" ? "destructive" : "secondary"}>{STATUS_LABEL[p.status]}</Badge>
                    <span className="font-mono">{money(p.amount)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {lp.count > lp.items.length && (
            <button
              type="button"
              onClick={() => navigate("/finance/landlord-payments")}
              className="mt-3 text-xs text-primary hover:underline"
            >
              View all {lp.count} →
            </button>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Other pending</h3>
          <div className="space-y-2">
            {tiles.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => navigate(t.to)}
                className="w-full flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <span>{t.label}</span>
                <Badge variant={t.urgent && t.value > 0 ? "destructive" : "secondary"}>{t.value}</Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
