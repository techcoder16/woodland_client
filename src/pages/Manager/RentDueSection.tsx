import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/hint";
import { useToast } from "@/components/ui/use-toast";
import { get, post } from "@/helper/api";

type RentRow = {
  period: string;
  label: string;
  dueDate: string;
  amount: number;
  status: "PAID" | "RECORDED" | "DUE" | "OVERDUE";
  transaction: { id: string; reference?: string; status?: string; toLandlordNetPaid?: number } | null;
};

type RentSchedule = {
  property: {
    id: string;
    addressLine1?: string;
    addressLine2?: string;
    town?: string;
    postCode?: string;
    propertyNumber?: string;
    vendor: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  };
  rent: number;
  dueDay: number | null;
  rows: RentRow[];
};

const money = (value: unknown) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS: Record<RentRow["status"], { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-violet-100 text-violet-700" },
  RECORDED: { label: "Recorded", className: "bg-blue-100 text-blue-700" },
  DUE: { label: "Due", className: "bg-amber-100 text-amber-800" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700" },
};

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export default function RentDueSection({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<RentSchedule | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    setLoading(true);
    get<RentSchedule>(`transaction/rent-schedule?propertyId=${propertyId}`).then(({ data, error }) => {
      if (cancelled) return;
      setFailed(!!error || !data);
      setSchedule(data ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [propertyId]);

  const recordPayment = (row: RentRow) => {
    const params = new URLSearchParams({ propertyId, period: row.period, due: row.dueDate });
    const vendorId = schedule?.property.vendor?.id;
    if (vendorId) params.set("vendorId", vendorId);
    navigate(`/finance/landlord-payments/new?${params.toString()}`);
  };

  const emailStatement = async (transactionId: string) => {
    setEmailingId(transactionId);
    const { data, error } = await post<{ message?: string; to?: string }>(`transaction/${transactionId}/email-statement`, {});
    setEmailingId(null);
    if (error) {
      toast({ title: "Could not email statement", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Statement emailed", description: data?.message || (data?.to ? `Sent to ${data.to}` : undefined) });
  };

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading rent schedule…</p>;
  if (failed || !schedule) return <div className="surface p-8 text-center text-sm text-muted-foreground">Could not load the rent schedule for this property.</div>;

  const { property, rent, dueDay, rows } = schedule;
  const landlord = property.vendor ? `${property.vendor.firstName || ""} ${property.vendor.lastName || ""}`.trim() || property.vendor.email || "Landlord" : "No landlord";
  const address = [property.addressLine1, property.addressLine2, property.town, property.postCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="flex items-center gap-1.5 font-semibold">Rent due <InfoHint text="One rent period per month, from the Management Agreement. Record each landlord payment once; a period that is already recorded shows its payment instead." /></h2>
          <p className="text-sm text-muted-foreground">{address || "Property"}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div><p className="text-xs text-muted-foreground">Rent per month</p><p className="font-semibold">{money(rent)}</p></div>
          <div><p className="text-xs text-muted-foreground">Due day</p><p className="font-semibold">{dueDay ? `${dueDay}${dueDay === 1 ? "st" : dueDay === 2 ? "nd" : dueDay === 3 ? "rd" : "th"} of each month` : "-"}</p></div>
          <div><p className="text-xs text-muted-foreground">Landlord</p><p className="font-semibold">{landlord}</p></div>
        </div>
      </div>

      {!rows.length || !dueDay ? (
        <div className="surface p-8 text-center">
          <p className="font-medium">No rent schedule yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rent due dates come from the Management Agreement. Add the rent per month and the rent due day under Edit Property, then Management Agreement.
          </p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  {["Period", "Due date", "Landlord", "Property", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const status = STATUS[row.status] || STATUS.DUE;
                  const tx = row.transaction;
                  return (
                    <tr key={row.period} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dateLabel(row.dueDate)}</td>
                      <td className="px-4 py-3">{landlord}</td>
                      <td className="px-4 py-3 max-w-[260px] truncate" title={address}>{address || "-"}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{money(row.amount)}</td>
                      <td className="px-4 py-3"><Badge className={status.className}>{status.label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {!tx && (
                            <Button size="sm" onClick={() => recordPayment(row)}>Record payment</Button>
                          )}
                          {tx && row.status === "PAID" && (
                            <span className="text-xs text-muted-foreground">
                              Rent already paid · <button type="button" className="font-medium text-primary underline" onClick={() => navigate(`/finance/landlord-payments?payment=${tx.id}`)}>{tx.reference || "View payment"}</button>
                            </span>
                          )}
                          {tx && row.status !== "PAID" && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/finance/landlord-payments?payment=${tx.id}`)}>Open payment</Button>
                          )}
                          {tx && (
                            <Button size="sm" variant="ghost" disabled={emailingId === tx.id} onClick={() => void emailStatement(tx.id)}>
                              {emailingId === tx.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}Email statement
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
