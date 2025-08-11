import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import LoadingBar from "react-top-loading-bar";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";

import { post } from "@/helper/api";
import TransactionInfo from "./Transaction/TransactionInfo";

const formSchema = z.object({

    propertyId: z.string().min(1, "Property ID is required"),

  // Example Select field for Branch
  Branch: z.string().min(1, "Branch is required"), // or make it optional if needed

  // From Tenant Section
  fromTenantDate: z.string().optional(), // date as ISO string
  fromTenantMode: z.string().optional(),
  fromTenantOtherDebit: z.coerce.number().optional(),
  fromTenantBenefit1: z.string().optional(),
  fromTenantBenefit2: z.string().optional(),
  fromTenantRentReceived: z.coerce.number().optional(),
  fromTenantDescription: z.string().optional(),
  fromTenantReceivedBy: z.string().optional(),
  fromTenantPrivateNote: z.string().optional(),

    toLandlordDate: z.string().optional(),
  toLandlordRentReceived: z.coerce.number().optional(),
  toLandlordLeaseManagementFees: z.coerce.number().optional(),
  toLandlordLeaseBuildingExpenditure: z.coerce.number().optional(),
  toLandlordNetReceived: z.coerce.number().optional(),
  toLandlordLessVAT: z.coerce.number().optional(),
  toLandlordNetPaid: z.coerce.number().optional(),
  toLandlordChequeNo: z.string().optional(),
  toLandlordDefaultExpenditure: z.string().optional(),
  toLandlordExpenditureDescription: z.string().optional(),
  toLandlordFundBy: z.string().optional(),

  // Landlord Section (outside summary)
  landlordNetRentReceived: z.coerce.number().optional(),
  landlordNetDeductions: z.coerce.number().optional(),
  landlordNetToBePaid: z.coerce.number().optional(),
  landlordNetPaid: z.coerce.number().optional(),
  landlordNetDebit: z.coerce.number().optional(),

});

type FormData = z.infer<typeof formSchema>;

type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
};

export function AddTransaction({ isOpen, onClose, propertyId }: AddTenantModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
  });
  const { toast } = useToast();
  const { watch } = form;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      label: "Transaction Info",
      component: (
        <TransactionInfo
          watch={watch}
          register={form.register}
          errors={form.formState.errors}
          setValue={form.setValue}
          clearErrors={form.clearErrors}
        />
      ),
    },
  ];



  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setProgress(30);

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
      const { data: apiData, error } = await post("transactions/create", formData, headers);
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
            {/* <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button> */}

              <Button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
                Submit <Check className="ml-2 h-4 w-4" />
              </Button>
            
            
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}