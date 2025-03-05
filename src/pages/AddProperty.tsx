import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";


import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import StandardInfo from './Vendor/StandardInfo';
import InternalInfo from './Vendor/InternalInfo';
import BankDetails from './Vendor/BankDetails';
import WebLogin from './Vendor/WebLogin';
import  postApi  from "@/helper/postApi"; // Ensure you have this utility function
import { useNavigate } from "react-router-dom";

import Attachments from './Vendor/Attachments';
import { MainNav } from "@/components/MainNav";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import postApiImage from "@/helper/postApiImage";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";

const roomSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  dimensions: z.string().nullable(),
});

  
  const formSchema = z.object({
    id: z.string(),
    for: z.string().nullable(),
    category: z.string().nullable(),
    propertyType: z.string().nullable(),
    internalReference: z.string().nullable(),
    price: z.string().nullable(),
    priceQualifier: z.string().nullable(),
    tenure: z.string().nullable(),
    contractType: z.string().nullable(),
    salesFee: z.string().nullable(),
    postCode: z.string(),
    propertyNo: z.string().nullable(),
    propertyName: z.string().nullable(),
    addressLine1: z.string().nullable(),
    addressLine2: z.string().nullable(),
    town: z.string().nullable(),
    county: z.string().nullable(),
    country: z.string(),
    latitude: z.string().nullable(),
    longitude: z.string().nullable(),
    development: z.string().nullable(),
    yearOfBuild: z.string().nullable(),
    parking: z.string().nullable(),
    garden: z.string().nullable(),
    livingFloorSpace: z.string().nullable(),
    meetingRooms: z.string().nullable(),
    workStation: z.string().nullable(),
    landSize: z.string().nullable(),
    outBuildings: z.string().nullable(),
    propertyFeature: z.array(z.string()),
    Tags: z.string().nullable(),
    shortSummary: z.string().nullable(),
    fullDescription: z.string().nullable(),
    GuaranteedRentLandlord: z.string().nullable(),
    Branch: z.string().nullable(),
    Negotiator: z.string().nullable(),
    whodoesviewings: z.string().nullable(),
    comments: z.string().nullable(),
    sva: z.string().nullable(),
    tenureA: z.string().nullable(),
    customGarden: z.string().nullable(),
    customParking: z.string().nullable(),
    pets: z.string().nullable(),
    train: z.string().nullable(),
    occupant: z.string().nullable(),
    occupantEmail: z.string().nullable(),
    occupatMobile: z.string().nullable(),
    
    council: z.string().nullable(),
    councilBrand:z.string().nullable(),
    
    freeholder: z.string().nullable(),
    freeholderContract: z.string().nullable(),
    freeholderAddress: z.string().nullable(),
    nonGasProperty: z.boolean().nullable(),
   
    photographs: z.any().optional(), // use z.any() or a custom file validator if needed
   floorPlans: z.any().optional(),

  // EPC Chart Options
    epcChartOption: z.enum(["ratings", "upload"]),
    // If "ratings" is selected, these fields should be provided (you can add refinements later)
    currentEERating: z.string().optional(),
    potentialEERating: z.string().optional(),
    // If "upload" is selected, this field is used
    epcChartFile: z.any().optional(),

    // EPC/Home Report Options
    epcReportOption: z.enum(["uploadReport", "urlReport"]),
    epcReportFile: z.any().optional(),   // for PDF upload
    epcReportURL: z.string().url().optional(),

    // Video Tour Section
    videoTourDescription: z.string().optional(),

    // Show on Website (checkbox) – a simple boolean field
    showOnWebsite: z.boolean(),


    attachements: z.array(z.string()),
    publishOnWeb: z.string().nullable(),
    status: z.string().nullable(),
    detailPageUrl: z.string().nullable(),
    publishOnPortals: z.string().nullable(),
    portalStatus: z.string().nullable(),
    forA: z.string().nullable(),
    propertyTypeA: z.string().nullable(),
    newHome: z.boolean().nullable(),
    offPlan: z.boolean().nullable(),
    virtualTour: z.string().nullable(),
    enterUrl: z.string().nullable(),
    virtualTour2: z.string().nullable(),
    enterUrl2: z.string().nullable(),
    propertyBoucherUrl: z.string().nullable(),
    AdminFee: z.string().nullable(),
    ServiceCharges: z.string().nullable(),
    minimmumTermForLet: z.string().nullable(),
    annualGroundRent: z.string().nullable(),
    lengthOfLease: z.string().nullable(),
    shortSummaryForPortals: z.string().nullable(),
    fullDescriptionforPortals: z.string().nullable(),
    sendtoBoomin: z.boolean().nullable(),
    CustomDisplayAddress: z.string().nullable(),
    transactionType: z.string().nullable(),
    sendOntheMarket: z.boolean().nullable(),
    newsAndExclusive: z.string().nullable(),
    selectPortals: z.array(z.string()),
    vendor: z.string().nullable(),
    rooms: z.array(roomSchema), // Add rooms as an array of objects
 

  
  
});
type FormData = z.infer<typeof formSchema>;

const AddProperty = () => {
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
    console.log(isValid,"isValid");
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
          value.forEach((file:any,index) => {
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
  { label: "Standard Info", component: <PropertyInfo  watch={watch} register={form.register}  errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Description", component: <Description watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "More Info", component: <MoreInfo watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Photos/Floor/FPC Plan", component: <PhotosFloorFPCPlan watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
 
  { label: "Attachments", component: <Attachments watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
 
  
  // { label: "Bank Details", component: <BankDetails watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  // { label: "Web Login", component: <WebLogin unregister={form.unregister} watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  // { label: "Attachments", component: <Attachments watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },

]; 


const isLastStep = currentStep === steps.length - 1;




const [savedData, setSavedData] = useState<Record<number, any>>({});
const handleNext = async () => {
      

  const currentStepFields = Object.keys(form.getValues()) as Array<keyof typeof form.getValues>;
    console.log(currentStepFields);

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
    <>
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
      
    <MainNav />
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-4xl font-bold mb-8">Add New Property</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center 
                ${index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              <p className={`text-sm ${index <= currentStep ? "text-blue-600" : "text-gray-600"}`}>
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
<Button key="submit" type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
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
  </>
  );
};

export default AddProperty;