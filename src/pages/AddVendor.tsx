import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";


import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import StandardInfo from './Vendor/StandardInfo';
import InternalInfo from './Vendor/InternalInfo';
import BankDetails from './Vendor/BankDetails';
import WebLogin from './Vendor/WebLogin';


import Attachments from './Vendor/Attachments';

import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { post } from "@/helper/api";


const formSchema = z.object({
  landlord: z.boolean(),
  vendor: z.boolean(),

  type: z.enum(['Individual', 'Company'], {
    errorMap: () => ({ message: ' Please select one of the following options: "Company, Individual".' }),
  }),
  title: z.enum(['mr', 'mrs', 'miss', 'ms', 'dr', 'prof'], {
    errorMap: () => ({ message: 'Please select one of the following options: "mr", "mrs", "miss", "ms", "dr", "prof".' }),
  }),
  firstName: z.string().nonempty('First Name is required'),
  lastName: z.string().nonempty('Last Name is required'),
  company: z.string().nullable().optional(),
  salutation: z.string().nullable().optional(),
  postCode: z.string().nonempty('Post Code is required'),
  addressLine1: z.string().nonempty('Address Line is required'),
  addressLine2: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phoneHome: z.string().nullable().optional(),
  phoneWork: z.string().nullable().optional(),
  negotiator: z.string().nullable().optional(),

  phoneMobile: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  pager: z.string().nullable().optional(),
  birthplace: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  acceptLHA: z.string().nullable().optional(),

  dnrvfn: z.boolean().optional(),
  label: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  source: z.string().nullable().optional(),

  ldhor: z.boolean().optional(),
  salesFee: z.string().nullable().optional(),
  managementFee: z.string().nullable().optional(),
  findersFee: z.string().nullable().optional(),
  salesFeeA: z.string().nullable().optional(),
  managementFeeA: z.string().nullable().optional(),
  findersFeeA: z.string().nullable().optional(),
  nrlTax: z.string().nullable().optional(),

  nrlRef: z.string().nullable().optional(),
  nrlRate: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  landlordFullName: z.string().nullable().optional(),
  landlordContact: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  otherInfo: z.string().nullable().optional(),




  bankBody: z.string().nullable().optional(),

  bankAddressLine1: z.string().nullable().optional(),
  bankAddressLine2: z.string().nullable().optional(),
  bankTown: z.string().nullable().optional(),
  bankPostCode: z.string().nullable().optional(),
  bankCountry: z.string().nullable().optional(),
  bankIban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),

  nib: z.string().nullable().optional(),

  accountOption: z.enum(['noAccount', 'createAccount', 'existingAccount']),
  username: z.string().min(1, 'Username is required').nullable().optional(),
  password: z.string().min(1, 'Password is required').nullable().optional(),
  existingUsername: z.string().min(1, 'Existing Username is required').nullable().optional(),



  attachments: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    })
  )


  // Common fields (if any)


}).refine(
  (data) => {
    if (data.accountOption === 'createAccount') {
      return data.username && data.password;
    }
    if (data.accountOption === 'existingAccount') {
      return data.existingUsername;
    }

    if (data.attachments !== undefined && !Array.isArray(data.attachments)) {
      throw new Error('Attachments must be an array.');

    }
    return true;
  },
  {
    message: 'Please fill all the required fields.',
    path: ['accountOption'], // This attaches the error to the accountOption field
  }
);

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


            const { data: apiData, error } = await post("vendors/create", formData, headers);
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
  console.log(form.formState.errors)


  const steps = [
    { label: "Standard Info", component: <StandardInfo watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
    { label: "Internal Info", component: <InternalInfo watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
    { label: "Bank Details", component: <BankDetails watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
    { label: "Web Login", component: <WebLogin unregister={form.unregister} watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
    { label: "Attachments", component: <Attachments watch={watch} register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
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