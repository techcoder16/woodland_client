import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import postApi from "@/helper/postApi";
import { useNavigate, useLocation } from "react-router-dom";
import Attachments from "./Property/Attachments";
import { MainNav } from "@/components/MainNav";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";
import Publish from "./Property/Publish";

// Room schema
const roomSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dimensions: z.string().nullable().optional(),
});

// Form schema (same as your AddProperty schema)
const formSchema = z.object({
  for: z.string().nullable().default(null).describe("For field is required."),
  category: z.string().nullable().default(null).describe("Category is required."),
  propertyType: z.string().nullable().default(null).describe("Property type is required."),
  internalReference: z.string().nullable().default(null).describe("Internal reference is required."),
  price: z.string().nullable().default(null).describe("Price is required."),
  priceQualifier: z.string().nullable().default(null).describe("Price qualifier is required."),
  tenure: z.string().nullable().default(null).describe("Tenure is required."),
  contractType: z.string().nullable().default(null).describe("Contract type is required."),
  salesFee: z.string().nullable().default(null).describe("Sales fee is required."),
  postCode: z.string().nullable().default(null).describe("Postcode is required."),

  propertyNo: z.string().nullable().default(null).describe("Property number is required."),
  propertyName: z.string().nullable().default(null).describe("Property name is required."),
  addressLine1: z.string().nullable().default(null).describe("Address Line 1 is required."),
  addressLine2: z.string().nullable().default(null).describe("Address Line 2 is required."),
  town: z.string().nullable().default(null).describe("Town is required."),
  county: z.string().nullable().default(null).describe("County is required."),
  country: z.string({ required_error: "Country is required." }),
  latitude: z.any().nullable().describe("Latitude is required."),
  longitude: z.any().nullable().describe("Longitude is required."),
  development: z.string().nullable().default(null).describe("Development field is required."),
  yearOfBuild: z.string().nullable().default(null).describe("Year of build is required."),
  parking: z.string().nullable().default(null).describe("Parking information is required."),
  garden: z.string().nullable().default(null).describe("Garden information is required."),
  livingFloorSpace: z.string().nullable().default(null).describe("Living floor space is required."),
  meetingRooms: z.string().nullable().default(null).describe("Meeting rooms information is required."),
  workStation: z.string().nullable().default(null).describe("Workstation information is required."),
  landSize: z.string().nullable().default(null).describe("Land size is required."),
  outBuildings: z.string().nullable().default(null).describe("Out buildings information is required."),
  propertyFeature: z.array(z.string(), { required_error: "Property features are required." }),
  Tags: z.string().nullable().default(null).describe("Tags field is required."),
  shortSummary: z.string().nullable().default(null).describe("Short summary is required."),
  fullDescription: z.string().nullable().default(null).describe("Full description is required."),
  GuaranteedRentLandlord: z.string().nullable().default(null).describe("Guaranteed rent for landlord is required."),
  Branch: z.string().nullable().default(null).describe("Branch is required."),
  Negotiator: z.string().nullable().default(null).describe("Negotiator is required."),
  whodoesviewings: z.string().nullable().default(null).describe("Viewings information is required."),
  comments: z.string().nullable().default(null).describe("Comments are required."),
  sva: z.string().nullable().default(null).describe("SVA is required."),
  tenureA: z.string().nullable().default(null).describe("TenureA is required."),
  customGarden: z.string().nullable().default(null).describe("Custom garden information is required."),
  customParking: z.string().nullable().default(null).describe("Custom parking information is required."),
  pets: z.string().nullable().default(null).describe("Pets information is required."),
  train: z.string().nullable().default(null).describe("Train station proximity is required."),
  occupant: z.string().nullable().default(null).describe("Occupant name is required."),
  occupantEmail: z.string().nullable().default(null).describe("Occupant email is required."),
  occupantMobile: z.string().nullable().default(null).describe("Occupant mobile is required."),

  council: z.string().nullable().default(null).describe("Council is required."),
  councilBrand: z.string().nullable().default(null).describe("Council brand is required."),
  freeholder: z.string().nullable().default(null).describe("Freeholder is required."),
  freeholderContract: z.string().nullable().default(null).describe("Freeholder contract is required."),
  freeholderAddress: z.string().nullable().default(null).describe("Freeholder address is required."),
  nonGasProperty: z.boolean().nullable().default(null).describe("Non-gas property field is required."),
  Insurer: z.string().nullable().default(null).describe("Insurer information is required."),

  photographs: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    }),
    { required_error: "At least one photograph is required." }
  ),
  floorPlans: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid floor plan images in Base64 format are allowed.",
    }),
    { required_error: "At least one floor plan is required." }
  ),

  epcChartOption: z.enum(["ratings", "upload"], {
    required_error: "EPC Chart Option is required.",
  }),
  currentEERating: z.string().optional(),
  potentialEERating: z.string().optional(),
  epcChartFile: z.any().optional(),

  epcReportOption: z.enum(["uploadReport", "urlReport"], {
    required_error: "EPC Report Option is required.",
  }),
  epcReportFile: z.any().optional(),
  epcReportURL: z.string().url().optional(),

  videoTourDescription: z.string().optional(),
  showOnWebsite: z.boolean({ required_error: "Show on website field is required." }),

  publishOnWeb: z.string().nullable().default(null).describe("Publish on web is required."),
  status: z.string().nullable().default(null).describe("Status is required."),
  detailPageUrl: z.string().nullable().default(null).describe("Detail page URL is required."),
  publishOnPortals: z.string().nullable().default(null).describe("Publish on portals field is required."),
  portalStatus: z.string().nullable().default(null).describe("Portal status is required."),
  forA: z.string().nullable().default(null).describe("ForA field is required."),
  propertyTypeA: z.string().nullable().default(null).describe("Property type A is required."),
  newHome: z.boolean().nullable().default(null).describe("New home field is required."),
  offPlan: z.boolean().nullable().default(null).describe("Off-plan field is required."),
  virtualTour: z.string().nullable().default(null).describe("Virtual tour is required."),
  enterUrl: z.string().nullable().default(null).describe("Enter URL for virtual tour is required."),
  virtualTour2: z.string().nullable().default(null).describe("Second virtual tour is required."),
  enterUrl2: z.string().nullable().default(null).describe("Enter URL for second virtual tour is required."),
  propertyBrochureUrl: z.string().nullable().default(null).describe("Property brochure URL is required."),
  AdminFee: z.string().nullable().default(null).describe("Admin fee is required."),
  ServiceCharges: z.string().nullable().default(null).describe("Service charges are required."),
  minimumTermForLet: z.string().nullable().default(null).describe("Minimum term for let is required."),
  annualGroundRent: z.string().nullable().default(null).describe("Annual ground rent is required."),
  lengthOfLease: z.string().nullable().default(null).describe("Length of lease is required."),
  shortSummaryForPortals: z.string().nullable().default(null).describe("Short summary for portals is required."),
  fullDescriptionforPortals: z.string().nullable().default(null).describe("Full description for portals is required."),
  sendToBoomin: z.boolean().nullable().default(false),
  sendToRightmoveNow: z.boolean().nullable().default(false),
  CustomDisplayAddress: z.string().nullable().default(null).describe("Custom display address is required."),
  transactionType: z.string().nullable().default(null).describe("Transaction type is required."),
  sendToOnTheMarket: z.boolean().nullable().default(false),
  newsAndExclusive: z.boolean().nullable().default(false),
  selectPortals: z.array(z.string(), { required_error: "At least one portal must be selected." }),
  vendor: z.string().nullable(),
  rooms: z.array(roomSchema).optional(),
  portalList: z.any(),
  Solicitor:z.string().nullable(),
  attachments: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

