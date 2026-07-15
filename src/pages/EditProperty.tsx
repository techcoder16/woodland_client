import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import PropertyInfo from "./Property/PropertyInfo";
import DocumentsCertificates from "./Property/DocumentsCertificates";
import RentalAgreement from "./Property/RentalAgreement";
import ManagementAgreement from "./Manager/ManagementAgreement";
import TenancyAgreement from "./Manager/TenancyAgreement";
import NotesStep from "./Manager/NotesStep";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch } from "@/helper/api";
import { propertySchema } from "@/schema/property.schema";
import { buildPropertyFormData } from "@/helper/buildPropertyFormData";
import { parseApiError } from "@/helper/parseApiError";

const STEP_LABELS = [
  "Standard Info",
  "Documents/Certificates",
  "Rental Agreement",
  "Management Agreement",
  "Tenancy Agreement",
  "Notes",
] as const;

const STEP_FIELDS: string[][] = [
  ["vendor", "for", "postCode", "propertyName", "addressLine1", "addressLine2", "town", "country", "propertyTypeCategory", "bedrooms", "bathrooms", "wheelchairAccess", "hasGarden", "lift", "gas", "electricity", "rooms"],
  ["photographs", "floorPlans", "epcCertificate", "gasCertificate", "electricityCertificate", "fireRiskAssessment", "insuranceCertificate", "emergencyLightingCertificate", "propertyLicense"],
  ["rentalTenure", "rentalDescription"],
  [],
  [],
  [],
];

type FormData = z.infer<typeof propertySchema>;

function splitFeeValue(value: string) {
  if (!value) return { amount: "", type: "" };
  const parts = value.split("-");
  return { amount: parts[0] || "", type: parts[1] || "" };
}

function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
  return Boolean(value);
}

function parseJsonArray(value: any, fallback: any[] = []): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    if (value === "") return fallback;
    try { return JSON.parse(value); } catch { return [value]; }
  }
  return fallback;
}

function parseBase64Array(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); }
    catch { return value.startsWith("data:image") ? [value] : []; }
  }
  return [];
}

