import TextAreaField from "@/utils/TextAreaField";
import { DateField } from "@/utils/DateField";

interface RentalAgreementProps {
  register: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  errors: any;
}

const RentalAgreement = ({ register, watch, setValue, clearErrors, errors }: RentalAgreementProps) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Rental Agreement</div>

        <DateField
          label="Rental Date"
          value={watch("rentalTenure") || ""}
          onChange={(date) => {
            setValue("rentalTenure", date.toISOString());
            clearErrors("rentalTenure");
          }}
          error={errors?.rentalTenure?.message?.toString()}
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
