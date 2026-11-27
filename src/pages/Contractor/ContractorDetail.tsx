// Contractor detail page — /contractors/:id. Replaces the old "View" popup.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StoredImage from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { get } from "@/helper/api";
import ContractorJobHistory from "@/components/maintenance/ContractorJobHistory";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="text-sm break-words">{value || "-"}</p>
  </div>
);

const ContractorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractor, setContractor] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<any>(`contractor/getContractorById/${id}`).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) setError(error?.message || "Contractor not found");
      else setContractor(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/contractors")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link to="/contractors" className="hover:underline">Contractors</Link>
            {contractor && <>{" > "}{contractor.name}</>}
          </div>
        </div>

        {error ? (
          <div className="py-12 text-center text-muted-foreground">{error}</div>
        ) : !contractor ? (
          <div className="py-12 text-center text-muted-foreground">Loading contractor...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {contractor.logoFileId && <StoredImage fileId={contractor.logoFileId} alt="Logo" className="h-12 w-12 rounded object-cover" />}
                <h1 className="hero-stat text-[2rem]">{contractor.name}</h1>
              </div>
              <Button variant="outline" onClick={() => navigate("/contractors/edit", { state: { contractor } })}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Company information</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" value={contractor.name} />
                  <Field label="Specialty" value={contractor.specialty} />
                </div>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Contact details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" value={contractor.phone} />
                  <Field label="Email" value={contractor.email} />
                </div>
              </Card>
              <Card className="p-4 space-y-3 lg:col-span-2">
                <div className="font-semibold">Address</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Field label="Address line 1" value={contractor.addressLine1 || contractor.address} />
                  <Field label="Address line 2" value={contractor.addressLine2} />
                  <Field label="Town" value={contractor.town} />
                  <Field label="Post code" value={contractor.postCode} />
                </div>
              </Card>
            </div>

            <ContractorJobHistory contractorId={contractor.id} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContractorDetail;
