import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowLeft, ArrowRight, UserPlus, Save, FileText } from "lucide-react";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { useAppDispatch } from "@/redux/reduxHooks";
import { createDraftTransaction, upsertTransaction } from "@/redux/dataStore/transactionSlice";

import { post } from "@/helper/api";
import TransactionInfo from "./Transaction/TransactionInfo";
import { error } from "console";

const formSchema = z.object({
  // Branch field
  Branch: z.string().optional(),
 
  // Example Select field for Branch
  // From Tenant Section
  fromTenantDate: z.string().optional(), // date as ISO string
  fromTenantMode: z.string().optional(),
  
  fromTenantOtherDebit: z.coerce.number().optional(),
  fromTenantHBenefit1: z.coerce.number().optional(),
  fromTenantHBenefit2: z.coerce.number().optional(),
  fromTenantRentReceived: z.coerce.number().optional(),
  fromTenantDescription: z.string().optional(),
  fromTenantReceivedBy: z.string().optional(),
  fromTenantPrivateNote: z.string().optional(),
  toLandLordMode :z.string().optional(),
  toLandlordDate: z.string().optional(),
  toLandlordRentReceived: z.coerce.number().optional(),
  toLandlordLessManagementFees: z.coerce.number().optional(),
  toLandlordManagementFeeMode: z.string().optional(),
  toLandlordManagementFeePercent: z.coerce.number().optional(),
  toLandlordLessBuildingExpenditure: z.coerce.number().optional(),
  toLandlordLessBuildingExpenditureActual : z.coerce.number().optional(),
  toLandlordLessBuildingExpenditureDifference: z.coerce.number().optional(),
  jobTypeIds: z.array(z.string()).optional(),


  toLandlordNetReceived: z.coerce.number().optional(),
  toLandlordLessVAT: z.coerce.number().optional(),
  toLandlordNetPaid: z.coerce.number().optional(),
  toLandlordChequeNo: z.string().optional(),
  toLandlordDefaultExpenditure: z.string().optional(),
  toLandlordExpenditureDescription: z.string().optional(),
  toLandlordPaidBy: z.string().optional(),


});

type FormData = z.infer<typeof formSchema>;

type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  /** Pre-fill values — e.g. from a dashboard "rent due" click-through. */
  defaultValues?: Partial<FormData>;
};

export function AddTransaction({ isOpen, onClose, propertyId, defaultValues }: AddTenantModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues,
  });
  const { toast } = useToast();
  const { watch, reset } = form;
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDraftMode, setIsDraftMode] = useState(false);

  useEffect(() => {
    if (isOpen && defaultValues) reset(defaultValues);
  }, [isOpen, defaultValues, reset]);

useEffect(()=>{
  console.log(form.formState.errors)
})
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
          propertyId={propertyId}
        />
      ),
    },
  ];



  const onSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setProgress(30);

    try {
      const transactionData = { 
        ...data, 
        propertyId,
        Branch: data.Branch || '', // Provide default for required field
        landlordPaidBy: data.toLandlordPaidBy || '' // Map to required field
      };
      
      if (isDraftMode) {
        // Create as draft
        await dispatch(createDraftTransaction(transactionData)).unwrap();
        toast({ title: "Success", description: "Transaction saved as draft!" });
      } else {
        // Create as active transaction
        await dispatch(upsertTransaction(transactionData)).unwrap();
        toast({ title: "Success", description: "Transaction created successfully!" });
      }
      
      setProgress(100);
      onClose();
      form.reset();
      setIsDraftMode(false);

    } catch (error: any) {
      console.log(error)
      toast({ title: "Error", description: error.message || "Failed to save transaction", variant: "destructive" });
    } finally {
      setProgress(0);
    }
  };

  const handleSaveAsDraft = async () => {
    const data = form.getValues();
    const transactionData = { 
      ...data, 
      propertyId,
      Branch: data.Branch || '', // Provide default for required field
      landlordPaidBy: data.toLandlordPaidBy || '' // Map to required field
    };
    
    try {
      setProgress(30);
      await dispatch(createDraftTransaction(transactionData)).unwrap();
      setProgress(100);
      toast({ title: "Success", description: "Transaction saved as draft!" });
      onClose();
      form.reset();
    } catch (error: any) {
      console.log(error);
      toast({ title: "Error", description: error.message || "Failed to save draft", variant: "destructive" });
    } finally {
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add New Transaction
          </DialogTitle>
        </DialogHeader>

        {progress > 0 && (
          <div className="px-6 shrink-0">
            <Progress value={progress} className="h-1" />
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            {steps[currentStep].component}
          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-border/60 shrink-0 bg-card">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Save as Draft
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDraftMode(!isDraftMode)}
                className={`flex items-center gap-2 ${isDraftMode ? 'bg-warning/10 text-warning' : ''}`}
              >
                <Save className="h-4 w-4" />
                {isDraftMode ? 'Draft Mode' : 'Active Mode'}
              </Button>

              <Button
                type="submit"
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  isDraftMode
                    ? 'bg-warning hover:bg-warning/90 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isDraftMode ? 'Save as Draft' : 'Submit'}
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}