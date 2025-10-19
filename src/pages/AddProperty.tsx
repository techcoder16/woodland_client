import React, { useEffect, useState } from "react";
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
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";
import Publish from "./Property/Publish";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { post } from "@/helper/api";
import { propertySchema } from "@/schema/property.schema";

type FormData = z.infer<typeof propertySchema>;

const AddProperty = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(propertySchema),
    mode: "onSubmit",
  });
  const { toast } = useToast();

  const { watch } = form;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Form Errors:", form.formState.errors);
  }, [form.formState.errors]);

  const [progress, setProgress] = useState(0);
  const [submissionType, setSubmissionType] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  
  const onSubmit = async (data: FormData, isDraft: boolean = false) => {
    console.log("submit button", isDraft ? "as draft" : "as published");
    
    // Only validate if publishing, skip validation for drafts
    if (!isDraft) {
      const isValid = await form.trigger(); // Validate all fields before final submission
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
    setIsSubmitting(true); // Prevent interactions during submission

    try {
      // Retrieve access token
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        // DO NOT set Content-Type for FormData - let the browser set it automatically with the boundary
      };

      const formData = new FormData();
      
      // Set property status based on submission type
      const propertyStatus = isDraft ? "DRAFT" : "PUBLISHED";

      // Dynamically append all fields from `data`

      for (const [key, value] of Object.entries(data)) {
        console.log(key, value);

        // Skip propertyStatus in the loop - we'll add it separately
        if (key === "propertyStatus") {
          continue;
        }

        if (key === "attachments" && Array.isArray(value)) {
          // Handle attachments array
          value.forEach((file: any, index) => {
            if (file) {
              formData.append(`attachments[${index}]`, file); // Append each file individually
            }
          });
        } else if (key === "rooms") {
          // Parse rooms if it's a string, then stringify it
          let roomsValue = value;
          if (typeof value === "string") {
            try {
              roomsValue = JSON.parse(value);
            } catch (e) {
              console.error("Error parsing rooms:", e);
              roomsValue = [];
            }
          }
          // Ensure it's an array before stringifying
          if (!Array.isArray(roomsValue)) {
            roomsValue = [];
          }
          formData.append("rooms", JSON.stringify(roomsValue));
        } else if (typeof value === "boolean") {
          formData.append(key, JSON.stringify(value)); // Send as string
        } else if (value !== null && value !== undefined) {
          if (key === "propertyFeature" || key === "selectPortals") {
            // Handle array fields - convert empty string to empty array for drafts
            let arrayValue = value;
            if (!Array.isArray(value)) {
              // If it's a string (empty or not), convert to array
              arrayValue = value === "" || !value ? [] : [value];
            }
            // Only append if there are items (skip empty arrays for drafts)
            if (arrayValue.length > 0) {
              arrayValue.forEach((item: any, index: number) => {
                if (item !== null && item !== undefined && item !== "") {
                  formData.append(`${key}[${index}]`, item);
                }
              });
            } else if (!isDraft) {
              // For publishing, we need to send empty array indication
              formData.append(`${key}[]`, "");
            }
          } else {
            formData.append(key, String(value)); // Append all other values as strings
          }
        }
      }
      
      // Append propertyStatus after all other fields as a single string value
      formData.append("propertyStatus", propertyStatus);

      // Debug: Log what's being sent
      console.log("=== FormData being sent ===");
      console.log("propertyStatus value:", propertyStatus);
      console.log("Checking for duplicate propertyStatus keys:");
      const allPropertyStatuses = formData.getAll("propertyStatus");
      console.log("formData.getAll('propertyStatus'):", allPropertyStatuses);
      console.log("Count:", allPropertyStatuses.length);
      
      // Log all entries
      console.log("\nAll FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      console.log("=========================");

      // Call postApi with FormData and headers
      const { data: apiData, error }: any = await post("properties", formData, headers);
      setProgress(60);

      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to create property.",
          variant: "destructive",
        });
        return; // Exit early on error
      }

      // Ensure `response.data.property` is parsed correctly
      const propertyId = apiData?.property?.id;

      if (propertyId && propertyId.length > 0) {
        toast({
          title: "Success",
          description: isDraft 
            ? "Property saved as draft successfully!" 
            : apiData.message || "Property published successfully!",
        });

        setProgress(100);
        
        // Navigate back to property list after a short delay
        setTimeout(() => {
          window.location.href = "/properties";
        }, 1500);
      } else {
        throw new Error("Invalid Property ID or unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      
      // Parse and display backend validation errors
      let errorMessage = "Failed to create Property.";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if it's a validation error with message array
        if (errorData.message && Array.isArray(errorData.message)) {
          const validationErrors = errorData.message.map((err: any) => {
            if (err.property && err.constraints) {
              const constraintMessages = Object.values(err.constraints).join(", ");
              return `${err.property}: ${constraintMessages}`;
            }
            return JSON.stringify(err);
          });
          errorMessage = validationErrors.join("\n");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: isDraft ? "Failed to Save Draft" : "Failed to Create Property",
        description: errorMessage,
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsSubmitting(false); // Allow interactions after completion
    }
  };
  
  const handleSaveDraft = async () => {
    const data = form.getValues();
    await onSubmit(data, true);
  };

  const steps = [
    {
      label: "Standard Info",
      component: (
        <PropertyInfo
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
    {
      label: "Description",
      component: (
        <Description
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
    {
      label: "More Info",
      component: (
        <MoreInfo
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
    {
      label: "Photos/Floor/FPC Plan",
      component: (
        <PhotosFloorFPCPlan
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
          unregister={form.unregister}
        />
      ),
    },

    {
      label: "Attachments",
      component: (
        <Attachments
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
    {
      label: "Publish",
      component: (
        <Publish
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
  ];

  const isLastStep = currentStep === steps.length - 1;

  const [savedData, setSavedData] = useState<Record<number, any>>({});
  
  // Define step validation fields
  const stepFields = [
    // Standard Info (Step 0)
    ['for','category','propertyType','internalReference','price','priceQualifier','tenure','contractType','salesFee','postCode','propertyNo','propertyName','addressLine1','addressLine2','town','county','country','latitude','longitude','development','yearOfBuild','parking','garden','livingFloorSpace','meetingRooms','workStation','landSize','outBuildings','propertyFeature','Tags'],
    // Description (Step 1)
    ['shortSummary','fullDescription','rooms'],
    // More Info (Step 2)
    ['Solicitor', 'GuaranteedRentLandlord', 'Branch', 'Negotiator', 'whodoesviewings', 'comments', 'sva', 'tenureA', 'customGarden', 'customParking', 'pets', 'train', 'occupant', 'occupantEmail', 'occupantMobile', 'council', 'councilBrand', 'freeholder', 'freeholderContract', 'freeholderAddress', 'nonGasProperty', 'Insurer'],
    // Photos/Floor/FPC Plan (Step 3)
    ['photographs','floorPlans','epcChartOption','currentEERating','potentialEERating','epcChartFile','epcReportOption','epcReportFile','epcReportURL','videoTourDescription','showOnWebsite'],
    // Attachments (Step 4)
    ['attachments'],
    // Publish (Step 5)
    ['publishOnWeb', 'status', 'detailPageUrl', 'publishOnPortals', 'portalStatus', 'forA', 'propertyTypeA', 'newHome', 'offPlan', 'virtualTour', 'enterUrl', 'virtualTour2', 'propertyBrochureUrl', 'AdminFee', 'ServiceCharges', 'minimumTermForLet', 'annualGroundRent', 'lengthOfLease', 'shortSummaryForPortals', 'fullDescriptionforPortals', 'sendToBoomin', 'sendToRightmoveNow', 'CustomDisplayAddress', 'transactionType', 'sendToOnTheMarket', 'newsAndExclusive', 'selectPortals']
  ];

  const handleNext = async () => {
    const currentStepFields = stepFields[currentStep]; // Validate only current step fields

    const isValid = await form.trigger(currentStepFields as any, { shouldFocus: true });

    if (isValid) {
      // Clear previous validation errors
      form.clearErrors();
      
      setSavedData(prev => ({
        ...prev,
        [currentStep]: form.getValues(),
      }));

      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }

      const nextStepData = savedData[currentStep + 1];

      if (nextStepData) {
        form.reset(nextStepData);
      }
    } else {
      console.log("Validation failed:", form.formState.errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields on this step before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    // Save the current step's data
    setSavedData(prev => ({
      ...prev,
      [currentStep]: form.getValues(),
    }));

    // Move to the previous step
    setCurrentStep(prev => Math.max(prev - 1, 0));

    // Restore the saved data for the previous step
    const previousStepData = savedData[currentStep - 1];
    if (previousStepData) {
      form.reset(previousStepData);
    }
  };

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
          <h1 className="text-4xl font-bold mb-8">Add New Property</h1>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center 
                ${index <= currentStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <p
                    className={`text-sm ${index <= currentStep ? "text-red-600" : "text-gray-600"}`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          </div>

          <Card className="p-6 shadow-md">
            <form onSubmit={(e) => e.preventDefault()}>
              {steps[currentStep].component}

              {/* Error Display at Bottom */}
              {Object.keys(form.formState.errors).length > 0 && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Please fix the following errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {Object.entries(form.formState.errors).slice(0, 5).map(([key, error]: any) => (
                        <li key={key}>
                          {key}: {error?.message || "This field is required"}
                        </li>
                      ))}
                      {Object.keys(form.formState.errors).length > 5 && (
                        <li className="text-xs italic">
                          ... and {Object.keys(form.formState.errors).length - 5} more error(s)
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  
                  {/* Save as Draft button - available on all steps */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="border-gray-400"
                  >
                    Save as Draft
                  </Button>
                </div>

                {isLastStep ? (
                  <Button
                    key="publish"
                    type="button"
                    onClick={async () => {
                      const data = form.getValues();
                      await onSubmit(data, false);
                    }}
                    disabled={isSubmitting}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Publish <Check className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button key="next" type="button" onClick={handleNext}>
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
