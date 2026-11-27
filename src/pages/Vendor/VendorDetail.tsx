// Landlord (vendor) detail page — /vendors/:id. Replaces the old "View" popup.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { get } from "@/helper/api";
import { openStoredFile } from "@/helper/fileUpload";
import VendorBankAccounts from "@/components/vendors/VendorBankAccounts";
import { useFileUrls } from "@/hooks/useFileUrls";
import { formatPropertyReference } from "@/utils/propertyReference";

const DOCUMENTS = [
  { key: "photoIdFileId", label: "Photo ID" },
  { key: "proofOfRelationshipFileId", label: "Proof of Residential Address" },
  { key: "proofOfOwnershipFileId", label: "Anti-Money Laundering Certificate" },
] as const;

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="text-sm break-words">{value || "-"}</p>
  </div>
);

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vendor, setVendor] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<any>(`vendor/getVendorById/${id}`).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) setError(error?.message || "Landlord not found");
      else setVendor(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const files = useFileUrls(vendor ? DOCUMENTS.map((d) => vendor[d.key]) : []);
  const openDoc = (fileId: string, download: boolean) =>
    openStoredFile(fileId, { download }).catch(() => toast.error("This document is no longer available."));

  const name = vendor ? [vendor.firstName, vendor.lastName].filter(Boolean).join(" ") || vendor.companyName || "Landlord" : "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = vendor?.property || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/vendors")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link to="/vendors" className="hover:underline">Landlords</Link>
            {vendor && <>{" > "}{name}</>}
          </div>
        </div>

        {error ? (
          <div className="py-12 text-center text-muted-foreground">{error}</div>
        ) : !vendor ? (
          <div className="py-12 text-center text-muted-foreground">Loading landlord...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="hero-stat text-[2rem]">{name}</h1>
              <Button variant="outline" onClick={() => navigate("/vendors/edit", { state: { vendor } })}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Personal information</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Landlord type" value={vendor.vendorType === "COMPANY" ? "Company" : "Individual"} />
                  {vendor.vendorType === "COMPANY" && <Field label="Company name" value={vendor.companyName} />}
                  <Field label="First name" value={vendor.firstName} />
                  <Field label="Last name" value={vendor.lastName} />
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="font-semibold">Contact details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" value={vendor.phone} />
                  <Field label="Email" value={vendor.email} />
                  <Field label="Other emails" value={vendor.otherEmails} />
                  <Field label="Preferred contact" value={({ EMAIL: "Email", PHONE: "Phone" } as Record<string, string>)[vendor.preferredContact]} />
                  <Field label="Address" value={[vendor.addressLine1, vendor.addressLine2, vendor.town, vendor.postCode].filter(Boolean).join(", ")} />
                  <Field label="Country" value={vendor.country === "GB" || !vendor.country ? "United Kingdom" : vendor.country} />
                </div>
              </Card>

              <VendorBankAccounts vendorId={vendor.id} />

              <Card className="p-4 space-y-3">
                <div className="font-semibold">Documents</div>
                <div className="space-y-2">
                  {DOCUMENTS.map((doc) => {
                    const fileId: string | undefined = vendor[doc.key];
                    return (
                      <div key={doc.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">{doc.label}</span>
                        {fileId ? (
                          <span className="flex items-center gap-3">
                            <span className="truncate max-w-[12rem]" title={files[fileId]?.name}>{files[fileId]?.name || "Uploaded"}</span>
                            <button type="button" className="text-primary underline" onClick={() => void openDoc(fileId, false)}>View</button>
                            <button type="button" className="text-primary underline" onClick={() => void openDoc(fileId, true)}>Download</button>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <Card className="p-4 space-y-3">
              <div className="font-semibold">Properties</div>
              {!properties.length ? (
                <p className="text-sm text-muted-foreground">No properties linked.</p>
              ) : (
                <div className="divide-y">
                  {properties.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center gap-3 py-2 text-left text-sm hover:text-primary"
                      onClick={() => navigate(`/properties/${p.id}`)}
                    >
                      <span className="font-mono text-xs">{formatPropertyReference(p.propertyNumber)}</span>
                      <span>{[p.addressLine1, p.addressLine2, p.town, p.postCode].filter(Boolean).join(", ")}</span>
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

export default VendorDetail;
