// The property FINANCE page — /properties/:id/finance. A separate page,
// reached from the "View All" link on the property Overview's Finance
// Summary card. Finance staff only.
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PaymentHistorySection from "./Manager/PaymentHistorySection";
import TransactionPage from "./Manager/TransactionPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { get } from "@/helper/api";
import { useAuth } from "@/context/AuthContext";
import { formatPropertyReference } from "@/utils/propertyReference";

export default function PropertyFinancePage() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { canAccessFinance } = useAuth();
  const [fetchedProperty, setFetchedProperty] = useState<any>(null);
  const property: any = location.state?.property || fetchedProperty;
  const searchParams = new URLSearchParams(location.search);
  const prefillRent = searchParams.get("prefillRent") || undefined;
  const prefillDue = searchParams.get("prefillDue") || undefined;
  // A prefilled rent/date means the user came here to record a payment, so
  // open straight on the transaction editor rather than the read-only log.
  const [view, setView] = useState<"history" | "transactions">(prefillRent || prefillDue ? "transactions" : "history");

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
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" onClick={() => navigate(`/properties/${property.id}`, { state: { property } })}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />Back to Property
      </Button>

      <div className="mb-5">
        <p className="text-sm text-muted-foreground">
          {formatPropertyReference(property.propertyNumber)} · {[property.addressLine1, property.town, property.postCode].filter(Boolean).join(", ")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
      </div>

      {!canAccessFinance ? (
        <div className="surface p-10 text-center">
          <p className="font-medium">Finance access required</p>
          <p className="mt-1 text-sm text-muted-foreground">Only finance staff can view this property's payment records.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2 border-b pb-3">
            <Button size="sm" variant={view === "history" ? "default" : "outline"} onClick={() => setView("history")}>Payment History</Button>
            <Button size="sm" variant={view === "transactions" ? "default" : "outline"} onClick={() => setView("transactions")}>Transactions</Button>
          </div>
          {view === "history" ? (
            <PaymentHistorySection propertyId={property.id} />
          ) : (
            <TransactionPage propertyId={property.id} property={property} prefillRent={prefillRent} prefillDue={prefillDue} />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
