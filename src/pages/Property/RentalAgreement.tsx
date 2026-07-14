import SelectField from "@/utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";

interface RentalAgreementProps {
  register: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  errors: any;
}

const tenureOptions = [
  { value: "Freehold", label: "Freehold" },
  { value: "Leasehold", label: "Leasehold" },
  { value: "Share of Freehold", label: "Share of Freehold" },
  { value: "Virtual Freehold", label: "Virtual Freehold" },
  { value: "Other", label: "Other" },
];

const RentalAgreement = ({ register, watch, setValue, clearErrors, errors }: RentalAgreementProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Rental Agreement</div>

        <SelectField
          label="Tenure"
          name="rentalTenure"
          watch={watch}
          setValue={setValue}
          options={tenureOptions}
          register={register}
          error={errors?.rentalTenure?.message?.toString()}
          onChange={(value) => {
            setValue("rentalTenure", value);
            clearErrors("rentalTenure");
          }}
        />

        <TextAreaField
          label="Description"
          name="rentalDescription"
          register={register}
          error={errors?.rentalDescription?.message?.toString()}
        />
      </div>
    </div>
  );
};

export default RentalAgreement;
