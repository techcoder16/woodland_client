// Rent Received: incoming payments (from occupiers, companies or councils) for
// one property. Each row is the part of a payment allocated to this property.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/hint";
import { get } from "@/helper/api";
import { downloadCsv } from "@/utils/csvDownload";
import { formatPeriod, money, rentPeriodRange, type IncomingPayment } from "../Finance/incomingPaymentShared";

const dmy = (v: string) => new Date(v).toLocaleDateString("en-GB");

export default function RentReceivedSection({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<IncomingPayment[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    get<{ items: IncomingPayment[] }>(`incoming-payments?propertyId=${propertyId}&page=1&limit=500`).then(({ data, error }) => {
      if (cancelled) return;
      setFailed(!!error);
      setPayments(data?.items ?? []);
    });
    return () => { cancelled = true; };
  }, [propertyId]);

  const rows = useMemo(
    () =>
      (payments ?? []).map((p) => {
        const here = p.allocations.filter((a) => a.propertyId === propertyId);
        return {
          payment: p,
          address: here[0]?.property?.addressLine1 || "-",
          months: [...new Set(here.map((a) => a.period))].sort(),
          amount: here.reduce((sum, a) => sum + Number(a.amount || 0), 0),
        };
      }),
    [payments, propertyId],
  );
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const exportCsv = () =>
    downloadCsv(
      `rent-received-${propertyId}.csv`,
      ["Date", "Reference", "Payer", "Property", "Rent period", "Months", "Amount"],
      rows.map((r) => [dmy(r.payment.paymentDate), r.payment.reference, r.payment.payerName, r.address, rentPeriodRange(r.payment), r.months.join(" "), r.amount.toFixed(2)]),
    );

  if (payments === null) return <p className="p-6 text-sm text-muted-foreground">Loading rent received…</p>;
  if (failed) return <div className="surface p-8 text-center text-sm text-muted-foreground">Could not load the rent received for this property.</div>;

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="flex items-center gap-1.5 font-semibold">
            Rent received ({rows.length})
            <InfoHint text="Incoming payments for this property from the occupier, their company or the council. Only the part of a payment allocated to this property is counted." />
          </h2>
          <p className="text-xs text-muted-foreground">Total received {money(total)}. Click a row to open the payment.</p>
        </div>
        <Button size="sm" variant="outline" disabled={!rows.length} onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Download CSV
        </Button>
      </div>
      {!rows.length ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No incoming payments recorded for this property yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                {["Date", "Reference", "Payer", "Property", "Rent period", "Amount"].map((h) => (
                  <th key={h} className={`px-4 py-3 font-medium ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.payment.id} className="cursor-pointer border-t hover:bg-muted/30" onClick={() => navigate(`/finance/incoming-payments?payment=${r.payment.id}`)}>
                  <td className="px-4 py-3 whitespace-nowrap">{dmy(r.payment.paymentDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.payment.reference}</td>
                  <td className="px-4 py-3">{r.payment.payerName}</td>
                  <td className="px-4 py-3">{r.address}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.payment.rentPeriodFrom ? rentPeriodRange(r.payment) : r.months.map(formatPeriod).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{money(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
