// src/components/ManageProperty.tsx
import React, { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTriggerLg, TabsContent } from "@/components/ui/tabs";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Features from "./Features";
import Parties from "./Parties";
import Rent from "./Rent";
import SupplierInventory from './SupplierInventory';
import ManagementAgreement from "./ManagementAgreement";
import TenancyAgreement from "./TenancyAgreement";
import TransactionPage from "./TransactionPage";
import Notes from "./Notes";
import History from "./History";

// Icons for better visual representation (using Lucide React icons)
import { 
  Building2,
  Users,
  DollarSign,
  Package,
  FileText,
  HandHeart,
  ArrowRightLeft,
  StickyNote,
  History as HistoryIcon,
} from "lucide-react";

// ----- Zod Schemas & Types ----- //

// Feature form schema
const featureSchema = z.object({
  featureType: z.string().min(1, "Feature type is required"),
  value: z.string().optional(),
});
type FeatureFormData = z.infer<typeof featureSchema>;

// Party form schema (role is an enum as per your API)
const partySchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),
  role: z.enum(["TENANT", "LANDLORD", "SUPPLIER", "OTHER"], {
    errorMap: () => ({ message: "Select a valid role" }),
  }),
});
type PartyFormData = z.infer<typeof partySchema>;

// Lease form schema
const leaseSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  landlordId: z.string().min(1, "Landlord ID is required"),
  rent: z.coerce.number({ invalid_type_error: "Rent must be a number" }),
  deposit: z.coerce.number({ invalid_type_error: "Deposit must be a number" }),
  agreementDate: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});
type LeaseFormData = z.infer<typeof leaseSchema>;

// Transaction form schema
const transactionSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }),
  transactionDate: z.string().min(1, "Transaction date is required"),
  type: z.string().min(1, "Transaction type is required"),
  description: z.string().optional(),
});
type TransactionFormData = z.infer<typeof transactionSchema>;


// ----- Main Component ----- //

const ManageProperty = () => {
  // Get property.id from URL parameters
  const location = useLocation();
  const property: any = location.state?.property;

  console.log(property, "property asdadka");

  const {
    register: registerFeature,
    handleSubmit: handleSubmitFeature,
    reset: resetFeature,
    setValue: setFeatureValue,
    formState: { errors: errorsFeature },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
  });

  // ----- Party Form Setup ----- //
  const {
    register: registerParty,
    handleSubmit: handleSubmitParty,
    reset: resetParty,
    setValue: setPartyValue,
    watch: watchParty,
    formState: { errors: errorsParty },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
  });

  // ----- Lease Form Setup ----- //
  const {
    register: registerLease,
    handleSubmit: handleSubmitLease,
    reset: resetLease,
    setValue: setLeaseValue,
    formState: { errors: errorsLease },
  } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
  });

  // ----- Transaction Form Setup ----- //
  const {
    register: registerTransaction,
    handleSubmit: handleSubmitTransaction,
    reset: resetTransaction,
    setValue: setTransactionValue,
    formState: { errors: errorsTransaction },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

useEffect(() => {
console.log("Property data in ManageProperty component:", property);
});

  return (
    <DashboardLayout>
      <div className="w-full mx-auto">
        {/* Header Section */}
        <div className="surface p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Manage Property
              </h1>
              {property && (
                <p className="text-sm text-muted-foreground">
                  Property ID: {property.propertyNo || (property.propertyNumber != null ? property.propertyNumber : property.id)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className=" rounded-lg shadow-sm ">
          <Tabs defaultValue="features" className="w-full">
            {/* Horizontal Scrollable Tab List */}
            <div className="px-6 pt-4">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="w-max">
                  <TabsTriggerLg value="features">
                    <Building2 className="h-4 w-4 mr-2" />
                    Property
                  </TabsTriggerLg>

                  <TabsTriggerLg value="parties">
                    <Users className="h-4 w-4 mr-2" />
                    Parties
                  </TabsTriggerLg>

                  <TabsTriggerLg value="rent">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Rent
                  </TabsTriggerLg>

                  <TabsTriggerLg value="supplier">
                    <Package className="h-4 w-4 mr-2" />
                    Supplier
                  </TabsTriggerLg>

                  <TabsTriggerLg value="management">
                    <HandHeart className="h-4 w-4 mr-2" />
                    Management
                  </TabsTriggerLg>

                  <TabsTriggerLg value="tenancy">
                    <FileText className="h-4 w-4 mr-2" />
                    Tenancy
                  </TabsTriggerLg>

                  <TabsTriggerLg value="transactions">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transactions
                  </TabsTriggerLg>

                  <TabsTriggerLg value="notes">
                    <StickyNote className="h-4 w-4 mr-2" />
                    ToDo / Notes
                  </TabsTriggerLg>

                  <TabsTriggerLg value="history">
                    <HistoryIcon className="h-4 w-4 mr-2" />
                    History
                  </TabsTriggerLg>
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-x-hidden">
              {/* ----- Features Tab ----- */}
              <TabsContent value="features" className="mt-0">
                <Features property={property} />
              </TabsContent>

              {/* ----- Parties Tab ----- */}
              <TabsContent value="parties" className="mt-0">
                <Parties property={property} />
              </TabsContent>

              <TabsContent value="rent" className="mt-0">
                <Rent propertyId={property.id} property={property} />
              </TabsContent>

              <TabsContent value="supplier" className="mt-0">
                <SupplierInventory propertyId={property.id} />
              </TabsContent>

              <TabsContent value="management" className="mt-0">
                <ManagementAgreement
                  propertyId={property.id}
                  property={property}
                />
              </TabsContent>

              <TabsContent value="tenancy" className="mt-0">
                <TenancyAgreement propertyId={property.id} property={property} />
              </TabsContent>

              <TabsContent value="transactions" className="mt-0">
                <TransactionPage propertyId={property.id} property={property} />
              </TabsContent>

            
              {/* ----- Notes Tab ----- */}
              <TabsContent value="notes" className="mt-0">
                <Notes propertyId={property.id} property={property} />
              </TabsContent>

              {/* ----- History Tab ----- */}
              <TabsContent value="history" className="mt-0">
                <History propertyId={property.id} property={property} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageProperty;