import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import RichTextEditor from "@/utils/RichTextEditor";

import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchManagementAgreement, upsertManagementAgreement } from "@/redux/dataStore/managementAgreementSlice";
import { cn } from "@/lib/utils";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";
import { PDFViewer } from "@react-pdf/renderer";
import ManagementContractPDF from "@/components/pdf/ManagementContractPDF";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const managementAgreementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  DateofAgreement: z.string().min(1, "Date of Agreement is required"),
  AgreementStart: z.string().min(1, "Agreement Start is required"),
  PaymentAgreement: z.string().min(1, "Payment Agreement is required"),
  AgreementEnd: z.string().min(1, "Agreement End is required"),
  Frequency: z.string().optional(),
  InventoryCharges: z.coerce.number({ invalid_type_error: "Inventory Charges must be a number" }),
  ManagementFees: z.coerce.number({ invalid_type_error: "Management Fees must be a number" }),
  TermsAndCondition: z.string().min(1, "Terms and Condition is required"),
  checkPayableTo: z.string().min(1, "Required"),
});

type ManagementAgreementFormData = z.infer<typeof managementAgreementSchema>;

const ManagementAgreement: React.FC<{ propertyId: string; property?: any }> = ({ propertyId, property }) => {
  const dispatch = useDispatch<any>();
  const { managementAgreement } = useAppSelector((state) => state.managementAgreement);

  const [showPdf, setShowPdf] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<ManagementAgreementFormData>({
    resolver: zodResolver(managementAgreementSchema),
    defaultValues: {
      propertyId,
      DateofAgreement: "",
      AgreementStart: "",
      PaymentAgreement: "",
      AgreementEnd: "",
      Frequency: "",
      TermsAndCondition: "",
      checkPayableTo: "",
    },
  });

  useEffect(() => {
    if (managementAgreement) {
      reset(managementAgreement && managementAgreement);
    }
  }, [managementAgreement, reset]);

  useEffect(() => {
    dispatch(fetchManagementAgreement({ propertyId }));
  }, [dispatch, propertyId]);

  const handleDateChange = (name: keyof ManagementAgreementFormData, date: Date) => {
    setValue(name, date.toISOString());
  };

  const onSubmit = async (data: ManagementAgreementFormData) => {
    try {
      await dispatch(upsertManagementAgreement(data)).unwrap();
      toast.success("Management Agreement updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update Management Agreement");
    }
  };

  const handlePreview = () => setShowPdf(true);

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Management Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("propertyId")} />

          {/* Date of Agreement & Payment Agreement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date of Agreement */}


            <DateField
              label="Date of Agreement"
              value={watch("DateofAgreement") || ""}
              onChange={(date) => handleDateChange("DateofAgreement", date)}
              error={errors.DateofAgreement?.message}
            />



            <DateField
              label="Payment Agreement"
              value={watch("PaymentAgreement") || ""}
              onChange={(date) => handleDateChange("PaymentAgreement", date)}
              error={errors.PaymentAgreement?.message}
            />


          </div>

          {/* Agreement Start & Agreement End */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agreement Start */}
            <DateField
              label="Agreement Start On"
              value={watch("AgreementStart") || ""}
              onChange={(date) => handleDateChange("AgreementStart", date)}
              error={errors.AgreementStart?.message}
            />
            {/* Agreement End */}
            <div>

              <DateField
                label="Agreement Ended On"
                value={watch("AgreementEnd") || ""}
                onChange={(date) => handleDateChange("AgreementEnd", date)}
                error={errors.AgreementStart?.message}
                placeholder="Pick return date (optional)"


              />
            </div>
          </div>

          {/* Frequency & Inventory Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SelectField
                label="Frequency"
                name="Frequency"
                register={register}
                error={errors.Frequency?.message}
                watch={watch}
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "4 Weekly", value: "4-weekly" },
                  { label: "Quarterly", value: "quarterly" },
                  { label: "Annually", value: "annually" },
                ]}
                setValue={setValue}
              />
            </div>

            <div>
              <InputField
                label="Inventory Charges"
                name="InventoryCharges"
                register={register}
                error={errors.InventoryCharges?.message}
                placeholder="Enter inventory charges"
                type="number"
                setValue={setValue}
              />
            </div>
          </div>

          {/* Management Fees & Terms and Conditions (textarea spans both columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <InputField
              label="Management Fees"
              name="ManagementFees"
              max={100}
              register={register}
              error={errors.ManagementFees?.message}
              placeholder="Enter management fees"
              type="number"
              setValue={setValue}
            />
            {/* checkPayableTo field */}
            <InputField
              label="Check Payable To"
              name="checkPayableTo"
              register={register}
              error={errors.checkPayableTo?.message}
              placeholder="Enter check payable to"
              setValue={setValue}

              type="text" />


          </div>

          <div className="md:col-span-2">
            <RichTextEditor
              label="Terms and Conditions"
              value={watch("TermsAndCondition") || ""}
              onChange={(html) => setValue("TermsAndCondition", html)}
              error={errors.TermsAndCondition?.message}
              placeholder="Enter terms and conditions"
            />
          </div>


          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={handlePreview}>
              Preview Agreement
            </Button>
            <Button type="submit">Update Management Agreement</Button>
          </div>
        </form>
      </CardContent>

      {/* Management Contract PDF Preview */}
      <Dialog open={showPdf} onOpenChange={setShowPdf}>
        <DialogContent className="sm:max-w-5xl h-[90vh] w-full">
          <DialogTitle className="text-lg font-semibold">Management Contract Preview</DialogTitle>
          <div className="w-full h-[78vh] border rounded-md overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <ManagementContractPDF data={getValues()} property={property} />
            </PDFViewer>
          </div>
          <DialogFooter className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => setShowPdf(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ManagementAgreement;
