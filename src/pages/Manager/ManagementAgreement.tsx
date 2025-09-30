import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";

import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchManagementAgreement, upsertManagementAgreement } from "@/redux/dataStore/managementAgreementSlice";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";

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

const ManagementAgreement: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  const { managementAgreement } = useAppSelector((state) => state.managementAgreement);

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

  const handlePreview = () => {
    const data = getValues();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Management Agreement Preview", 10, 10);
    doc.setFontSize(12);
    let y = 20;

    doc.text(`Date of Agreement: ${new Date(data.DateofAgreement).toLocaleDateString()}`, 10, y);
    y += 10;
    doc.text(`Agreement Start: ${new Date(data.AgreementStart).toLocaleDateString()}`, 10, y);
    y += 10;
    doc.text(`Payment Agreement: ${new Date(data.PaymentAgreement).toLocaleDateString()}`, 10, y);
    y += 10;
    doc.text(`Agreement End: ${new Date(data.AgreementEnd).toLocaleDateString()}`, 10, y);
    y += 10;
    doc.text(`Frequency: ${data.Frequency}`, 10, y);
    y += 10;
    doc.text(`Inventory Charges: ${data.InventoryCharges}`, 10, y);
    y += 10;
    doc.text(`Management Fees: ${data.ManagementFees}`, 10, y);
    y += 10;
    doc.text(`Terms & Conditions: ${data.TermsAndCondition}`, 10, y);
    y += 10;
    doc.text(`Check Payable To: ${data.checkPayableTo}`, 10, y);
    window.open(doc.output("bloburl"), "_blank");
  };

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
            <TextAreaField
              label="Terms and Conditions"
              name="TermsAndCondition"
              register={register}
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
    </Card>
  );
};

export default ManagementAgreement;
