import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { get } from "@/helper/api";

const daysLeft = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

function certState(doc?: any): { label: string; className: string } {
  if (!doc) return { label: "Not uploaded", className: "bg-slate-100 text-slate-600" };
  const days = daysLeft(doc.expiryDate);
  if (days === null) return { label: "On file", className: "bg-emerald-100 text-emerald-700" };
  if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `Expires in ${days}d`, className: "bg-amber-100 text-amber-700" };
  return { label: "Valid", className: "bg-emerald-100 text-emerald-700" };
}

/**
 * HMO overview, derived from what is already on the property: its type, rooms,
 * the current occupiers, and the licence / safety certificates an HMO needs.
 */
export default function PropertyHmo({ property }: { property: any }) {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [occupancies, setOccupancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      get<{ data: any[] }>(`property-management/compliance/${property.id}`),
      get<{ items: any[] }>(`occupancy?propertyId=${property.id}&limit=100`),
    ]).then(([c, o]) => {
      if (cancelled) return;
      setDocs(c.data?.data || []);
      setOccupancies(o.data?.items || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [property.id]);

  const isHmo = String(property.propertyTypeCategory || "").toLowerCase() === "hmo";
  const rooms: any[] = Array.isArray(property.rooms) ? property.rooms : [];
  const bedrooms = Number(property.bedrooms) || 0;
  const active = occupancies.filter((o) => o.status === "ACTIVE");
  const latest = (type: string, pick?: (d: any) => boolean) =>
    docs
      .filter((d) => d.docType === type && (!pick || pick(d)))
      .sort((a, b) => +new Date(b.expiryDate || 0) - +new Date(a.expiryDate || 0))[0];

  const checks = [
    { label: "HMO Licence", doc: latest("PROPERTY_LICENSE", (d) => d.licenceType === "HMO"), required: true },
    { label: "Gas Safety Certificate", doc: latest("GAS_SAFETY"), required: !!property.gas },
    { label: "Electrical Installation (EICR)", doc: latest("ELECTRICAL_SAFETY"), required: true },
    { label: "Energy Performance Certificate", doc: latest("EPC"), required: true },
    {
      label: "Fire Risk Assessment",
      doc: latest("FIRE_RISK_ASSESSMENT") ?? (property.fireRiskAssessmentFileId ? { expiryDate: null } : undefined),
      required: !!property.communal,
    },
  ].filter((c) => c.required);

  if (loading) {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>;
  }

  const missing = checks.filter((c) => ["Not uploaded", "Expired"].includes(certState(c.doc).label)).length;
  const over = bedrooms > 0 && active.length > bedrooms;
  const occupierName = (o: any) =>
    [o.occupier?.FirstName, o.occupier?.SureName].filter(Boolean).join(" ") ||
    o.customerCompanyName ||
    [o.customerFirstName, o.customerSurname].filter(Boolean).join(" ") ||
    o.reference;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">HMO</h3>
          <p className="text-sm text-muted-foreground">Licence, safety certificates, rooms and occupancy for a House in Multiple Occupation.</p>
        </div>
        <Badge className={isHmo ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"}>{isHmo ? "HMO property" : "Not set as an HMO"}</Badge>
      </div>

      {!isHmo && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span>This property type is "{property.propertyTypeCategory || "not set"}". Set the type to HMO to treat it as one.</span>
          <Button size="sm" variant="outline" onClick={() => navigate(`/property/edit?id=${property.id}`, { state: { property } })}>Edit property</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-4"><p className="text-xs text-muted-foreground">Bedrooms</p><p className="text-2xl font-semibold">{bedrooms || "-"}</p></div>
        <div className="surface p-4"><p className="text-xs text-muted-foreground">Current occupiers</p><p className="text-2xl font-semibold">{active.length}</p></div>
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Compliance</p>
          <p className="flex items-center gap-2 text-2xl font-semibold">
            {missing === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            {missing === 0 ? "All in place" : `${missing} to sort`}
          </p>
        </div>
      </div>

      {over && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {active.length} active occupiers for {bedrooms} bedrooms. Check this against the licence limit.
        </div>
      )}

      <div className="surface p-5">
        <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Licence &amp; safety</h4>
        <div className="divide-y">
          {checks.map((c) => {
            const state = certState(c.doc);
            return (
              <div key={c.label} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{c.label}</p>
                  {c.doc?.expiryDate && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(c.doc.expiryDate).toLocaleDateString("en-GB")}{c.doc.borough ? ` · ${c.doc.borough}` : ""}
                    </p>
                  )}
                </div>
                <Badge className={state.className}>{state.label}</Badge>
              </div>
            );
          })}
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(`/properties/${property.id}?tab=compliance`, { state: { property } })}>
          Manage certificates
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Rooms</h4>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms recorded. Add them when editing the property.</p>
          ) : (
            <ul className="divide-y text-sm">
              {rooms.map((r, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{r.name || r.title || `Room ${i + 1}`}</span>
                  <span className="text-muted-foreground">{r.length && r.width ? `${r.length} × ${r.width}` : r.dimensions || ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="surface p-5">
          <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Occupiers</h4>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active occupancies.</p>
          ) : (
            <ul className="divide-y text-sm">
              {active.map((o) => (
                <li key={o.id} className="flex cursor-pointer justify-between py-2 hover:text-primary" onClick={() => navigate(`/occupancy/${o.id}`)}>
                  <span>{occupierName(o)}</span>
                  <span className="text-muted-foreground">{o.reference}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
