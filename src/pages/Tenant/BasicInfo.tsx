import { useEffect } from "react";

import InputField from "../../utils/InputField";
import SelectField from "@/utils/SelectedField";

interface TenantProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
  isEdit?: boolean;
}

// Occupier form. Two contact numbers (stored in MobileNo / HomePhone) and two
// emails (Email is the login, Email2 is a second contact). At least one
// contact number or email is required (see tenant.schema.ts). No address;
// country is always stored as GB.
const Tenant = ({ register, watch, clearErrors, setValue, errors, isEdit }: TenantProps) => {
  useEffect(() => {
    if (watch("country") !== "GB") setValue("country", "GB");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleOptions = [
    { value: "mr", label: "Mr" },
    { value: "mrs", label: "Mrs" },
    { value: "miss", label: "Miss" },
    { value: "ms", label: "Ms" },
    { value: "dr", label: "Dr" },
  ];

  const contactError = errors?.MobileNo?.message?.toString();

  return (
    <div className="w-full space-y-5">
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Occupier details</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <SelectField
          label="Title"
          name="title"
          watch={watch}
          setValue={setValue}
          options={titleOptions}
          register={register}
          error={errors.title?.message?.toString()}
          onChange={(value) => clearErrors("title")}
        />
        <InputField setValue={setValue} label="First Name" name="FirstName" register={register} error={errors?.FirstName?.message?.toString()} />
        <InputField setValue={setValue} label="Last Name" name="SureName" register={register} error={errors?.SureName?.message?.toString()} />
      </div>

      <div className="space-y-4 pt-2">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</div>
        <p className="text-xs text-muted-foreground">Enter at least one contact number or email.</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <InputField setValue={setValue} label="Contact Number 1" name="MobileNo" type="tel" register={register} error={contactError} />
          <InputField setValue={setValue} label="Contact Number 2" name="HomePhone" type="tel" register={register} error={errors?.HomePhone?.message?.toString()} />
          {isEdit ? (
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium text-sm">Email 1</label>
              <div className="text-sm py-2">{watch("Email") || "-"}</div>
              <p className="text-xs text-muted-foreground">Email 1 is the occupier's login and can't be changed here.</p>
            </div>
          ) : (
            <InputField setValue={setValue} label="Email 1" name="Email" type="email" register={register} error={errors?.Email?.message?.toString()} />
          )}
          <InputField setValue={setValue} label="Email 2" name="Email2" type="email" register={register} error={errors?.Email2?.message?.toString()} />
        </div>
      </div>

    </div>
  );
};

export default Tenant;
