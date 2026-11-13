import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/helper/api";
import { useOccupancyMeta } from "@/pages/Occupancy/useOccupancyMeta";
import { statusOf, typeOf, formatRate, fmtDate, toneBadge } from "@/pages/Occupancy/occupancyShared";

/** Occupancy tab = the occupancies linked to this property. */
export default function PropertyTenancies({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const meta = useOccupancyMeta();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get<{ items: any[] }>(`occupancy?propertyId=${propertyId}&limit=100`).then(({ data }) => {
      if (cancelled) return;
      setItems(data?.items || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [propertyId]);

  const nameOf = (o: any) =>
    [o.occupier?.FirstName, o.occupier?.SureName].filter(Boolean).join(" ") ||
    o.customerCompanyName ||
    [o.customerFirstName, o.customerSurname].filter(Boolean).join(" ") ||
    o.councilCustomer?.name ||
    "-";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Occupancy</h3>
          <p className="text-sm text-muted-foreground">Every occupancy linked to this property, current and past.</p>
        </div>
        <Button onClick={() => navigate("/occupancy/new")}><Plus className="mr-2 h-4 w-4" />New occupancy</Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No occupancies linked to this property yet.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Occupier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Move in</TableHead>
                <TableHead>Move out</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => {
                const status = statusOf(meta, o.status);
                return (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/occupancy/${o.id}`)}>
                    <TableCell className="font-medium">{o.reference}</TableCell>
                    <TableCell>{nameOf(o)}</TableCell>
                    <TableCell>{typeOf(meta, o.type)?.label ?? o.type}</TableCell>
                    <TableCell>{fmtDate(o.moveInDate) || "-"}</TableCell>
                    <TableCell>{fmtDate(o.actualMoveOutDate || o.expectedMoveOutDate) || "Open"}</TableCell>
                    <TableCell>{o.rateAmount ? formatRate(meta, o.rateAmount, o.rateFrequency) : "-"}</TableCell>
                    <TableCell><Badge className={toneBadge(status?.tone)}>{status?.label ?? o.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
