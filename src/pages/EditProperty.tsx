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
import Attachments from "./Property/Attachments";
import LoadingBar from "react-top-loading-bar";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";
import Publish from "./Property/Publish";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch } from "@/helper/api";
import { propertySchema } from "@/schema/property.schema";
import { buildPropertyFormData } from "@/helper/buildPropertyFormData";
import { parseApiError } from "@/helper/parseApiError";
import { STEP_LABELS, STEP_FIELDS } from "@/constants/propertySteps";

type FormData = z.infer<typeof propertySchema>;

// Module-level helpers — no re-creation on each render

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

  // Stable reference — only recomputes when the property ID actually changes
  const property = useMemo(
    () => location.state?.property,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.state?.property?.id]
  );

  // Transform raw backend data into form-compatible values without mutating the source
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

  // Reset form only when a different property is loaded
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
    // Intentionally omitting transformedVendorData and reset — only re-run when the property ID changes
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
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields on this step before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSaveDraft = () => onSubmit(form.getValues(), true);

  const onSubmit = async (data: FormData, isDraft: boolean = false) => {
    if (!isDraft) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before publishing.",
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
        setTimeout(() => { window.location.href = "/properties"; }, 1500);
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

  // Only pass errors to the visible step — prevents all 6 components re-rendering on every validation change
  const activeErrors = form.formState.errors;
  const noErrors = {};

  return (
    <DashboardLayout>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold">Processing...</div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <LoadingBar color="rgb(95,126,220)" progress={progress} onLoaderFinished={() => setProgress(0)} />

        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Edit Property</h1>
            {property.propertyStatus === "DRAFT" && (
              <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                Draft Mode
              </span>
            )}
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {STEP_LABELS.map((label, index) => (
                <div key={index} className="flex-1 text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${index <= currentStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <p className={`text-sm ${index <= currentStep ? "text-red-600" : "text-gray-600"}`}>{label}</p>
                </div>
              ))}
            </div>
            <Progress value={((currentStep + 1) / STEP_LABELS.length) * 100} className="h-2" />
          </div>

          <Card className="p-6 shadow-md">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={currentStep !== 0 ? "hidden" : ""}>
                <PropertyInfo watch={watch} register={form.register} errors={currentStep === 0 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              <div className={currentStep !== 1 ? "hidden" : ""}>
                <Description watch={watch} register={form.register} errors={currentStep === 1 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              <div className={currentStep !== 2 ? "hidden" : ""}>
                <MoreInfo watch={watch} register={form.register} errors={currentStep === 2 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              <div className={currentStep !== 3 ? "hidden" : ""}>
                <PhotosFloorFPCPlan watch={watch} register={form.register} errors={currentStep === 3 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} unregister={form.unregister} />
              </div>
              <div className={currentStep !== 4 ? "hidden" : ""}>
                <Attachments watch={watch} register={form.register} errors={currentStep === 4 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>
              <div className={currentStep !== 5 ? "hidden" : ""}>
                <Publish watch={watch} register={form.register} errors={currentStep === 5 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} />
              </div>

              {Object.keys(activeErrors).length > 0 && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Please fix the following errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {Object.entries(activeErrors).slice(0, 5).map(([key, error]: any) => (
                        <li key={key}>{key}: {error?.message || "This field is required"}</li>
                      ))}
                      {Object.keys(activeErrors).length > 5 && (
                        <li className="text-xs italic">... and {Object.keys(activeErrors).length - 5} more error(s)</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-6">
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting} className="border-gray-400">
                    Save as Draft
                  </Button>
                </div>
                {isLastStep ? (
                  <Button type="button" onClick={() => onSubmit(form.getValues(), false)} disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
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
