import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import StandardInfo from './Vendor/StandardInfo';
import BankDetails from './Vendor/BankDetails';
import Documents from './Vendor/Documents';

import LoadingBar from "react-top-loading-bar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch } from "@/helper/api";


const formSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  postCode: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),

  bankName: z.string().nullable().optional(),
  bankAddressLine1: z.string().nullable().optional(),
  bankAddressLine2: z.string().nullable().optional(),
  bankTown: z.string().nullable().optional(),
  bankPostCode: z.string().nullable().optional(),
  bankCountry: z.string().nullable().optional(),

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
    bankName: vendor.bankName || "",
    bankAddressLine1: vendor.bankAddressLine1 || "",
    bankAddressLine2: vendor.bankAddressLine2 || "",
    bankTown: vendor.bankTown || "",
    bankPostCode: vendor.bankPostCode || "",
    bankCountry: vendor.bankCountry || "",
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
  const navigate = useNavigate();
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
        } else if (
          value !== null &&
          value !== undefined &&
          // An untouched file field (photoId/proofOfRelationship/proofOfOwnership)
          // can default to {} rather than undefined — that's "no file", not a value.
          !(typeof value === "object" && Object.keys(value).length === 0)
        ) {
          payload[key] = value;
        }
      }

      const { data: apiData, error }: any = await patch(`vendor/update/${data.id}`, payload);
      setProgress(60);

      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to update landlord.",
          variant: "destructive",
        });
        return;
      }

      const vendorId = apiData?.vendor?.id;

      if (vendorId && vendorId.length > 0) {
        toast({
          title: "Success",
          description: apiData.message || "Landlord updated successfully!",
        });

        setProgress(100);
        navigate("/vendors");
        return;
      } else {
        throw new Error("Invalid vendor ID or unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update landlord.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeErrors = form.formState.errors;

  const TAB_ORDER = ["personal", "bank", "documents"] as const;
  const currentTabIndex = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]);
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;

  return (
    <DashboardLayout>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold">Processing...</div>
        </div>
      )}

      <div className="bg-background">
        <LoadingBar
          color="hsl(0, 81%, 43%)"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
        />

        <div className="max-w-5xl mx-auto">
          <h1 className="hero-stat text-3xl mb-8">Edit Landlord</h1>

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

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentTabIndex === 0}
                  onClick={() => setActiveTab(TAB_ORDER[currentTabIndex - 1])}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                {isLastTab ? (
                  <Button key="save" type="submit" disabled={isSubmitting}>
                    Save <Check className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    key="next"
                    type="button"
                    onClick={() => setActiveTab(TAB_ORDER[currentTabIndex + 1])}
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditVendor;
