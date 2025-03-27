// src/components/ManagementAgreement.tsx
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
import { fetchManagementAgreement, upsertManagementAgreement } from "@/redux/dataStore/managementAgreementSlice";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

// Define the form schema for Management Agreement
const managementAgreementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  DateofAgreement: z.string().min(1, "Date of Agreement is required"),
  AgreementStart: z.string().min(1, "Agreement Start is required"),
  PaymentAgreement: z.string().min(1, "Payment Agreement is required"),
  AgreementEnd: z.string().min(1, "Agreement End is required"),
  Frequency: z.coerce.number({ invalid_type_error: "Frequency must be a number" }),
  InventoryCharges: z.coerce.number({ invalid_type_error: "Inventory Charges must be a number" }),
  ManagementFees: z.coerce.number({ invalid_type_error: "Management Fees must be a number" }),
  TermsAndCondition: z.string().min(1, "Terms and Condition is required"),
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
      Frequency: 0,
      InventoryCharges: 0,
      ManagementFees: 0,
      TermsAndCondition: "",
    },
  });

  useEffect(() => {
    if (managementAgreement) {
      reset(managementAgreement);
    }
  }, [managementAgreement, reset]);

  useEffect(() => {
    dispatch(fetchManagementAgreement({ propertyId }));
  }, [dispatch, propertyId]);

  const handleDateChange = (name: string, date: Date) => {
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
    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Management Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("propertyId")} />
          <div>
            <label className="text-gray-700 font-medium mr-4">Date of Agreement</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mx-2 text-left font-normal", !watch("DateofAgreement") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("DateofAgreement") ? new Date(watch("DateofAgreement")).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("DateofAgreement") ? new Date(watch("DateofAgreement")) : null}
                  onSelect={(date) => handleDateChange("DateofAgreement", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.DateofAgreement && <p className="text-red-600 text-sm">{errors.DateofAgreement.message}</p>}
          </div>
          <div>
            <label className="text-gray-700 font-medium mr-4">Agreement Start</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mx-2 text-left font-normal", !watch("AgreementStart") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("AgreementStart") ? new Date(watch("AgreementStart")).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("AgreementStart") ? new Date(watch("AgreementStart")) : null}
                  onSelect={(date) => handleDateChange("AgreementStart", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.AgreementStart && <p className="text-red-600 text-sm">{errors.AgreementStart.message}</p>}
          </div>
          <div>
            <label className="text-gray-700 font-medium mr-4">Payment Agreement</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mx-2 text-left font-normal", !watch("PaymentAgreement") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("PaymentAgreement") ? new Date(watch("PaymentAgreement")).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("PaymentAgreement") ? new Date(watch("PaymentAgreement")) : null}
                  onSelect={(date) => handleDateChange("PaymentAgreement", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.PaymentAgreement && <p className="text-red-600 text-sm">{errors.PaymentAgreement.message}</p>}
          </div>
          <div>
            <label className="text-gray-700 font-medium mr-4">Agreement End</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mx-2 text-left font-normal", !watch("AgreementEnd") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("AgreementEnd") ? new Date(watch("AgreementEnd")).toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("AgreementEnd") ? new Date(watch("AgreementEnd")) : null}
                  onSelect={(date) => handleDateChange("AgreementEnd", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.AgreementEnd && <p className="text-red-600 text-sm">{errors.AgreementEnd.message}</p>}
          </div>
          <InputField
            label="Frequency"
            name="Frequency"
            register={register}
            error={errors.Frequency?.message}
            placeholder="Enter frequency"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Inventory Charges"
            name="InventoryCharges"
            register={register}
            error={errors.InventoryCharges?.message}
            placeholder="Enter inventory charges"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Management Fees"
            name="ManagementFees"
            register={register}
            error={errors.ManagementFees?.message}
            placeholder="Enter management fees"
            type="number"
            setValue={setValue}
          />
          <TextAreaField
            label="Terms and Conditions"
            name="TermsAndCondition"
            register={register}
            error={errors.TermsAndCondition?.message}
            placeholder="Enter terms and conditions"
          />
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