const EditProperty = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the property to edit from location state
  const property = location.state?.property;
  console.log(property);
     const splitFeeValue = (value: string) => {
        if (!value) return { amount: '', type: '' };
        const parts = value.split('-');
        return {
          amount: parts[0] || '',
          type: parts[1] || ''
        };
      };
  // Use useMemo to memoize the transformed data so it doesn't trigger re-renders on every render.
  const transformedVendorData = useMemo(() => {
    console.log(property,"furqan")
    if(property)
    {

      
 
  
      const salesFeeParts = splitFeeValue(property.salesFee);
      const priceParts = splitFeeValue(property.price);
     

        property.salesFee_input = salesFeeParts.amount;
        property.salesFee_select= salesFeeParts.type;

        property.price_input = priceParts.amount;
        property.price_select= priceParts.type;



        property.nonGasProperty = property.nonGasProperty  ?? false;
        property.showOnWebsite = property.showOnWebsite  ?? false;
        property.newHome  = property.newHome == "true" ? true   :  false;
        property.offPlan = property.offPlan == "true" ? true   :   false;
        property.sendToBoomin = property.sendToBoomin ??  false;
        property.sendToRightmoveNow  =  property.sendToRightmoveNow ??   false;
        property.sendToOnTheMarket =   property.sendToOnTheMarket ?? false;
        property.newsAndExclusive =   property.newsAndExclusive ?? false;

       console.log(property.newHome,property.offPlan )
      

    return {
      ...property,

      vendor: property?.vendorId ? property.vendorId : "",
      // Add any additional transformations here.
    };
  }
  return;
  }, [property]);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: transformedVendorData || ({} as FormData),
  });
  const { watch, reset } = form;

  useEffect(() => {
    if (property) {
      // Reset the form whenever the property changes
      reset(transformedVendorData);
    }
  }, [property, reset, transformedVendorData]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedData, setSavedData] = useState<Record<number, any>>({});

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

  const stepFields = [
    // Standard Info (Step 0)
   ['for','category','propertyType','internalReference','price','priceQualifier','tenure','contractType','salesFee','postCode','propertyNo','propertyName','addressLine1','addressLine2','town','county','country','latitude','longitude','development','yearOfBuild','parking','garden','livingFloorSpace','meetingRooms','workStation','landSize','outBuildings','propertyFeature','Tags']
  , ['shortSummary','fullDescription','rooms']
    // Internal Info (Step 1)
   , ['Solicitor', 'GuaranteedRentLandlord', 'Branch', 'Negotiator', 'whodoesviewings', 'comments', 'sva', 'tenureA', 'customGarden', 'customParking', 'pets', 'train', 'occupant', 'occupantEmail', 'occupantMobile', 'council', 'councilBrand', 'freeholder', 'freeholderContract', 'freeholderAddress', 'nonGasProperty', 'Insurer']
   ,

 ['photographs','floorPlans','epcChartOption','currentEERating','potentialEERating','epcChartFile','epcReportOption','epcReportFile','epcReportURL','videoTourDescription','showOnWebsite']
 ,
  

    ['attachments'],
    ['publishOnWeb', 'status', 'detailPageUrl', 'publishOnPortals', 'portalStatus', 'forA', 'propertyTypeA', 'newHome', 'offPlan', 'virtualTour', 'enterUrl', 'virtualTour2', 'propertyBrochureUrl', 'AdminFee', 'ServiceCharges', 'minimumTermForLet', 'annualGroundRent', 'lengthOfLease', 'shortSummaryForPortals', 'fullDescriptionforPortals', 'sendToBoomin', 'sendToRightmoveNow', 'CustomDisplayAddress', 'transactionType', 'sendToOnTheMarket', 'newsAndExclusive', 'selectPortals']

  ]; 

  
  useEffect(() => {
    console.log("Form Errors:", form.formState.errors);
  }, [form.formState.errors]);
  

  const handleNext = async () => {
    const currentStepFields = stepFields[currentStep]; // Validate only current step fields
  
    const isValid = await form.trigger(currentStepFields as any, { shouldFocus: true });
  
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

  
  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;
    setProgress(30);
    setIsSubmitting(true);
    try {
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (key === "attachments" && Array.isArray(value)) {
          value.forEach((file: any, index) => {
            if (file) {
              formData.append(`attachments[${index}]`, file);
            }
          });
        } else if (key === "rooms") {
          formData.append("rooms", JSON.stringify(value));
        } else if (typeof value === "boolean") {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          if (
            Array.isArray(value) &&
            (key === "selectPortals" || key === "propertyFeature")
          ) {
            value.forEach((item: any, index) => {
              if (item !== null && item !== undefined) {
                formData.append(`${key}[${index}]`, item);
              }
            });
          } else {
            formData.append(key, String(value));
          }
        }
      }

      // Include the property ID for updating
      formData.append("id", property?.id || "");

      const { data: apiData, error } = await postApi("property/update", formData, headers);
      setProgress(60);
      if (error && error.message) {
        toast({
          title: "Error",
          description: error.message || "Failed to update property.",
          variant: "destructive",
        });
        return;
      }
      const updatedPropertyId = apiData?.property?.id;
      if (updatedPropertyId && updatedPropertyId.length > 0) {
        toast({
          title: "Success",
          description: apiData.message || "Property updated successfully!",
        });
        setProgress(100);
        // Optionally navigate away or refresh data here.
      } else {
        throw new Error("Invalid Property ID or unexpected response format.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold">Processing...</div>
        </div>
      )}
      <div className="min-h-screen bg-background">
        <LoadingBar color="rgb(95,126,220)" progress={progress} onLoaderFinished={() => setProgress(0)} />
        <MainNav />
        <div className="container mx-auto max-w-3xl py-8">
          <h1 className="text-4xl font-bold mb-8">Edit Property</h1>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      index <= currentStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
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
          <Card className="p-6 shadow-md">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {steps[currentStep].component}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
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
    </>
  );
};

export default EditProperty;
