import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";


import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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


const formSchema = z.object({
  landlord: z.boolean().optional(),
  vendor: z.boolean().optional(),
  type: z.enum(['Individual', 'Company'], {
    errorMap: () => ({ message: 'Invalid Type value. Please select one of the following options: "Company, Individual".' }),
  }),
  title: z.enum(['mr', 'mrs', 'miss', 'ms', 'dr', 'prof'], {
    errorMap: () => ({ message: 'Invalid title value. Please select one of the following options: "mr", "mrs", "miss", "ms", "dr", "prof".' }),
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
  phoneMobile: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  webste: z.string().nullable().optional(),
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
  sales_fee: z.string().nullable().optional(),
  management_fee: z.string().nullable().optional(),
  finders_fee: z.string().nullable().optional(),
  sales_fee_a: z.string().nullable().optional(),
  management_fee_a: z.string().nullable().optional(),
  finders_fee_a: z.string().nullable().optional(),
  nrl_ref: z.string().nullable().optional(),
  nrl_rate: z.string().nullable().optional(),
  vat_number: z.string().nullable().optional(),
  landlord_full_name: z.string().nullable().optional(),
  landlord_contact: z.string().nullable().optional(),
  comments:z.string().nullable().optional(),
  other_info:z.string().nullable().optional(),

  bank_body: z.string().nullable().optional(),

  bank_address_line_1: z.string().nullable().optional(),
  bank_address_line_2: z.string().nullable().optional(),
  bank_town: z.string().nullable().optional(),
  bank_post_code: z.string().nullable().optional(),
  bank_country: z.string().nullable().optional(),
  bank_iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),

  nib: z.string().nullable().optional(),

  accountOption: z.enum(['noAccount', 'createAccount', 'existingAccount']),
  username: z.string().min(1, 'Username is required').nullable().optional(),
  password: z.string().min(1, 'Password is required').nullable().optional(),
  existingUsername: z.string().min(1, 'Existing Username is required').nullable().optional(),



  // Fields from Attachments component
  attachments: z
    .array(
      z.instanceof(File).refine((file) => file.type.startsWith("image/"), {
        message: "Only image files are allowed.",
      })
    ),
  // Common fields (if any)
  
}).refine(
  (data) => {
    if (data.accountOption === 'createAccount') {
      return data.username && data.password;
    }
    if (data.accountOption === 'existingAccount') {
      return data.existingUsername;
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


  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  
  const [progress, setProgress] = useState(0);
  const onSubmit = async (data: FormData) => {
    setProgress(30);
    setIsSubmitting(true); // Prevent interactions during submission

    try {

      const accessToken = await DEFAULT_COOKIE_GETTER("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`, // Add token to Authorization header
        "Content-Type":`application/x-www-form-urlencoded`

      };
      data.email = "";  
      console.log(headers);
      console.log(data.attachments);
      console.log(typeof(data.vendor))

      const formData = new FormData();

// Dynamically append all fields from `data`
for (const [key, value] of Object.entries(data)) {
  if (key === "attachments" && Array.isArray(value)) {
    // Handle attachments array (assumes value contains File objects)
 
  } else if (typeof value === "boolean") {
    // Convert boolean to string
    formData.append(key, value.toString());
  } else if (value !== null && value !== undefined ) {
    // Append all other values as strings
    formData.append(key, String(value));

  }
}
data.attachments.forEach((file) => {
  formData.append("attachments", file); // Append each file individually
});

console.log(formData,"jgg")
// Debugging FormData content (optional)
for (let pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}



      
        const response = await postApi("vendor/create", formData,headers);
      setProgress(60);

      console.log(response)
    if (response.error && response.error.length> 0)
    { 
      console.log("furqanj")
    

      toast({
        title: "Error",
        description: response.error.message || "Failed to create vendor.",
        variant: "destructive",
      });

    }


      if (response?.data && response.data.length > 0) {
        console.log("furqan")
        toast({
          title: "Success",
          description: response.data.message,
        });
        setProgress(100);
      } else {


        throw new Error(response?.error?.message || "Unknown error occurred");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor.",
        variant: "destructive",
      });

      setProgress(100);
    }
    finally {
      setIsSubmitting(false); // Allow interactions after completion
    }

  };


const steps = [
  { label: "Standard Info", component: <StandardInfo register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Internal Info", component: <InternalInfo register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Bank Details", component: <BankDetails register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Web Login", component: <WebLogin register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
  { label: "Attachments", component: <Attachments register={form.register} errors={form.formState.errors} setValue={form.setValue} clearErrors={form.clearErrors} /> },
]; 


const isLastStep = currentStep === steps.length - 1;


const [savedData, setSavedData] = useState<Record<number, any>>({});
const handleNext = async () => {
  const currentStepFields = Object.keys(form.getValues()) as Array<keyof typeof form.getValues>;

  // Trigger validation only for current step fields
  const isValid = await form.trigger(currentStepFields);
  console.log(isValid)
  if (isValid) {
    setSavedData((prev) => ({
      ...prev,
      [currentStep]: form.getValues(),
    }));

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  } else {
    // If validation fails, log errors
    console.log(form.formState.errors);
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
      <h1 className="text-4xl font-bold mb-8">Add New Vendor</h1>

      {/* Progress Indicator */}
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

      {/* Form */}
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
  <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
  Submit <Check className="ml-2 h-4 w-4" />
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
  </>
  );
};

export default AddVendor;