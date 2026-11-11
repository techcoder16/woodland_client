import { useEffect } from "react";

import InputField from "../../utils/InputField";
import SelectField from "@/utils/SelectedField";
import AddressSearchField from "@/components/AddressSearchField";
import countriesData from "../../data/ukCountry.json";

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
// contact number or email is required (see tenant.schema.ts). Country is
// always United Kingdom.
const Tenant = ({ register, watch, clearErrors, setValue, errors, isEdit }: TenantProps) => {
  useEffect(() => {
    if (watch("country") !== "GB") setValue("country", "GB");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSelect = (address: {
    addressLine1?: string;
    addressLine2?: string;
    town?: string;
    postCode?: string;
    country?: string;
  }) => {
    if (address.addressLine1) setValue("addressLine1", address.addressLine1);
    if (address.addressLine2) setValue("addressLine2", address.addressLine2);
    if (address.town) setValue("town", address.town);
    if (address.postCode) setValue("postCode", address.postCode);
    setValue("country", "GB");
    clearErrors(["addressLine1", "town", "postCode", "country"]);
  };

  const contactError = errors?.MobileNo?.message?.toString();

  return (
    <div className="w-full space-y-5">
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Occupier details</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <InputField setValue={setValue} label="First Name" name="FirstName" register={register} error={errors?.FirstName?.message?.toString()} />
        <InputField setValue={setValue} label="Last Name" name="SureName" register={register} error={errors?.SureName?.message?.toString()} />
        <InputField setValue={setValue} label="ID Check" name="IDCheck" register={register} error={errors?.IDCheck?.message?.toString()} />
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

      <div className="space-y-4 pt-2">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Address</div>
        <AddressSearchField onSelect={handleAddressSelect} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <InputField setValue={setValue} label="Post Code" name="postCode" register={register} error={errors?.postCode?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors?.addressLine1?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors?.addressLine2?.message?.toString()} />
          <InputField setValue={setValue} label="Town" name="town" register={register} error={errors?.town?.message?.toString()} />
          <SelectField
            label="Country"
            name="country"
            watch={watch}
            setValue={setValue}
            options={countriesData}
            register={register}
            error={errors?.country?.message?.toString()}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default Tenant;
