import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import Attachments from "./Property/Attachments";
import LoadingBar from "react-top-loading-bar";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";
import Publish from "./Property/Publish";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { post } from "@/helper/api";
import { propertySchema } from "@/schema/property.schema";
import { buildPropertyFormData } from "@/helper/buildPropertyFormData";
import { parseApiError } from "@/helper/parseApiError";
import { STEP_LABELS, STEP_FIELDS } from "@/constants/propertySteps";

type FormData = z.infer<typeof propertySchema>;

const AddProperty = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(propertySchema),
    mode: "onSubmit",
    defaultValues: {
      country: "",
      epcChartOption: "ratings",
      epcReportOption: "uploadReport",
      showOnWebsite: false,
      photographs: [],
      floorPlans: [],
      attachments: [],
      propertyFeature: [],
      selectPortals: [],
      rooms: [],
    },
  });
  const { toast } = useToast();
  const { watch } = form;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLastStep = currentStep === STEP_LABELS.length - 1;

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
      const { data: apiData, error }: any = await post("properties", formData);
      setProgress(60);

      if (error?.message) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      const propertyId = apiData?.property?.id;
      if (propertyId?.length > 0) {
        toast({
          title: "Success",
          description: isDraft ? "Property saved as draft successfully!" : apiData.message || "Property published successfully!",
        });
        setProgress(100);
        setTimeout(() => { window.location.href = "/properties"; }, 1500);
      } else {
        throw new Error("Invalid Property ID or unexpected response format.");
      }
    } catch (error: any) {
      toast({
        title: isDraft ? "Failed to Save Draft" : "Failed to Create Property",
        description: parseApiError(error, "Failed to create property."),
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => onSubmit(form.getValues(), true);

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
          <h1 className="text-4xl font-bold mb-8">Add New Property</h1>

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
                <PhotosFloorFPCPlan control={form.control} watch={watch} register={form.register} errors={currentStep === 3 ? activeErrors : noErrors} setValue={form.setValue} clearErrors={form.clearErrors} unregister={form.unregister} />
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
                    Publish <Check className="ml-2 h-4 w-4" />
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

export default AddProperty;
