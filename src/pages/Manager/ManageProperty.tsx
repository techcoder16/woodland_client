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

// Note form schema
const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});
type NoteFormData = z.infer<typeof noteSchema>;

// ----- Main Component ----- //

const ManageProperty = () => {
  // Get property.id from URL parameters
  const location = useLocation();
  const property:any = location.state?.property;
  // ----- Feature Form Setup ----- /
  // 
  // c/

  console.log(property,"property asdadka")
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

  // ----- Note Form Setup ----- //
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    setValue: setNoteValue,
    formState: { errors: errorsNote },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  // ----- API Submit Handlers ----- //

  const onSubmitFeature = async (data: FeatureFormData) => {
    const payload = { ...data };
    const res = await postApi("/manager/features/create",data);
    if (res) {
      alert("Feature created successfully");
      resetFeature();
    } else {
      alert("Error creating feature");
    }
  };

  const onSubmitParty = async (data: PartyFormData) => {
    const payload = { ...data };
    const res = await fetch("/manager/parties/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Party created successfully");
      resetParty();
    } else {
      alert("Error creating party");
    }
  };

  const onSubmitLease = async (data: LeaseFormData) => {
    const payload = { ...data };
    const res = await fetch("/manager/leases/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Lease created successfully");
      resetLease();
    } else {
      alert("Error creating lease");
    }
  };

  const onSubmitTransaction = async (data: TransactionFormData) => {
    const payload = { ...data };
    const res = await fetch("/manager/transactions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Transaction created successfully");
      resetTransaction();
    } else {
      alert("Error creating transaction");
    }
  };

  const onSubmitNote = async (data: NoteFormData) => {
    const payload = { ...data };
    const res = await fetch("/manager/notes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Note created successfully");
      resetNote();
    } else {
      alert("Error creating note");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Manage Property</h1>

   
        <Tabs defaultValue="features" className="mt-6">
          <TabsList className="grid grid-cols-5 gap-4">
            <TabsTrigger value="features">Property</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="leases">Leases</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* ----- Features Tab ----- */}
          <TabsContent value="features" className="mt-4">
            {/* <Card className="shadow">
              <CardHeader>
                <CardTitle>Create Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitFeature(onSubmitFeature)}
                  className="space-y-4"
                >
                  <InputField
                    label="Feature Type"
                    name="featureType"
                    register={registerFeature}
                    error={errorsFeature.featureType?.message}
                    placeholder="Enter feature type"
                    setValue={setFeatureValue}
                  />
                  <InputField
                    label="Value"
                    name="value"
                    register={registerFeature}
                    error={errorsFeature.value?.message}
                    placeholder="Enter value (optional)"
                    setValue={setFeatureValue}
                  />
                  <Button type="submit">Create Feature</Button>
                </form>
              </CardContent>
            </Card> */}
            <Features property={property}></Features>
          </TabsContent>

          {/* ----- Parties Tab ----- */}
          <TabsContent value="parties" className="mt-4">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Create Party</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitParty(onSubmitParty)}
                  className="space-y-4"
                >
                  <InputField
                    label="Party ID"
                    name="partyId"
                    register={registerParty}
                    error={errorsParty.partyId?.message}
                    placeholder="Enter party ID"
                    setValue={setPartyValue}
                  />
                  <SelectField
                    label="Role"
                    name="role"
                    options={[
                      { value: "TENANT", label: "Tenant" },
                      { value: "LANDLORD", label: "Landlord" },
                      { value: "SUPPLIER", label: "Supplier" },
                      { value: "OTHER", label: "Other" },
                    ]}
                    register={registerParty}
                    error={errorsParty.role?.message}
                    setValue={setPartyValue}
                    watch={watchParty}
                  />
                  <Button type="submit">Create Party</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Leases Tab ----- */}
          <TabsContent value="leases" className="mt-4">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Create Lease</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitLease(onSubmitLease)}
                  className="space-y-4"
                >
                  <InputField
                    label="Tenant ID"
                    name="tenantId"
                    register={registerLease}
                    error={errorsLease.tenantId?.message}
                    placeholder="Enter tenant ID"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="Landlord ID"
                    name="landlordId"
                    register={registerLease}
                    error={errorsLease.landlordId?.message}
                    placeholder="Enter landlord ID"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="Rent"
                    name="rent"
                    register={registerLease}
                    error={errorsLease.rent?.message}
                    placeholder="Enter rent"
                    type="number"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="Deposit"
                    name="deposit"
                    register={registerLease}
                    error={errorsLease.deposit?.message}
                    placeholder="Enter deposit"
                    type="number"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="Agreement Date"
                    name="agreementDate"
                    register={registerLease}
                    error={errorsLease.agreementDate?.message}
                    placeholder="YYYY-MM-DD (optional)"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="Start Date"
                    name="startDate"
                    register={registerLease}
                    error={errorsLease.startDate?.message}
                    placeholder="YYYY-MM-DD"
                    setValue={setLeaseValue}
                  />
                  <InputField
                    label="End Date"
                    name="endDate"
                    register={registerLease}
                    error={errorsLease.endDate?.message}
                    placeholder="YYYY-MM-DD (optional)"
                    setValue={setLeaseValue}
                  />
                  <Button type="submit">Create Lease</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Transactions Tab ----- */}
          <TabsContent value="transactions" className="mt-4">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Create Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitTransaction(onSubmitTransaction)}
                  className="space-y-4"
                >
                  <InputField
                    label="Amount"
                    name="amount"
                    register={registerTransaction}
                    error={errorsTransaction.amount?.message}
                    placeholder="Enter amount"
                    type="number"
                    setValue={setTransactionValue}
                  />
                  <InputField
                    label="Transaction Date"
                    name="transactionDate"
                    register={registerTransaction}
                    error={errorsTransaction.transactionDate?.message}
                    placeholder="YYYY-MM-DD"
                    setValue={setTransactionValue}
                  />
                  <InputField
                    label="Type"
                    name="type"
                    register={registerTransaction}
                    error={errorsTransaction.type?.message}
                    placeholder="Enter transaction type"
                    setValue={setTransactionValue}
                  />
                  <TextAreaField
                    label="Description"
                    name="description"
                    register={registerTransaction}
                    error={errorsTransaction.description?.message}
                    placeholder="Enter description (optional)"
               
                  />
                  <Button type="submit">Create Transaction</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----- Notes Tab ----- */}
          <TabsContent value="notes" className="mt-4">
            <Card className="shadow">
              <CardHeader>
                <CardTitle>Create Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitNote(onSubmitNote)}
                  className="space-y-4"
                >
                  <TextAreaField
                    label="Content"
                    name="content"
                    register={registerNote}
                    error={errorsNote.content?.message}
                    placeholder="Enter note content"
              
                  />
                  <Button type="submit">Create Note</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
    </DashboardLayout>
  );
};

export default ManageProperty;
