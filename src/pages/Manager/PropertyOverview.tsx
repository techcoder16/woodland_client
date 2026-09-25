import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, ClipboardList, FileText, Loader2, Search, StickyNote, User, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { get, post } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { plainText } from "@/helper/plainText";

const API_URL = import.meta.env.VITE_API_URL;
const money = (value: unknown) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

/** DD/MM/YYYY, or "" when there is no usable date — never a raw ISO string. */
const ukDate = (value: unknown) => {
  if (!value) return "";
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("en-GB");
};


const DOC_TYPE_LABEL: Record<string, string> = {
  GAS_SAFETY: "Gas Safety Certificate",
  ELECTRICAL_SAFETY: "Electrical Safety Certificate",
  EPC: "EPC",
  PROPERTY_LICENSE: "Property License",
  FIRE_RISK_ASSESSMENT: "Fire Risk Assessment",
  INSURANCE: "Insurance Certificate",
  OTHER: "Other",
};

function expiryLabel(expiryDate?: string) {
  if (!expiryDate) return { label: "No expiry set", tone: "outline" as const };
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", tone: "destructive" as const };
  if (days <= 30) return { label: "Expiring Soon", tone: "destructive" as const };
  return { label: "Valid", tone: "outline" as const };
}

interface PropertyOverviewProps {
  property: any;
}

