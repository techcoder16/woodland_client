import React, { useState } from "react";

import InputField from "../../utils/InputField";
import Room from "../../utils/Room"; // This Room component manages the entire rooms list
import SelectField from "@/utils/SelectedField";
import AddressSearchField from "@/components/AddressSearchField";

interface TenantProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
  isEdit?: boolean;
}

const Tenant = ({ register, watch, clearErrors, setValue, errors, isEdit }: TenantProps) => {
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
  const titleOptions = [
    { value: "mr", label: "Mr" },
    { value: "mrs", label: "Mrs" },
    { value: "miss", label: "Miss" },
    { value: "ms", label: "Ms" },
    { value: "dr", label: "Dr" },
  ];
  const [selectedTitle, setSelectedTitle] = useState("");
  const handleSelectChange = (name: string, value: string) => {
    // Update corresponding state based on the name of the select field

    if (name === "title") setSelectedTitle(value);

    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field

    // Optionally, log or do other side effects here
  };

  return (
    <div className="w-full space-y-5">
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tenant details</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <SelectField
          label="Title"
          name="title"
          watch={watch}
          setValue={setValue}
          options={titleOptions}
          register={register}
          error={errors.title?.message?.toString()}
          onChange={value => handleSelectChange("title", value)} // Added onChange
        />
        <InputField
          setValue={setValue}
          label="First Name"
          name="FirstName"
          register={register}
          error={errors?.FirstName?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Sure Name"
          name="SureName"
          register={register}
          error={errors?.SureName?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Mobile No"
          name="MobileNo"
          register={register}
          error={errors?.MobileNo?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Home Phone"
          name="HomePhone"
          register={register}
          error={errors?.HomePhone?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Work Phone"
          name="WorkPhone"
          register={register}
          error={errors?.WorkPhone?.message?.toString()}
        />
        {isEdit ? (
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium text-sm">Email</label>
            <div className="text-sm py-2">{watch("Email")}</div>
            <p className="text-xs text-muted-foreground">Email is the tenant's login and can't be changed here.</p>
          </div>
        ) : (
          <InputField
            setValue={setValue}
            label="Email"
            name="Email"
            register={register}
            error={errors?.Email?.message?.toString()}
          />
        )}
        <InputField
          setValue={setValue}
          label="Employee Name"
          name="EmployeeName"
          register={register}
          error={errors?.EmployeeName?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Bank Account No"
          name="BankAccountNo"
          register={register}
          error={errors?.BankAccountNo?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Sort Code"
          name="SortCode"
          register={register}
          error={errors?.SortCode?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Bank Name"
          name="BankName"
          register={register}
          error={errors?.BankName?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="ID Check"
          name="IDCheck"
          register={register}
          error={errors?.IDCheck?.message?.toString()}
        />
      </div>
      <div className="space-y-4 pt-2">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Address</div>
        <AddressSearchField onSelect={handleAddressSelect} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <InputField setValue={setValue} label="Post Code" name="postCode" register={register} error={errors?.postCode?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors?.addressLine1?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors?.addressLine2?.message?.toString()} />
          <InputField setValue={setValue} label="Town" name="town" register={register} error={errors?.town?.message?.toString()} />
          <InputField setValue={setValue} label="Country" name="country" register={register} error={errors?.country?.message?.toString()} />
        </div>
      </div>
    </div>
  );
};

export default Tenant;
