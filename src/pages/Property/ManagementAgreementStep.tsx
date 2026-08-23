import InputField from "@/utils/InputField";
import SelectField from "@/utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";
import { DateField } from "@/utils/DateField";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { generateManagementAgreementPdf } from "@/helper/generateManagementAgreement";

interface ManagementAgreementStepProps {
  register: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  errors: any;
  vendorName?: string;
}

const PAYABLE_IN_ADVANCE_OPTIONS = [
  { value: "1_week", label: "1 Week" },
  { value: "1_month", label: "1 Month" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
];

const ManagementAgreementStep = ({ register, watch, setValue, clearErrors, errors, vendorName }: ManagementAgreementStepProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Management Agreement</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            label="Management Date"
            value={watch("managementDate") || ""}
            onChange={(date) => {
              setValue("managementDate", date.toISOString());
              clearErrors("managementDate");
            }}
            error={errors?.managementDate?.message?.toString()}
          />

          <DateField
            label="Rent Effective Date"
            value={watch("rentEffectiveDate") || ""}
            onChange={(date) => {
              setValue("rentEffectiveDate", date.toISOString());
              clearErrors("rentEffectiveDate");
            }}
            error={errors?.rentEffectiveDate?.message?.toString()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Rent Per Month (£)"
            name="rentPerMonth"
            register={register}
            setValue={setValue}
            error={errors?.rentPerMonth?.message?.toString()}
          />

          <SelectField
            label="Property Rent Due"
            name="rentPayableInAdvance"
            options={PAYABLE_IN_ADVANCE_OPTIONS}
            register={register}
            setValue={setValue}
            watch={watch}
            error={errors?.rentPayableInAdvance?.message?.toString()}
            onChange={(value) => {
              setValue("rentPayableInAdvance", value);
              clearErrors("rentPayableInAdvance");
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Term (Months)"
            name="termMonths"
            register={register}
            setValue={setValue}
            error={errors?.termMonths?.message?.toString()}
          />
        </div>

        <TextAreaField
          label="Terms"
          name="rentalTerms"
          register={register}
          error={errors?.rentalTerms?.message?.toString()}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              generateManagementAgreementPdf({
                addressLine1: watch("addressLine1"),
                addressLine2: watch("addressLine2"),
                town: watch("town"),
                postCode: watch("postCode"),
                managementDate: watch("managementDate"),
                rentEffectiveDate: watch("rentEffectiveDate"),
                rentPerMonth: watch("rentPerMonth"),
                rentPayableInAdvance: watch("rentPayableInAdvance"),
                rentalTerms: watch("rentalTerms"),
                termMonths: watch("termMonths"),
                vendorName,
              })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagementAgreementStep;