export default function PropertyOverview({ property }: PropertyOverviewProps) {
  const navigate = useNavigate();
  const onNavigateTab = (tab: string) => navigate(`/properties/${property.id}?tab=${tab}`, { state: { property } });
  const [party, setParty] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantResults, setTenantResults] = useState<any[]>([]);
  const [searchingTenants, setSearchingTenants] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Debounced tenant lookup for the link-tenant popup.
  useEffect(() => {
    if (!tenantModalOpen) return;
    let cancelled = false;
    setSearchingTenants(true);
    const timer = setTimeout(async () => {
      const { data } = await get<any>(`tenants?page=1&limit=10&search=${encodeURIComponent(tenantSearch)}`);
      if (cancelled) return;
      setTenantResults(data?.data || []);
      setSearchingTenants(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [tenantSearch, tenantModalOpen]);

  const reloadParty = async () => {
    const { data } = await get<{ data: any }>(`property-management/party/${property.id}/optional`);
    setParty(data?.data || null);
  };

  const linkTenant = async (tenantId: string) => {
    setLinkingId(tenantId);
    try {
      const { error } = await post(`property-management/party/${property.id}/tenants/${tenantId}`, {});
      if (error) throw new Error(error.message);
      toast.success("Tenant linked to this property.");
      setTenantModalOpen(false);
      await reloadParty();
    } catch (error: any) {
      toast.error(error.message || "Failed to link tenant.");
    } finally {
      setLinkingId(null);
    }
  };

  useEffect(() => {
    if (!property?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [partyRes, summaryRes, jobTypesRes, notesRes, complianceRes] = await Promise.all([
        get<{ data: any }>(`property-management/party/${property.id}/optional`),
        get<any>(`transaction/summary?propertyId=${property.id}`),
        // The status tiles below count across every job, so fetching only the
        // first 5 made Urgent/Open/In Progress/Completed under-report. The
        // list itself still shows just the first few.
        get<{ jobTypes: any[] }>(`property-management/job-type?propertyId=${property.id}&limit=500`),
        get<{ notes: any[] }>(`property-management/note?propertyId=${property.id}&limit=3`),
        get<{ data: any[] }>(`property-management/compliance/${property.id}`),
      ]);
      if (cancelled) return;
      setParty(partyRes.data?.data || null);
      setSummary(summaryRes.data || null);
      setJobTypes(jobTypesRes.data?.jobTypes || []);
      setNotes(notesRes.data?.notes || []);
      setComplianceDocs(complianceRes.data?.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [property?.id]);

  // The landlord picked in the property wizard lives on property.vendor;
  // PropertyParty.vendor only exists once a party is explicitly assigned
  // from the Tenancies tab, so fall back to the property's own vendor or
  // the card reads empty for every wizard-created property.
  const landlord = party?.vendor || property?.vendor;
  const tenants = party?.tenants || [];
  const urgent = jobTypes.filter((j) => j.priority === "Critical" && j.status !== "COMPLETED" && j.status !== "CANCELLED").length;
  const open = jobTypes.filter((j) => j.status === "QUOTING" || j.status === "ASSIGNED").length;
  const inProgress = jobTypes.filter((j) => j.status === "IN_PROGRESS" || j.status === "CONTRACTOR_DONE").length;
  const completed = jobTypes.filter((j) => j.status === "COMPLETED").length;

  // Agreed rent from the property wizard is the reliable figure; the
  // transaction-derived one only exists once payments have been recorded.
  const rentPcm = Number(property?.rentPerMonth || 0) || Number(summary?.llNetRentRecv || 0);

  const netIncome = summary ? Number(summary.totalCredit || 0) - Number(summary.llNetPaid || 0) - Number(summary.llBuildingExp || 0) : 0;

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading overview…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property Overview */}
        <div className="surface p-5 lg:col-span-1">
          <h3 className="mb-3 font-semibold">Property Overview</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Property Reference</dt><dd className="font-medium">{formatPropertyReference(property.propertyNumber)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Address</dt><dd className="text-right font-medium">{[property.addressLine1, property.town, property.postCode].filter(Boolean).join(", ") || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Property Type</dt><dd className="font-medium">{property.propertyTypeCategory || property.category || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Tenure Type</dt><dd className="font-medium">{property.category || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Bedrooms</dt><dd className="font-medium">{property.bedrooms ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Bathrooms</dt><dd className="font-medium">{property.bathrooms ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Reception Rooms</dt><dd className="font-medium">{property.receptions ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Garden</dt><dd className="font-medium">{property.hasGarden ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Lift</dt><dd className="font-medium">{property.lift ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Wheelchair Access</dt><dd className="font-medium">{property.wheelchairAccess ? "Yes" : "No"}</dd></div>
            {property.managementDate ? <div className="flex justify-between"><dt className="text-muted-foreground">Management Date</dt><dd className="font-medium">{property.managementDate}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><Badge variant="outline">{property.propertyStatus || "-"}</Badge></dd></div>
          </dl>
        </div>

        {/* Landlord */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Landlord</h3>
            {/* EditVendor reads the landlord from router state, and there is no
                /vendors/:id route — navigating by id alone 404s. */}
            {landlord && <Button size="sm" variant="outline" onClick={() => navigate("/vendors/edit", { state: { vendor: landlord } })}>View Landlord</Button>}
          </div>
          {landlord ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium"><User className="h-4 w-4 text-primary" />{landlord.firstName} {landlord.lastName}</p>
              <p className="text-muted-foreground">{landlord.phone}</p>
              <p className="text-muted-foreground">{landlord.email}</p>
              <p className="text-muted-foreground">{[landlord.addressLine1, landlord.town, landlord.postCode].filter(Boolean).join(", ")}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No landlord assigned yet.
            </div>
          )}
        </div>

        {/* Tenancy Summary */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Tenancy Summary</h3>
            {tenants.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>}
          </div>
          {tenants.length > 0 ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium"><User className="h-4 w-4 text-primary" />{tenants.map((t: any) => `${t.title || ""} ${t.FirstName || ""} ${t.SureName || ""}`.trim()).join(", ")}</p>
              {rentPcm ? <div className="flex justify-between"><span className="text-muted-foreground">Rent (PCM)</span><span className="font-medium">{money(rentPcm)}</span></div> : null}
              {property.rentEffectiveDate ? <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{property.rentEffectiveDate}</span></div> : null}
              {property.termMonths ? <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span className="font-medium">{property.termMonths} months</span></div> : null}
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => { setTenantSearch(""); setTenantModalOpen(true); }}>Link another tenant</Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {rentPcm ? <div className="flex justify-between"><span className="text-muted-foreground">Rent (PCM)</span><span className="font-medium">{money(rentPcm)}</span></div> : null}
              <p className="text-muted-foreground">No tenant linked yet.</p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => { setTenantSearch(""); setTenantModalOpen(true); }}>Link a tenant</Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        {/* Maintenance Overview */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4" />Maintenance Overview</h3>
          </div>
          <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-md bg-red-50 p-2"><p className="text-lg font-semibold text-red-600">{urgent}</p><p className="text-muted-foreground">Urgent</p></div>
            <div className="rounded-md bg-orange-50 p-2"><p className="text-lg font-semibold text-orange-600">{open}</p><p className="text-muted-foreground">Open</p></div>
            <div className="rounded-md bg-blue-50 p-2"><p className="text-lg font-semibold text-blue-600">{inProgress}</p><p className="text-muted-foreground">In Progress</p></div>
            <div className="rounded-md bg-emerald-50 p-2"><p className="text-lg font-semibold text-emerald-600">{completed}</p><p className="text-muted-foreground">Completed</p></div>
          </div>
          {!jobTypes.length ? (
            <p className="text-sm text-muted-foreground">No maintenance jobs for this property.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {jobTypes.slice(0, 3).map((j: any) => (
                <div key={j.id} className="flex items-center justify-between border-b pb-1.5 last:border-0">
                  <span className="truncate">{j.jobType}</span>
                  <Badge variant="outline" className="text-[10px]">{j.status?.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finance Summary */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4" />Finance Summary</h3>
            <Button size="sm" variant="link" className="h-auto p-0" onClick={() => navigate(`/properties/${property.id}/finance`, { state: { property } })}>View All</Button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Paid transactions to date</p>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Rental Income</dt><dd className="font-medium">{money(summary?.totalCredit)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Landlord Payments</dt><dd className="font-medium text-red-600">-{money(summary?.llNetPaid)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Expenses</dt><dd className="font-medium text-red-600">-{money(summary?.llBuildingExp)}</dd></div>
            <div className="flex justify-between border-t pt-1.5 font-semibold"><dt>Net Income</dt><dd className={netIncome >= 0 ? "text-emerald-600" : "text-red-600"}>{money(netIncome)}</dd></div>
          </dl>

          {/* Approved work is not paid work: it is excluded from the totals
              above, but hiding it entirely made approved transactions look
              lost. Shown separately so the two are never confused. */}
          {summary?.awaiting?.count > 0 && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-800">Awaiting payment</span>
                <span className="font-semibold text-amber-800">{money(summary.awaiting.landlordPayments)}</span>
              </div>
              <p className="mt-0.5 text-xs text-amber-700">
                {summary.awaiting.count} transaction{summary.awaiting.count === 1 ? "" : "s"} not yet paid
                {summary.awaiting.readyToPayCount > 0 ? ` · ${summary.awaiting.readyToPayCount} ready to pay` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Important Dates */}
        <div className="space-y-6">

          <div className="surface p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />Important Dates</h3>
            {!complianceDocs.filter((d) => d.expiryDate).length ? (
              <p className="text-sm text-muted-foreground">No dated certificates on file.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {complianceDocs.filter((d) => d.expiryDate).slice(0, 4).map((d: any) => {
                  const status = expiryLabel(d.expiryDate);
                  const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={d.id} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{d.label || DOC_TYPE_LABEL[d.docType] || d.docType}</span>
                      <span className={status.tone === "destructive" ? "text-red-600" : "text-muted-foreground"}>
                        {new Date(d.expiryDate).toLocaleDateString("en-GB")} {days >= 0 ? `(in ${days}d)` : "(expired)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documents */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Documents</h3>
          </div>
          {!complianceDocs.length ? (
            <p className="text-sm text-muted-foreground">No compliance documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 pr-3">Document Type</th><th className="py-1.5 pr-3">Expiry Date</th><th className="py-1.5">Status</th></tr></thead>
                <tbody>
                  {complianceDocs.slice(0, 5).map((d: any) => {
                    const status = expiryLabel(d.expiryDate);
                    return (
                      <tr key={d.id} className="border-t">
                        <td className="py-1.5 pr-3">{d.label || DOC_TYPE_LABEL[d.docType] || d.docType}</td>
                        <td className="py-1.5 pr-3">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString("en-GB") : "-"}</td>
                        <td className="py-1.5"><Badge variant={status.tone} className={status.tone === "outline" && status.label === "Valid" ? "bg-emerald-100 text-emerald-700 border-transparent" : status.tone === "destructive" && status.label === "Expiring Soon" ? "bg-amber-100 text-amber-700 border-transparent" : ""}>{status.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><StickyNote className="h-4 w-4" />Recent Notes</h3>
          </div>
          {!notes.length ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {notes.map((n: any) => (
                <div key={n.id} className="border-b pb-2 last:border-0">
                  {/* Show a real UK date, never a raw ISO timestamp — and fall
                      back to createdAt when the note carries no date. */}
                  <p className="text-xs text-muted-foreground">{ukDate(n.date || n.createdAt)} by {n.employee ? `${n.employee.first_name} ${n.employee.last_name}`.trim() : "Staff"}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{plainText(n.content)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={tenantModalOpen} onOpenChange={setTenantModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link a tenant to this property</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input autoFocus className="pl-8" placeholder="Search tenants by name, email or phone" value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {searchingTenants && <p className="py-4 text-center text-sm text-muted-foreground">Searching…</p>}
              {!searchingTenants && !tenantResults.length && (
                <p className="py-4 text-center text-sm text-muted-foreground">No tenants found.</p>
              )}
              {!searchingTenants && tenantResults.map((t: any) => {
                const alreadyLinked = tenants.some((x: any) => x.id === t.id);
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{`${t.title || ""} ${t.FirstName || ""} ${t.SureName || ""}`.trim() || "Tenant"}</p>
                      <p className="truncate text-xs text-muted-foreground">{[t.Email, t.MobileNo].filter(Boolean).join(" · ") || "No contact details"}</p>
                    </div>
                    <Button size="sm" variant={alreadyLinked ? "ghost" : "default"} disabled={alreadyLinked || linkingId === t.id} onClick={() => void linkTenant(t.id)}>
                      {linkingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : alreadyLinked ? "Linked" : "Link"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
