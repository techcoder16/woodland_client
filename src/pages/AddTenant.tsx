import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import postApi from "@/helper/postApi";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import BasicInfo from "./Tenant/BasicInfo";
import { post } from "@/helper/api";

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

type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
};

export function AddTenant({ isOpen, onClose, propertyId }: AddTenantModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
  });
  const { toast } = useToast();
  const { watch } = form;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedData, setSavedData] = useState<Record<number, any>>({});

  const steps = [
    {
      label: "Basic Info",
      component: (
        <BasicInfo
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

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setSavedData((prev) => ({ ...prev, [currentStep]: form.getValues() }));
      if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setSavedData((prev) => ({ ...prev, [currentStep]: form.getValues() }));
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
        "Content-Type": "application/json",
      };
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) formData.append(key, String(value));
      });
console.log(formData)
      const { data: apiData, error } = await post("tenants", formData, headers);
      console.log(data);
      setProgress(60);
      if (error && error.message) throw new Error(error.message);
      setProgress(100);

      toast({ title: "Success", description: "Tenant created successfully!" });
      onClose();
      form.reset();
    } catch (error: any) {
      console.log(error)
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-red-600" /> Add New Tenant
          </DialogTitle>
        </DialogHeader>

        <LoadingBar color="rgb(95,126,220)" progress={progress} onLoaderFinished={() => setProgress(0)} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {steps[currentStep].component}

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            {isLastStep ? (
              <Button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
                Submit <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}