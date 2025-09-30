import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";

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
  const onSubmit = async (data: FormData) => {
    console.log("submit button");
    const isValid = await form.trigger(); // Validate all fields before final submission

    if (!isValid) return;

    setProgress(30);
    setIsSubmitting(true); // Prevent interactions during submission

    try {
      // Retrieve access token
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`, // Add token to Authorization header
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const formData = new FormData();

      // Dynamically append all fields from `data`

      for (const [key, value] of Object.entries(data)) {
        console.log(key, value);

        if (key === "attachments" && Array.isArray(value)) {
          // Handle attachments array
          value.forEach((file: any, index) => {
            if (file) {
              formData.append(`attachments[${index}]`, file); // Append each file individually
            }
          });
        } else if (key === "rooms") {
          formData.append("rooms", JSON.stringify(value));
        } else if (typeof value === "boolean") {
          formData.append(key, JSON.stringify(value)); // Send as string
        } else if (value !== null && value !== undefined) {
          if ((Array.isArray(value) && key == "selectPortals") || key == "propertyFeature") {
            // Handle arrays (not just attachments)
            value &&
              Array(value)?.forEach((item: any, index) => {
                if (item !== null && item !== undefined) {
                  formData.append(`${key}[${index}]`, item);
                }
              });
          } else {
            formData.append(key, String(value)); // Append all other values as strings
          }
        }
      }

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
          description: apiData.message || "",
        });

        setProgress(100);
      } else {
        throw new Error("Invalid Property ID or unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Property.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Allow interactions after completion
    }
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

  const handleNext = async () => {
    const currentStepFields = stepFields[currentStep]; // Validate only current step fields

    const isValid = await form.trigger(currentStepFields as any, { shouldFocus: true });

    if (isValid) {
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {steps[currentStep].component}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                {isLastStep ? (
                  <Button
                    key="submit"
                    type="submit"
                    onClick={() => {
                      console.log("asdkalsjds");
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Submit <Check className="ml-2 h-4 w-4" />
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
