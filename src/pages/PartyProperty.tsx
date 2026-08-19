import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { partyGet, getPartyInfo, PartyKind } from "@/helper/partyAuth";
import PartyDashboardLayout from "@/components/layout/PartyDashboardLayout";
import { generateManagementAgreementPdf } from "@/helper/generateManagementAgreement";

interface RoomRow {
  name: string;
  length: number | "";
  width: number | "";
}

interface Property {
  id: string;
  propertyNumber?: number;
  propertyStatus?: string;
  propertyTypeCategory?: string;
  bedrooms?: number;
  bathrooms?: number;
  receptions?: number;
  postCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  country?: string;
  rentPerMonth?: string;
  rentEffectiveDate?: string;
  rentPayableInAdvance?: string;
  rentalTerms?: string;
  rooms?: unknown;
  photographs?: string | null;
}

interface RentTransaction {
  id: string;
  toLandlordDate?: string;
  toLandlordRentReceived?: number;
  toLandlordNetPaid?: number;
  toLandLordMode?: string;
}

const formatAddress = (property: Property) =>
  [property.addressLine1, property.addressLine2, property.town, property.postCode, property.country]
    .filter(Boolean)
    .join(", ");

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "-");

const calculateArea = (length: RoomRow["length"], width: RoomRow["width"]) => {
  if (length === "" || width === "" || isNaN(Number(length)) || isNaN(Number(width))) return 0;
  return Number(length) * Number(width);
};

const PropertyDetail = ({ kind, property }: { kind: PartyKind; property: Property }) => {
  const [rentHistory, setRentHistory] = useState<RentTransaction[] | null>(null);
  const [loadingRent, setLoadingRent] = useState(false);

  const loadRentHistory = async () => {
    if (rentHistory !== null) return;
    setLoadingRent(true);
    try {
      const data = await partyGet<any>(kind, `property-management/my-property/${property.id}/rent-history`);
      setRentHistory(data?.transactions || []);
    } catch (error) {
      toast.error("Failed to load rent history");
    } finally {
      setLoadingRent(false);
    }
  };

  useEffect(() => {
    loadRentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  const handleGenerateManagementAgreement = async () => {
    const party = await getPartyInfo(kind);
    const vendorName =
      kind === "vendor"
        ? [party?.firstName, party?.lastName].filter(Boolean).join(" ")
        : undefined;

    generateManagementAgreementPdf({
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2,
      town: property.town,
      postCode: property.postCode,
      rentEffectiveDate: property.rentEffectiveDate,
      rentPerMonth: property.rentPerMonth,
      rentPayableInAdvance: property.rentPayableInAdvance,
      rentalTerms: property.rentalTerms,
      vendorName,
    });
  };

  const rooms: RoomRow[] = Array.isArray(property.rooms) ? property.rooms : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{formatAddress(property) || "Property"}</CardTitle>
        {property.propertyStatus && <Badge variant="outline">{property.propertyStatus}</Badge>}
      </CardHeader>
      <CardContent className="space-y-6">
        {property.photographs && (
          property.photographs.startsWith("data:application/pdf") ? (
            <embed src={property.photographs} type="application/pdf" className="w-full h-64 rounded-md border" />
          ) : (
            <img
              src={property.photographs}
              alt="Property"
              className="w-full max-h-64 object-cover rounded-md border"
            />
          )
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {property.propertyTypeCategory && (
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p>{property.propertyTypeCategory}</p>
            </div>
          )}
          {property.bedrooms != null && (
            <div>
              <p className="text-xs text-muted-foreground">Bedrooms</p>
              <p>{property.bedrooms}</p>
            </div>
          )}
          {property.bathrooms != null && (
            <div>
              <p className="text-xs text-muted-foreground">Bathrooms</p>
              <p>{property.bathrooms}</p>
            </div>
          )}
          {property.receptions != null && (
            <div>
              <p className="text-xs text-muted-foreground">Receptions</p>
              <p>{property.receptions}</p>
            </div>
          )}
          {property.rentPerMonth && (
            <div>
              <p className="text-xs text-muted-foreground">Rent per month</p>
              <p>{property.rentPerMonth}</p>
            </div>
          )}
          {property.rentEffectiveDate && (
            <div>
              <p className="text-xs text-muted-foreground">Rent effective date</p>
              <p>{property.rentEffectiveDate}</p>
            </div>
          )}
        </div>

        {rooms.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Rooms</p>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="text-left border-b bg-muted/50">
                    <th className="p-2">Room</th>
                    <th className="p-2">Length (m)</th>
                    <th className="p-2">Width (m)</th>
                    <th className="p-2">Area (m²)</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{room.name}</td>
                      <td className="p-2">{room.length}</td>
                      <td className="p-2">{room.width}</td>
                      <td className="p-2">{calculateArea(room.length, room.width).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Rent status</p>
          {loadingRent ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !rentHistory || rentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rent payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-md border p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Most recent payment</p>
                <p className="text-sm font-medium">
                  {rentHistory[0].toLandlordNetPaid ?? rentHistory[0].toLandlordRentReceived} on{" "}
                  {formatDate(rentHistory[0].toLandlordDate)}
                </p>
              </div>
              {rentHistory.length > 1 && (
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="text-left border-b bg-muted/50">
                        <th className="p-2">Date</th>
                        <th className="p-2">Rent received</th>
                        <th className="p-2">Net paid</th>
                        <th className="p-2">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentHistory.slice(1).map((t) => (
                        <tr key={t.id} className="border-b">
                          <td className="p-2">{formatDate(t.toLandlordDate)}</td>
                          <td className="p-2">{t.toLandlordRentReceived ?? "-"}</td>
                          <td className="p-2">{t.toLandlordNetPaid ?? "-"}</td>
                          <td className="p-2">{t.toLandLordMode || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleGenerateManagementAgreement}>
            <FileText className="h-4 w-4 mr-2" />
            Management Agreement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const PartyProperty = ({ kind }: { kind: PartyKind }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await partyGet<any>(kind, "property-management/my-property");
        setProperties(data?.properties || []);
      } catch (error) {
        toast.error("Failed to load property information");
      } finally {
        setLoading(false);
      }
    })();
  }, [kind]);

  return (
    <PartyDashboardLayout kind={kind}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{kind === "vendor" ? "My Properties" : "My Property"}</h1>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No property is linked to your account yet.
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => <PropertyDetail key={property.id} kind={kind} property={property} />)
        )}
      </div>
    </PartyDashboardLayout>
  );
};

export default PartyProperty;
