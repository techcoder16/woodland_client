// Occupier (tenant) detail page — /tenants/:id. Replaces the old "View" popup.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { get } from "@/helper/api";

interface TenantOccupancy {
  id: string;
  reference: string;
  type: string;
  status: string;
  property?: { id: string; addressLine1?: string; town?: string; postCode?: string } | null;
}

interface TenantRecord {
  id: string;
  title?: string | null;
  FirstName?: string | null;
  SureName?: string | null;
  MobileNo?: string | null;
  HomePhone?: string | null;
  Email?: string | null;
  Email2?: string | null;
  occupierType?: string | null;
  occupancies?: TenantOccupancy[];
}

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="text-sm">{value || "-"}</p>
  </div>
);

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    get<TenantRecord>(`tenants/${id}`).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) setError(error?.message || "Occupier not found");
      else setTenant(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const name = tenant ? [tenant.title, tenant.FirstName, tenant.SureName].filter(Boolean).join(" ") || "Occupier" : "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/tenants")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link to="/tenants" className="hover:underline">Occupiers</Link>
            {tenant && <>{" > "}{name}</>}
          </div>
        </div>

        {error ? (
          <div className="py-12 text-center text-muted-foreground">{error}</div>
        ) : !tenant ? (
          <div className="py-12 text-center text-muted-foreground">Loading occupier...</div>
        ) : (
          <>
            <h1 className="hero-stat text-[2rem]">{name}</h1>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Personal information</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Title" value={tenant.title} />
                  <Field label="First name" value={tenant.FirstName} />
                  <Field label="Last name" value={tenant.SureName} />
                  <Field label="Occupier type" value={tenant.occupierType ? tenant.occupierType.charAt(0) + tenant.occupierType.slice(1).toLowerCase() : null} />
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="font-semibold">Contact details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact number 1" value={tenant.MobileNo} />
                  <Field label="Contact number 2" value={tenant.HomePhone} />
                  <Field label="Email 1" value={tenant.Email} />
                  <Field label="Email 2" value={tenant.Email2} />
                </div>
              </Card>
            </div>

            <Card className="p-4 space-y-3">
              <div className="font-semibold">Occupancies</div>
              {!tenant.occupancies?.length ? (
                <p className="text-sm text-muted-foreground">No occupancies for this occupier.</p>
              ) : (
                <div className="divide-y">
                  {tenant.occupancies.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:text-primary"
                      onClick={() => navigate(`/occupancy/${o.id}`)}
                    >
                      <span>
                        <span className="font-mono text-xs mr-2">{o.reference}</span>
                        {[o.property?.addressLine1, o.property?.town, o.property?.postCode].filter(Boolean).join(", ") || "-"}
                      </span>
                      <Badge variant="outline">{o.status.charAt(0) + o.status.slice(1).toLowerCase()}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TenantDetail;
