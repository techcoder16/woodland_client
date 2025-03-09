// Description.tsx
import React from "react";

import TextAreaField from "../../utils/TextAreaField";
import Room from "../../utils/Room"; // This Room component manages the entire rooms list
interface DescriptionProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
}
const Description = ({
  register,
  watch,
  clearErrors,
  setValue,
  errors,
}: DescriptionProps) => {

  return (

  
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Descriptions</div>
      <TextAreaField
        label="Short Summary"
        name="shortSummary"
        register={register}
        error={errors?.shortSummary?.message?.toString()}
      />
      <TextAreaField
        label="Full Description"
        name="fullDescription"
        register={register}
        error={errors?.fullDescription?.message?.toString()}
      />


      <Room
        register={register}
        watch={watch}
        setValue={setValue}
        clearErrors={clearErrors}
        errors={errors}
        
      />
    </div>
  );
};

export default Description;
