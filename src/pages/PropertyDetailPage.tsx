// The property OVERVIEW page — /properties/:id. Clicking a property in the
// list lands here. Overview only: no tabs. Tenants are linked inline from
// the Overview itself; compliance/documents live in the Add/Edit Property
// wizard steps.
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PropertyOverview from "./Manager/PropertyOverview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2 } from "lucide-react";
import { get } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";

export default function PropertyDetailPage() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const [fetchedProperty, setFetchedProperty] = useState<any>(null);
  const property: any = location.state?.property || fetchedProperty;

  // Property normally arrives via router state (clicked from the list),
  // but that's empty on a direct link, bookmark, or refresh — fetch by
  // :id in that case so the page doesn't crash.
  useEffect(() => {
    if (!location.state?.property && params.id) {
      get<any>(`properties/${params.id}`).then(({ data }) => setFetchedProperty(data));
    }
  }, [params.id, location.state]);

  if (!property) {
    return (
      <DashboardLayout>
        <div className="surface p-8 text-center text-sm text-muted-foreground">Loading property…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" onClick={() => navigate("/properties")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />Back to Properties
      </Button>

      <div className="w-full mx-auto">
        <div className="surface p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              {property.photographs ? (
                <img src={property.photographs} alt="" className="h-24 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{property.addressLine1 || "Property"}</h1>
                  <Badge className="bg-emerald-100 text-emerald-700">{property.propertyStatus === "PUBLISHED" ? "Active" : "Draft"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{[property.town, property.postCode].filter(Boolean).join(", ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPropertyReference(property.propertyNumber)} · {property.bedrooms != null ? `${property.bedrooms} Bed ` : ""}{property.propertyTypeCategory || property.category || "Property"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <span><span className="text-muted-foreground">Property Type </span><span className="font-medium">{property.propertyTypeCategory || "-"}</span></span>
                  <span><span className="text-muted-foreground">Bedrooms </span><span className="font-medium">{property.bedrooms ?? "-"}</span></span>
                  <span><span className="text-muted-foreground">Bathrooms </span><span className="font-medium">{property.bathrooms ?? "-"}</span></span>
                  <span><span className="text-muted-foreground">Reception Rooms </span><span className="font-medium">{property.receptions ?? "-"}</span></span>
                  <span><span className="text-muted-foreground">Tenure </span><span className="font-medium">{property.category || "-"}</span></span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.gas && <Badge variant="outline">Gas</Badge>}
                  {property.electricity && <Badge variant="outline">Electric</Badge>}
                  <Badge variant="outline">Water</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/property/edit", { state: { property } })}>Edit Property</Button>
          </div>
        </div>

        <PropertyOverview property={property} />
      </div>
    </DashboardLayout>
  );
}