const EditProperty = () => {
  const location = useLocation();
  const { toast } = useToast();

  const property = useMemo(
    () => location.state?.property,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.state?.property?.id]
  );

  const transformedVendorData = useMemo((): FormData | Record<string, never> => {
    if (!property) return {};

    const salesFeeParts = splitFeeValue(property.salesFee);
    const priceParts = splitFeeValue(property.price);

    return {
      ...property,
      salesFee_input: salesFeeParts.amount,
      salesFee_select: salesFeeParts.type,
      price_input: priceParts.amount,
      price_select: priceParts.type,
      country: property.country ?? "",
      vendor: property.vendorId ?? "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      receptions: property.receptions ?? "",
      wheelchairAccess: toBoolean(property.wheelchairAccess),
      hasGarden: toBoolean(property.hasGarden),
      lift: toBoolean(property.lift),
      gas: toBoolean(property.gas),
      electricity: toBoolean(property.electricity),
      nonGasProperty: toBoolean(property.nonGasProperty),
      showOnWebsite: toBoolean(property.showOnWebsite),
      newHome: toBoolean(property.newHome),
      offPlan: toBoolean(property.offPlan),
      sendToBoomin: toBoolean(property.sendToBoomin),
      sendToRightmoveNow: toBoolean(property.sendToRightmoveNow),
      sendToOnTheMarket: toBoolean(property.sendToOnTheMarket),
      newsAndExclusive: toBoolean(property.newsAndExclusive),
      rooms: parseJsonArray(property.rooms),
      propertyFeature: parseJsonArray(property.propertyFeature),
      selectPortals: parseJsonArray(property.selectPortals),
      currentEERating: property.currentEERating ? String(property.currentEERating) : "",
      potentialEERating: property.potentialEERating ? String(property.potentialEERating) : "",
      photographs: parseBase64Array(property.photographs),
      floorPlans: parseBase64Array(property.floorPlans),
      epcChartOption: property.epcChartOption || "ratings",
      epcReportOption: property.epcReportOption || "uploadReport",
      videoTourDescription: property.videoTourDescription || "",
      epcReportURL: property.epcReportURL || "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  const form = useForm<FormData>({
    resolver: zodResolver(propertySchema),
    mode: "onSubmit",
    defaultValues: transformedVendorData as FormData,
  });
  const { watch, reset } = form;

  const loadedPropertyId = useRef<string | null>(null);

  useEffect(() => {
    if (property?.id && property.id !== loadedPropertyId.current) {
      reset(transformedVendorData as FormData, {
        keepDefaultValues: false,
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
      loadedPropertyId.current = property.id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  const handleNext = async () => {
    const isValid = await form.trigger(STEP_FIELDS[currentStep] as any, { shouldFocus: true });
    if (isValid) {
      form.clearErrors();
      setCurrentStep((prev) => prev + 1);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields on this step before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = async (data: FormData, isDraft: boolean = false) => {
    if (!isDraft) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted fields before publishing.",
          variant: "destructive",
        });
        return;
      }
    }

    setProgress(30);
    setIsSubmitting(true);

    try {
      const formData = buildPropertyFormData(data as any, isDraft);
      formData.append("id", property?.id ?? "");

      const { data: apiData, error }: any = await patch(`properties/${property?.id}`, formData);
      setProgress(60);

      if (error?.message) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      const updatedId = apiData?.property?.id;
      if (updatedId?.length > 0) {
        toast({
          title: "Success",
          description: isDraft ? "Property saved as draft successfully!" : apiData.message || "Property updated successfully!",
        });
        setProgress(100);
        if (!isDraft) {
          setTimeout(() => { window.location.href = "/properties"; }, 1500);
        }
      } else {
        throw new Error("Invalid Property ID or unexpected response format.");
      }
    } catch (error: any) {
      toast({
        title: isDraft ? "Failed to Save Draft" : "Failed to Update Property",
        description: parseApiError(error, "Failed to update property."),
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) return <div>Loading...</div>;

  const activeErrors = form.formState.errors;
  const noErrors = {};

  return (
    <DashboardLayout>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-lg">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-foreground">Processing...</span>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <LoadingBar color="hsl(350, 74%, 45%)" progress={progress} onLoaderFinished={() => setProgress(0)} />

        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Edit Property</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the details below, then publish when you're ready.
              </p>
            </div>
            {property.propertyStatus === "DRAFT" && (
              <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase bg-secondary text-secondary-foreground border border-border">
                Draft
              </span>
            )}
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {STEP_LABELS.map((label, index) => (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium transition-colors ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className={`text-xs font-medium ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <Progress value={((currentStep + 1) / STEP_LABELS.length) * 100} className="h-1.5" />
          </div>

          <Card className="p-6 sm:p-8 shadow-sm border-border/80">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={currentStep !== 0 ? "hidden" : ""}>
                <PropertyInfo watch={watch} register={form.register} errors={currentStep === 0 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              <div className={currentStep !== 1 ? "hidden" : ""}>
                <DocumentsCertificates watch={watch} register={form.register} errors={currentStep === 1 ? activeErrors : noErrors} setValue={form.setValue} />
              </div>
              <div className={currentStep !== 2 ? "hidden" : ""}>
                <RentalAgreement watch={watch} register={form.register} errors={currentStep === 2 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              {currentStep === 3 && (
                <ManagementAgreement propertyId={property.id} property={property} />
              )}
              {currentStep === 4 && (
                <TenancyAgreement propertyId={property.id} property={property} />
              )}
              {currentStep === 5 && (
                <NotesStep propertyId={property.id} property={property} />
              )}

              {Object.keys(activeErrors).length > 0 && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Please fix the following errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {Object.entries(activeErrors).map(([key, error]: any) => (
                        <li key={key}>{key}: {error?.message || "This field is required"}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-6 mt-6 border-t border-border">
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                </div>
                {isLastStep ? (
                  <Button type="button" onClick={() => onSubmit(form.getValues(), false)} disabled={isSubmitting}>
                    {property.propertyStatus === "DRAFT" ? "Update & Publish" : "Update Property"} <Check className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
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

export default EditProperty;
