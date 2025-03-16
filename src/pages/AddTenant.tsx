import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";


import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";

import WebLogin from './Vendor/WebLogin';
import postApi from "@/helper/postApi"; // Ensure you have this utility function
import { useNavigate } from "react-router-dom";

import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

import DashboardLayout from "@/components/layout/DashboardLayout";


const formSchema = z.object({
    id: z.string().optional(), // Auto-generated ObjectId
    title: z.string().nullable(),
    FirstName: z.string().nullable(),
    SureName: z.string().nullable(),
    MobileNo: z.string().nullable(),
    HomePhone: z.string().nullable(),
    WorkPhone: z.string().nullable(),
    Email: z.string().email().nullable(),
    EmployeeName: z.string().nullable(),
    BankAccountNo: z.string().nullable(),
    SortCode: z.string().nullable(),
    BankName: z.string().nullable(),
    IDCheck: z.string().nullable(),
    propertyPartyId: z.string().nullable(), // ObjectId reference
});


type FormData = z.infer<typeof formSchema>;

const AddVendor = () => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
    });
    const { toast } = useToast();

    const { watch } = form;




    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();



    const [progress, setProgress] = useState(0);
    const onSubmit = async (data: FormData) => {
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
                if (key === "attachments" && Array.isArray(value)) {
                    // Handle attachments array
                    value.forEach((file: any, index) => {
                        if (file) {
                            formData.append(`attachments[${index}]`, file); // Append each file individually
                        }
                    });
                } else if (typeof value === "boolean") {

                    formData.append(key, JSON.stringify(value)); // Send as string

                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value)); // Append all other values as strings
                }
            }


            // Call postApi with FormData and headers
            const { data: apiData, error } = await postApi("vendor/create", formData, headers);
            setProgress(60);

            if (error && error.message) {

                toast({
                    title: "Error",
                    description: error.message || "Failed to create vendor.",
                    variant: "destructive",
                });
                return; // Exit early on error
            }

            // Ensure `response.data.vendor` is parsed correctly
            const vendorId = apiData?.vendor?.id;

            if (vendorId && vendorId.length > 0) {

                toast({
                    title: "Success",
                    description: apiData.message || "Vendor created successfully!",
                });

                setProgress(100);
            } else {
                throw new Error("Invalid vendor ID or unexpected response format.");
            }
        } catch (error: any) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create vendor.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false); // Allow interactions after completion
        }
    };



    const steps = [
        { label: "Basic Info", component: <BasicInfo watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
    ];


    const isLastStep = currentStep === steps.length - 1;




    const [savedData, setSavedData] = useState<Record<number, any>>({});
    const handleNext = async () => {


        const currentStepFields = Object.keys(form.getValues()) as Array<keyof typeof form.getValues>;


        const isValid = await form.trigger(currentStepFields, { shouldFocus: true });

        if (isValid) {

            setSavedData((prev) => ({
                ...prev,
                [currentStep]: form.getValues(),
            }));

            if (currentStep < steps.length - 1) {

                setCurrentStep((prev) => prev + 1);
            }

            const nextStepData = savedData[currentStep + 1];

            if (nextStepData) {

                form.reset(nextStepData);
            }



        } else {
            // If validation fails, log errors
            console.log("Validation failed:", form.formState.errors);


        }
    };


    const handlePrevious = () => {
        // Save the current step's data
        setSavedData((prev) => ({
            ...prev,
            [currentStep]: form.getValues(),
        }));


        // Move to the previous step
        setCurrentStep((prev) => Math.max(prev - 1, 0));

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
                    <h1 className="text-4xl font-bold mb-8">Add New Vendor</h1>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            {steps.map((step, index) => (
                                <div key={index} className="flex-1 text-center">
                                    <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center 
                ${index <= currentStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                                        {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                                    </div>
                                    <p className={`text-sm ${index <= currentStep ? "text-red-600" : "text-gray-600"}`}>
                                        {step.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
                    </div>

                    <Card className="p-6">



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
                                    <Button key="submit" type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
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

export default AddVendor;