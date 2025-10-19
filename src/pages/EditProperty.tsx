import React, { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import postApi from "@/helper/postApi";
import { useNavigate, useLocation } from "react-router-dom";
import Attachments from "./Property/Attachments";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import PropertyInfo from "./Property/PropertyInfo";
import Description from "./Property/Descriptions";
import MoreInfo from "./Property/MoreInfo";
import PhotosFloorFPCPlan from "./Property/PhotosFloorFPCPlanProps";
import Publish from "./Property/Publish";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { patch, post } from "@/helper/api";

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
propertyFeature: z.array(z.string()).min(1, "At least one property feature is required.").refine(
  (features) => features && features.length > 0 && features.some(feature => feature && feature.trim() !== ''),
  "At least one property feature must be selected."
),
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

  // Get the property to edit from location state and memoize it based on ID
  const property = useMemo(() => {
    console.log("🏠 Property memoization recalculating - ID:", location.state?.property?.id);
    return location.state?.property;
  }, [location.state?.property?.id]); // Only recreate when property ID changes
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
    console.log("🔄 transformedVendorData useMemo recalculating...");

    if(property)
    {
      console.log("📦 Property data:", {
        id: property.id,
        currentEERating: property.currentEERating,
        potentialEERating: property.potentialEERating,
      });

      
 
  
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
      

    // Parse rooms if it's a string from the backend
    let parsedRooms = property?.rooms || [];
    if (typeof property?.rooms === "string") {
      try {
        parsedRooms = JSON.parse(property.rooms);
      } catch (e) {
        console.error("Error parsing rooms from backend:", e);
        parsedRooms = [];
      }
    }
    
    // Parse propertyFeature if it's a string
    let parsedPropertyFeature = property?.propertyFeature || [];
    if (typeof property?.propertyFeature === "string") {
      parsedPropertyFeature = property.propertyFeature === "" ? [] : [property.propertyFeature];
    }
    
    // Parse selectPortals if it's a string
    let parsedSelectPortals = property?.selectPortals || [];
    if (typeof property?.selectPortals === "string") {
      parsedSelectPortals = property.selectPortals === "" ? [] : [property.selectPortals];
    }
    
    // Ensure EPC ratings are strings (they might come as numbers from backend)
    const currentEERating = property?.currentEERating 
      ? String(property.currentEERating) 
      : "";
    const potentialEERating = property?.potentialEERating 
      ? String(property.potentialEERating) 
      : "";
    
    // Parse photographs array (might be JSON string or already an array from backend)
    let parsedPhotographs = [];
    if (Array.isArray(property?.photographs)) {
      // Already an array, use it directly
      parsedPhotographs = property.photographs;
    } else if (typeof property?.photographs === "string") {
      // It's a string, try to parse it
      try {
        parsedPhotographs = JSON.parse(property.photographs);
      } catch (e) {
        // If parsing fails, it might be a single base64 string, wrap it in array
        if (property.photographs.startsWith('data:image')) {
          parsedPhotographs = [property.photographs];
        } else {
          parsedPhotographs = [];
        }
      }
    }
    
    // Parse floorPlans array (might be JSON string or already an array from backend)
    let parsedFloorPlans = [];
    if (Array.isArray(property?.floorPlans)) {
      // Already an array, use it directly
      parsedFloorPlans = property.floorPlans;
    } else if (typeof property?.floorPlans === "string") {
      // It's a string, try to parse it
      try {
        parsedFloorPlans = JSON.parse(property.floorPlans);
      } catch (e) {
        // If parsing fails, it might be a single base64 string, wrap it in array
        if (property.floorPlans.startsWith('data:image')) {
          parsedFloorPlans = [property.floorPlans];
        } else {
          parsedFloorPlans = [];
        }
      }
    }
    
    // Ensure epcChartOption has a valid value
    const epcChartOption = property?.epcChartOption || "ratings";
    
    // Ensure epcReportOption has a valid value
    const epcReportOption = property?.epcReportOption || "uploadReport";
    
    // Ensure videoTourDescription is a string
    const videoTourDescription = property?.videoTourDescription || "";
    
    // Ensure epcReportURL is a string
    const epcReportURL = property?.epcReportURL || "";
    
    const transformedData = {
      ...property,
      vendor: property?.vendorId ? property.vendorId : "",
      rooms: parsedRooms, // Always an array, parsed if needed
      propertyFeature: parsedPropertyFeature, // Always an array
      selectPortals: parsedSelectPortals, // Always an array
      currentEERating: currentEERating, // Ensure it's a string
      potentialEERating: potentialEERating, // Ensure it's a string
      photographs: parsedPhotographs, // Ensure it's an array
      floorPlans: parsedFloorPlans, // Ensure it's an array
      epcChartOption: epcChartOption, // Ensure it has a valid default
      epcReportOption: epcReportOption, // Ensure it has a valid default
      videoTourDescription: videoTourDescription, // Ensure it's a string
      epcReportURL: epcReportURL, // Ensure it's a string
      // Add any additional transformations here.
    };
    
    console.log("✅ Transformed data ready:", {
      currentEERating: transformedData.currentEERating,
      potentialEERating: transformedData.potentialEERating,
      photographs: parsedPhotographs.length,
      floorPlans: parsedFloorPlans.length,
    });
    
    return transformedData;
  }
  console.log("⚠️ No property - returning empty FormData");
  return {} as FormData; // Return empty object if no property
  }, [property]); // Depend on memoized property object

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: transformedVendorData || ({} as FormData),
  });
  const { watch, reset } = form;

  // Track if we've loaded this property already to prevent resetting on every render
  const loadedPropertyId = useRef<string | null>(null);
  const hasInitialized = useRef<boolean>(false);

  // Reset form ONLY when a new property is loaded (property ID changes)
  useEffect(() => {
    console.log("🔄 Reset Effect Triggered:", {
      hasProperty: !!property?.id,
      hasTransformedData: !!transformedVendorData,
      loadedPropertyId: loadedPropertyId.current,
      currentPropertyId: property?.id,
      hasInitialized: hasInitialized.current,
    });
    
    // Only reset if:
    // 1. We have a property with an ID
    // 2. We have transformed data
    // 3. This is either the first load OR a different property
    if (property?.id && transformedVendorData) {
      const isDifferentProperty = loadedPropertyId.current !== property.id;
      const isFirstLoad = !hasInitialized.current;
      
      if (isDifferentProperty || isFirstLoad) {
        console.log("🔄 RESETTING FORM:", {
          propertyId: property.id,
          isFirstLoad,
          isDifferentProperty,
          currentEERating: transformedVendorData.currentEERating,
          potentialEERating: transformedVendorData.potentialEERating,
        });
        
        // Reset the form with all transformed values
        reset(transformedVendorData, {
          keepDefaultValues: false,
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false,
        });
        
        console.log("✅ Form reset completed");
        
        // Mark this property as loaded
        loadedPropertyId.current = property.id;
        hasInitialized.current = true;
      } else {
        console.log("⏭️ Skipping reset - same property already loaded");
      }
    }
  }, [property?.id]); // ONLY depend on property ID, not transformedVendorData
  
  // Debug: Watch EPC fields specifically
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === 'currentEERating' || name === 'potentialEERating') {
        console.log(`🎯 EditProperty Form - Field ${name} changed:`, value[name]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedData, setSavedData] = useState<Record<number, any>>({});
  const [submissionType, setSubmissionType] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  // Memoize steps to prevent unnecessary re-renders
  const steps = useMemo(() => [
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
  ], [watch, form.register, form.formState.errors, form.setValue, form.clearErrors, form.unregister]);

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
      // Clear previous validation errors
      form.clearErrors();
      
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
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields on this step before proceeding.",
        variant: "destructive",
      });
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

  
  const onSubmit = async (data: FormData, isDraft: boolean = false) => {
    // Only validate if publishing, skip validation for drafts
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
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        // DO NOT set Content-Type for FormData - let the browser set it automatically with the boundary
      };

      const formData = new FormData();
      
      // Set property status based on submission type
      const propertyStatus = isDraft ? "DRAFT" : "PUBLISHED";
      
      for (const [key, value] of Object.entries(data)) {
        // IMPORTANT: Skip propertyStatus in the loop - we'll add it separately at the end
        // This prevents it from being added as an array ["DRAFT", "DRAFT"]
        if (key === "propertyStatus") {
          continue;
        }
        
        if (key === "attachments" && Array.isArray(value)) {
          value.forEach((file: any, index) => {
            if (file) {
              formData.append(`attachments[${index}]`, file);
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
          formData.append(key, JSON.stringify(value));
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
            formData.append(key, String(value));
          }
        }
      }
      
      // Append propertyStatus after all other fields as a single string value
      formData.append("propertyStatus", propertyStatus);

      // Include the property ID for updating
      formData.append("id", property?.id || "");

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

      const { data: apiData, error }:any = await patch("properties/" + property?.id , formData, headers);
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
          description: isDraft 
            ? "Property saved as draft successfully!" 
            : apiData.message || "Property updated and published successfully!",
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
      let errorMessage = "Failed to update property.";
      
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
        title: isDraft ? "Failed to Save Draft" : "Failed to Update Property",
        description: errorMessage,
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveDraft = async () => {
    // Safety check: Only allow saving as draft if property is already a draft
    if (property?.propertyStatus !== "DRAFT") {
      toast({
        title: "Cannot Save as Draft",
        description: "Published properties cannot be saved as drafts. Use 'Update Property' instead.",
        variant: "destructive",
      });
      return;
    }
    
    const data = form.getValues();
    await onSubmit(data, true);
  };

  if (!property) {
    return <div>Loading...</div>;
  }

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
            {property?.propertyStatus === "DRAFT" && (
              <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                Draft Mode
              </span>
            )}
          </div>
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
                  
                  {/* Save as Draft button - ONLY show if property is currently a DRAFT */}
                  {property?.propertyStatus === "DRAFT" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting}
                      className="border-gray-400"
                    >
                      Save as Draft
                    </Button>
                  )}
                </div>

                {isLastStep ? (
                  <Button
                    key="update-publish"
                    type="button"
                    onClick={async () => {
                      const data = form.getValues();
                      await onSubmit(data, false);
                    }}
                    disabled={isSubmitting}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    {property?.propertyStatus === "DRAFT" ? "Update & Publish" : "Update Property"} <Check className="ml-2 h-4 w-4" />
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

export default EditProperty;
