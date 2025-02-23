import React, { useState } from "react";
import InputField from "../../utils/InputField";
import SelectField from "../../utils/SelectedField";
import InputSelect from "../../utils/InputSelect";
import TextAreaField from "../../utils/TextAreaField";

const InternalInfo = ({ register,watch, clearErrors, setValue, errors }: any) => {
  const [nrlTax, setNRLTax] = useState<string>(watch("nrlTax") || "");

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
    { label: "%", value: "%" },
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
        watch={watch}
          
        name="label"
        setValue={setValue}
          
        options={labelOptions}
        register={register}
        error={errors.label?.message?.toString()}
        onChange={(value) => handleSelectChange("label", value)}
      />
      <SelectField
        label="Status"
        name="status"
        watch={watch}
          
        setValue={setValue}
          
        options={statusOptions}
        register={register}
        error={errors.status?.message?.toString()}
        onChange={(value) => handleSelectChange("status", value)}
        
      />
      <SelectField
        label="Branch"
        name="branch"
        watch={watch}
          
        setValue={setValue}
          
        options={branchOptions}
        register={register}
        error={errors.branch?.message?.toString()}
        onChange={(value) => handleSelectChange("branch", value)}
      />
      <InputField setValue={setValue}
        label="Negotiator"
        name="negotiator"
        register={register}
        error={errors.negotiator?.message?.toString()}
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
      setValue={setValue}

        label="Sales Fee"
        name="salesFee"
        watch={watch}

        options={feeOptions}
        register={register}
      />

      
      <InputSelect
      setValue={setValue}
      
        label="Finders Fee"
        name="findersFee"
        watch={watch}
        
        options={feeOptions}
        register={register}
      />
      <InputSelect
      setValue={setValue}
      
        label="Management Fee"
        name="managementFee"
        watch={watch}
        
        options={feeOptions}
        register={register}
      />

      <div className="text-lg font-medium underline p-5">Default Multi Agency Fee</div>
      <InputSelect
      setValue={setValue}
      
        label="Sales Fee"
        name="salesFeeA"
        watch={watch}
        
        options={feeOptions}
        register={register}
      />
      <InputSelect
      setValue={setValue}
      
        label="Finders Fee"
        name="findersFeeA"
        options={feeOptions}
        watch={watch}
        
        register={register}
      />
      <InputSelect
      setValue={setValue}
      
        label="Management Fee"
        name="managementFeeA"
        watch={watch}
        
        options={feeOptions}
        register={register}
      />

      <div className="text-lg font-medium underline p-5">NRL and VAT</div>
      <SelectField
      watch={watch}
          
        label="NRL Tax"
        name="nrlTax"
        setValue={setValue}
          
        options={nrlTaxOptions}
        register={register}
        onChange={(value) => {
          setNRLTax(value); // Store NRL rate selection
          handleSelectChange("nrlTax", value); // Update form value
        }}
        error={errors.nrlTax?.message?.toString()}
      />
      {nrlTax === "charge_tax" && (
        <InputField setValue={setValue}
          label="NRL Rate"
          name="nrlRate"
       

          register={register}
          error={errors.nrlRate?.message?.toString()}
        />
      )}
      {nrlTax === "tax_exempt" && (
        <InputField setValue={setValue}
          label="NRL Ref"

          name="nrlRef"
          register={register}
          error={errors.nrlRef?.message?.toString()}
        />
      )}
      <InputField setValue={setValue}
        label="VAT Number"
        name="vatNumber"
        register={register}
        error={errors.vatNumber?.message?.toString()}
      />

      <div className="text-lg font-medium underline p-5">Landlord/Vendor 2</div>
      <InputField setValue={setValue}
        label="Full Name"
        name="landlordFullName"
        register={register}
        error={errors.landlordFullName?.message?.toString()}
      />
      <InputField setValue={setValue}
        label="Contact"
        name="landlordContact"
        register={register}
        error={errors.landlordContact?.message?.toString()}
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
        name="otherInfo"
        register={register}
        error={errors.otherInfo?.message?.toString()}
      />
    </div>
  );
};

export default InternalInfo;
