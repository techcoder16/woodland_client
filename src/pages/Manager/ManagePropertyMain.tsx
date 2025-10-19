// src/components/ManageProperty.tsx
import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InputField from "@/utils/InputField";
import SelectField from "@/utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";
import { MainNav } from "@/components/MainNav";
import Dashboard from "../Dashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import postApi from "@/helper/postApi";
import Features from "./Features";
import Parties from "./Parties";
import Rent from "./Rent";
import SupplierInventory from './SupplierInventory';
import ManagementAgreement from "./ManagementAgreement";
import TenancyAgreement from "./TenancyAgreement";
import TransactionPage from "./TransactionPage";
import Notes from "./Notes";

// Icons for better visual representation (using Lucide React icons)
import { 
  Building2, 
  Users, 
  DollarSign, 
  Package, 
  FileText, 
  HandHeart, 
  ArrowRightLeft, 
  StickyNote 
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



  return (
    <DashboardLayout>
      <div className="p-6 w-full mx-auto  min-h-screen">
        {/* Header Section */}
        <div className=" rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold  mb-2">
                Manage Property
              </h1>
              {property && (
                <p className="">
                  Property ID: {property.propertyNumber}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 " />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className=" rounded-lg shadow-sm ">
          <Tabs defaultValue="features" className="w-full">
            {/* Horizontal Scrollable Tab List */}
            <div className="border-b  px-6 py-4">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex h-12 items-center justify-center rounded-lg  p-1 ">
                  <TabsTrigger 
                    value="features" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Property
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="parties"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Parties
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="rent"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Rent
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="supplier"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Supplier
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="management"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <HandHeart className="h-4 w-4 mr-2" />
                    Management
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="tenancy"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Tenancy
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="transactions"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="notes"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:  data-[state=active]:shadow-sm"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                   ToDo / Notes
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
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
                <ManagementAgreement propertyId={property.id} />
              </TabsContent>

              <TabsContent value="tenancy" className="mt-0">
                <TenancyAgreement propertyId={property.id} />
              </TabsContent>

              <TabsContent value="transactions" className="mt-0">
                <TransactionPage propertyId={property.id} />
              </TabsContent>

            
              {/* ----- Notes Tab ----- */}
              <TabsContent value="notes" className="mt-0">
                <Notes propertyId={property.id} property={property} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageProperty;