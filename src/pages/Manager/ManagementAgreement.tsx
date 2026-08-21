import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchPropertyParties } from "@/redux/dataStore/partySlice";
import { fetchtenants } from "@/redux/dataStore/tenantSlice";
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { generateManagementAgreementPdf } from "@/helper/generateManagementAgreement";

interface ManagementAgreementProps {
  propertyId: string;
  property?: any;
}

const ManagementAgreement: React.FC<ManagementAgreementProps> = ({ propertyId, property }) => {
  const dispatch = useAppDispatch();
  const { propertyParties }: any = useAppSelector((state: any) => state.parties);
  const { tenants }: any = useAppSelector((state: any) => state.tenants);
  const { vendors }: any = useAppSelector((state: any) => state.vendors);

  useEffect(() => {
    if (propertyId) dispatch(fetchPropertyParties(propertyId));
    dispatch(fetchtenants({ page: 1, search: "" }));
    dispatch(fetchVendors({ page: 1, search: "" }));
  }, [dispatch, propertyId]);

  const existingParty = Array.isArray(propertyParties)
    ? propertyParties
    : propertyParties?.data ?? [];

  const linkedTenantNames = existingParty
    .map((p: any) => (Array.isArray(tenants) ? tenants.find((t: any) => t.id === p.Tenantid) : null))
    .filter(Boolean)
    .map((t: any) => [t.FirstName, t.SureName].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");

  const landlord = Array.isArray(vendors)
    ? vendors.find((v: any) => v.id === property?.vendorId)
    : null;
  const vendorName = landlord ? [landlord.firstName, landlord.lastName].filter(Boolean).join(" ") : undefined;

  const handleGenerate = () => {
    generateManagementAgreementPdf({
      addressLine1: property?.addressLine1,
      addressLine2: property?.addressLine2,
      town: property?.town,
      postCode: property?.postCode,
      rentEffectiveDate: property?.rentEffectiveDate,
      rentPerMonth: property?.rentPerMonth,
      rentPayableInAdvance: property?.rentPayableInAdvance,
      rentalTerms: property?.rentalTerms,
      vendorName,
      tenantName: linkedTenantNames || undefined,
    });
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Management Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generated from the property's saved address, rent, and linked landlord/tenant details.
            Update those on the Property and Parties tabs if anything here needs to change.
          </p>
          <Button type="button" onClick={handleGenerate}>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagementAgreement;
