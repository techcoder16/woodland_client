import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import postApi from "@/helper/postApi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import BasicInfo from "./Tenant/BasicInfo";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { patch } from "@/helper/api";

const formSchema = z.object({
  id: z.string().optional(),
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


});

type FormData = z.infer<typeof formSchema>;

type EditTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  tenant:any;
};

const EditTenant = ({ isOpen, onClose, propertyId ,tenant}: EditTenantModalProps) => {
 
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
  });
  const { register, watch, formState, handleSubmit, reset, setValue, clearErrors, getValues } = form;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (tenant) {
      const normalizedTenant = Object.keys(formSchema.shape).reduce((acc, key) => {
        acc[key] = tenant[key] ?? null; // Ensure undefined values become null
        return acc;
      }, {} as FormData);
      
      reset(normalizedTenant);
    }
  }, [tenant, reset]);


  console.log(form.formState.errors)

  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setProgress(30);
    setIsSubmitting(true);

    try {
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, String(value));
      });

      const { data: apiData, error } = await patch(
        `tenants/`+Object.fromEntries(formData.entries()).id ,
        formData,
        headers
      );
      setProgress(60);

      if (error && error.message) {
        toast({ title: "Error", description: error.message || "Failed to update tenant.", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Tenant updated successfully!" });
      setProgress(100);
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: error.message || "Failed to update tenant.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [{ label: "Basic Info", component: <BasicInfo watch={watch} register={register} errors={formState.errors} setValue={setValue} clearErrors={clearErrors} /> }];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-red-600" /> Edit Tenant
        </DialogTitle>
      </DialogHeader>

      <LoadingBar color="rgb(95,126,220)" progress={progress} onLoaderFinished={() => setProgress(0)} />

            <form onSubmit={handleSubmit(onSubmit)}>{steps[currentStep].component}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))} disabled={currentStep === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                {isLastStep ? <Button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">Submit <Check className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}
              </div>
            </form>
         
            </DialogContent>
            </Dialog>
  );
};

export default React.memo(EditTenant);
