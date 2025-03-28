// src/components/TenancyAgreement.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchTenancyAgreement, upsertTenancyAgreement } from "@/redux/dataStore/tenancyAgreementSlice";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

// Define the form schema for Tenancy Agreement
const tenancyAgreementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  details: z.string().min(1, "Details are required"),
  housingAct: z.string().min(1, "Housing Act is required"),
  LetterType: z.string().min(1, "Letter Type is required"),
  TermsandCondition: z.string().min(1, "Terms and Condition are required"),
  Guaranteer: z.string().min(1, "Guarantor is required"),
  Address1: z.string().min(1, "Address1 is required"),
  Address2: z.string().optional(),
  HideLandlordAdress: z.boolean(),
  signedDate: z.string().optional(), // ISO string format
});

type TenancyAgreementFormData = z.infer<typeof tenancyAgreementSchema>;

const TenancyAgreement: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  const { tenancyAgreement } = useAppSelector((state) => state.tenancyAgreement);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenancyAgreementFormData>({
    resolver: zodResolver(tenancyAgreementSchema),
    defaultValues: {
      propertyId,
      tenantId: "",
      details: "",
      housingAct: "",
      LetterType: "",
      TermsandCondition: "",
      Guaranteer: "",
      Address1: "",
      Address2: "",
      HideLandlordAdress: false,
      signedDate: "",
    },
  });

  useEffect(() => {
    if (tenancyAgreement) {
      reset(tenancyAgreement);
    }
  }, [tenancyAgreement, reset]);

  useEffect(() => {
    dispatch(fetchTenancyAgreement({ propertyId }));
  }, [dispatch, propertyId]);

  const handleDateChange = (name: any, date: Date) => {
    setValue(name, date.toISOString());
  };

  const onSubmit = async (data: any) => {
    try {
      await dispatch(upsertTenancyAgreement(data)).unwrap();
      toast.success("Tenancy Agreement updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update Tenancy Agreement");
    }
  };

  const handlePreview = () => {
    const data = getValues();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Tenancy Agreement Preview", 10, 10);
    doc.setFontSize(12);
    let y = 20;
    doc.text(`Tenant ID: ${data.tenantId}`, 10, y);
    y += 10;
    doc.text(`Details: ${data.details}`, 10, y);
    y += 10;
    doc.text(`Housing Act: ${data.housingAct}`, 10, y);
    y += 10;
    doc.text(`Letter Type: ${data.LetterType}`, 10, y);
    y += 10;
    doc.text(`Terms & Conditions: ${data.TermsandCondition}`, 10, y);
    y += 10;
    doc.text(`Guarantor: ${data.Guaranteer}`, 10, y);
    y += 10;
    doc.text(`Address 1: ${data.Address1}`, 10, y);
    y += 10;
    if (data.Address2) {
      doc.text(`Address 2: ${data.Address2}`, 10, y);
      y += 10;
    }
    if (data.signedDate) {
      doc.text(`Signed Date: ${new Date(data.signedDate).toLocaleDateString()}`, 10, y);
    }
    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Tenancy Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden Property ID */}
          <input type="hidden" {...register("propertyId")} />

          <InputField
            label="Tenant ID"
            name="tenantId"
            register={register}
            error={errors.tenantId?.message}
            placeholder="Enter Tenant ID"
            setValue={setValue}
          />
          <TextAreaField
            label="Details"
            name="details"
            register={register}
            error={errors.details?.message}
            placeholder="Enter details"
          />
          <InputField
            label="Housing Act"
            name="housingAct"
            register={register}
            error={errors.housingAct?.message}
            placeholder="Enter housing act"
            setValue={setValue}
          />
          <InputField
            label="Letter Type"
            name="LetterType"
            register={register}
            error={errors.LetterType?.message}
            placeholder="Enter letter type"
            setValue={setValue}
          />
          <TextAreaField
            label="Terms and Conditions"
            name="TermsandCondition"
            register={register}
            error={errors.TermsandCondition?.message}
            placeholder="Enter terms and conditions"
          />
          <InputField
            label="Guarantor"
            name="Guaranteer"
            register={register}
            error={errors.Guaranteer?.message}
            placeholder="Enter guarantor"
            setValue={setValue}
          />
          <InputField
            label="Address 1"
            name="Address1"
            register={register}
            error={errors.Address1?.message}
            placeholder="Enter Address 1"
            setValue={setValue}
          />
          <InputField
            label="Address 2"
            name="Address2"
            register={register}
            error={errors.Address2?.message}
            placeholder="Enter Address 2 (optional)"
            setValue={setValue}
          />
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("HideLandlordAdress")} />
              <span>Hide Landlord Address</span>
            </label>
          </div>
          <div>
            <label className="text-gray-700 font-medium mr-4">Signed Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mx-2 text-left font-normal", !watch("signedDate") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("signedDate") ? new Date(watch("signedDate")).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("signedDate") ? new Date(watch("signedDate")) : null}
                  onSelect={(date) => handleDateChange("signedDate", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.signedDate && <p className="text-red-600 text-sm">{errors.signedDate.message}</p>}
          </div>
          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={handlePreview}>
              Preview Agreement
            </Button>
            <Button type="submit">Update Tenancy Agreement</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TenancyAgreement;
