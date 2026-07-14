import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import StandardInfo from './Vendor/StandardInfo';
import BankDetails from './Vendor/BankDetails';
import Documents from './Vendor/Documents';

import LoadingBar from "react-top-loading-bar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch } from "@/helper/api";


const formSchema = z.object({
  id: z.string(),
  firstName: z.string().nonempty('First Name is required'),
  lastName: z.string().nonempty('Last Name is required'),
  postCode: z.string().nonempty('Post Code is required'),
  addressLine1: z.string().nonempty('Address Line is required'),
  addressLine2: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),

  bankBody: z.string().nullable().optional(),
  bankAddressLine1: z.string().nullable().optional(),
  bankAddressLine2: z.string().nullable().optional(),
  bankTown: z.string().nullable().optional(),
  bankPostCode: z.string().nullable().optional(),
  bankCountry: z.string().nullable().optional(),
  bankIban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  nib: z.string().nullable().optional(),

  photoId: z.any().nullable().optional(),
  proofOfRelationship: z.any().nullable().optional(),
  proofOfOwnership: z.any().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

const buildVendorDefaults = (vendor: any) => {
  if (!vendor) return {};

  return {
    id: vendor.id ?? "",
    firstName: vendor.firstName || "",
    lastName: vendor.lastName || "",
    postCode: vendor.postCode || "",
    addressLine1: vendor.addressLine1 || "",
    addressLine2: vendor.addressLine2 || "",
    town: vendor.town || "",
    country: vendor.country || "",
    phone: vendor.phone || "",
    email: vendor.email || "",
    bankBody: vendor.bankBody || "",
    bankAddressLine1: vendor.bankAddressLine1 || "",
    bankAddressLine2: vendor.bankAddressLine2 || "",
    bankTown: vendor.bankTown || "",
    bankPostCode: vendor.bankPostCode || "",
    bankCountry: vendor.bankCountry || "",
    bankIban: vendor.bankIban || "",
    bic: vendor.bic || "",
    nib: vendor.nib || "",
    photoId: vendor.photoId || "",
    proofOfRelationship: vendor.proofOfRelationship || "",
    proofOfOwnership: vendor.proofOfOwnership || "",
  };
};

const EditVendor = () => {

  const location = useLocation();
  const vendor = location.state?.vendor;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: buildVendorDefaults(vendor) as any,
  });

  const { toast } = useToast();
  const { watch, register, setValue } = form;

  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields before saving.",
        variant: "destructive",
      });
      return;
    }

    setProgress(30);
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === "id") continue;
        if (Array.isArray(value)) {
          payload[key] = value[0] ?? null;
        } else if (value !== null && value !== undefined) {
          payload[key] = value;
        }
      }

      const { data: apiData, error }: any = await patch(`vendor/update/${data.id}`, payload);
      setProgress(60);

      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to update vendor.",
          variant: "destructive",
        });
        return;
      }

      const vendorId = apiData?.vendor?.id;

      if (vendorId && vendorId.length > 0) {
        toast({
          title: "Success",
          description: apiData.message || "Vendor updated successfully!",
        });

        setProgress(100);
      } else {
        throw new Error("Invalid vendor ID or unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeErrors = form.formState.errors;

  return (
    <DashboardLayout>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold">Processing...</div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <LoadingBar
          color="rgb(95,126,220)"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
        />

        <div className="p-6 max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Edit Vendor</h1>

          <Card className="p-6 shadow-md">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-0">
                  <StandardInfo watch={watch} register={register} errors={activeErrors} setValue={setValue} clearErrors={form.clearErrors} />
                </TabsContent>
                <TabsContent value="bank" className="mt-0">
                  <BankDetails watch={watch} register={register} errors={activeErrors} setValue={setValue} clearErrors={form.clearErrors} />
                </TabsContent>
                <TabsContent value="documents" className="mt-0">
                  <Documents watch={watch} register={register} setValue={setValue} errors={activeErrors} />
                </TabsContent>
              </Tabs>

              {Object.keys(activeErrors).length > 0 && (
                <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4">
                  <div className="font-semibold mb-2 text-destructive">Please fix the following errors:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                    {Object.entries(activeErrors).map(([key, error]: any) => (
                      <li key={key}>{key}: {error?.message || "This field is required"}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <Button type="submit" className="bg-red-500 text-white px-4 py-2 rounded" disabled={isSubmitting}>
                  Save <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditVendor;
