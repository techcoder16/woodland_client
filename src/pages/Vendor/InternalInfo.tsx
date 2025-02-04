import React, { useState } from "react";
import InputField from "../../utils/InputField";
import SelectField from "../../utils/SelectedField";
import InputSelect from "../../utils/InputSelect";
import TextAreaField from "../../utils/TextAreaField";

const InternalInfo = ({ register, errors, setValue, clearErrors }: any) => {
  const [nrlRate, setNRLRate] = useState<string>("");

  const labelOptions = [
    { label: "Not dealt with yet", value: "not_dealt_with_yet" },
    { label: "HOT", value: "hot" },
    { label: "WAR", value: "war" },
    { label: "COLD", value: "cold" },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Pending", value: "pending" },
    { label: "Lost to a competitor", value: "lost_to_a_competitor" },
  ];

  const branchOptions = [{ label: "Woodland", value: "woodland" }];
  const feeOptions = [
    { label: "%", value: "percentage" },
    { label: "Fixed", value: "fixed" },
  ];

  const nrlTaxOptions = [
    { label: "No", value: "No" },
    { label: "Charge Tax", value: "charge_tax" },
    { label: "Tax Exempt", value: "tax_exempt" },
  ];

  const handleSelectChange = (name: string, value: string) => {
    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field
    console.log(`${name} selected: ${value}`);
  };

  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Other Info</div>
      <div className="flex items-center p-6">
        <input
          type="checkbox"
          {...register("dnrvfn")}
          className="form-checkbox h-5 w-5"
        />
        <label className="text-gray-700 mx-2">
          Do not receive viewing feedback notifications
        </label>
      </div>
      <SelectField
        label="Label"
        name="label"
        options={labelOptions}
        register={register}
        error={errors.label?.message?.toString()}
        onChange={(value) => handleSelectChange("label", value)}
      />
      <SelectField
        label="Status"
        name="status"
        options={statusOptions}
        register={register}
        error={errors.status?.message?.toString()}
        onChange={(value) => handleSelectChange("status", value)}
      />
      <SelectField
        label="Branch"
        name="branch"
        options={branchOptions}
        register={register}
        error={errors.branch?.message?.toString()}
        onChange={(value) => handleSelectChange("branch", value)}
      />
      <InputField setValue={setValue}
        label="Negotiator"
        name="negotiater"
        register={register}
        error={errors.negotiater?.message?.toString()}
      />
      <InputField setValue={setValue}
        label="Source"
        name="source"
        register={register}
        error={errors.source?.message?.toString()}
      />

      <div className="underline p-5">Fees and Contract</div>
      <div className="flex items-center p-6">
        <input
          type="checkbox"
          {...register("ldhor")}
          className="form-checkbox h-5 w-5"
        />
        <label className="text-gray-700 mx-2">
          Landlord does his own repairs
        </label>
      </div>

      <div className="text-lg font-medium underline p-5">Default Sole Agency Fee</div>
      <InputSelect
        label="Sales Fee"
        name="sales_fee"
        options={feeOptions}
        register={register}
      />
      <InputSelect
        label="Finders Fee"
        name="finders_fee"
        options={feeOptions}
        register={register}
      />
      <InputSelect
        label="Management Fee"
        name="management_fee"
        options={feeOptions}
        register={register}
      />

      <div className="text-lg font-medium underline p-5">Default Multi Agency Fee</div>
      <InputSelect
        label="Sales Fee"
        name="sales_fee_a"
        options={feeOptions}
        register={register}
      />
      <InputSelect
        label="Finders Fee"
        name="finders_fee_a"
        options={feeOptions}
        register={register}
      />
      <InputSelect
        label="Management Fee"
        name="management_fee_a"
        options={feeOptions}
        register={register}
      />

      <div className="text-lg font-medium underline p-5">NRL and VAT</div>
      <SelectField
        label="NRL Tax"
        name="nrl_tax"
        options={nrlTaxOptions}
        register={register}
        onChange={(value) => {
          setNRLRate(value); // Store NRL rate selection
          handleSelectChange("nrl_tax", value); // Update form value
        }}
        error={errors.nrl_tax?.message?.toString()}
      />
      {nrlRate === "charge_tax" && (
        <InputField setValue={setValue}
          label="NRL Rate"
          name="nrl_rate"
       

          register={register}
          error={errors.nrl_rate?.message?.toString()}
        />
      )}
      {nrlRate === "tax_exempt" && (
        <InputField setValue={setValue}
          label="NRL Ref"

          name="nrl_ref"
          register={register}
          error={errors.nrl_ref?.message?.toString()}
        />
      )}
      <InputField setValue={setValue}
        label="VAT Number"
        name="vat_number"
        register={register}
        error={errors.vat_number?.message?.toString()}
      />

      <div className="text-lg font-medium underline p-5">Landlord/Vendor 2</div>
      <InputField setValue={setValue}
        label="Full Name"
        name="landlord_full_name"
        register={register}
        error={errors.landlord_full_name?.message?.toString()}
      />
      <InputField setValue={setValue}
        label="Contact"
        name="landlord_contact"
        register={register}
        error={errors.landlord_contact?.message?.toString()}
      />

      <div className="text-lg font-medium underline p-5">Comments</div>
      <TextAreaField
        label="Comments"
        name="comments"
        register={register}
        error={errors.comments?.message?.toString()}
      />
      <TextAreaField
        label="Other Info"
        name="other_info"
        register={register}
        error={errors.other_info?.message?.toString()}
      />
    </div>
  );
};

export default InternalInfo;
