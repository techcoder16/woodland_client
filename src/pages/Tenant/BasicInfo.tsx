import React, { useState } from "react";

import InputField from "../../utils/InputField";
import Room from "../../utils/Room"; // This Room component manages the entire rooms list
import SelectField from "@/utils/SelectedField";

interface TenantProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
}

const Tenant = ({
  register,
  watch,
  clearErrors,
  setValue,
  errors,
}: TenantProps) => {

  const titleOptions = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'miss', label: 'Miss' },
    { value: 'ms', label: 'Ms' },
    { value: 'dr', label: 'Dr' },
  ];
  const [selectedTitle, setSelectedTitle] = useState('');
  const handleSelectChange = (name: string, value: string) => {
    // Update corresponding state based on the name of the select field
  
    if (name === 'title') setSelectedTitle(value);

    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field

    // Optionally, log or do other side effects here
    
  };


  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Tenants</div>

      <div className="grid grid-cols-2 gap-4">

        <SelectField
          label="Title"
          name="title"
watch={watch}
          
          setValue={setValue}
          
          options={titleOptions}
          register={register}
          error={errors.title?.message?.toString()}
          onChange={(value) => handleSelectChange('title', value)} // Added onChange
        />    
      <InputField
        setValue={setValue}
        label="First Name"
        name="FirstName"
        register={register}
        error={errors?.FirstName?.message?.toString()}
      /></div>  <div className="grid grid-cols-2 gap-4">
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
  </div>  <div className="grid grid-cols-2 gap-4">
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
      />  </div>  <div className="grid grid-cols-2 gap-4">
      <InputField
        setValue={setValue}
        label="Email"
        name="Email"
        register={register}
        error={errors?.Email?.message?.toString()}
      />
      <InputField
        setValue={setValue}
        label="Employee Name"
        name="EmployeeName"
        register={register}
        error={errors?.EmployeeName?.message?.toString()}
      />  </div>  <div className="grid grid-cols-2 gap-4">
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
      />  </div>  <div className="grid grid-cols-2 gap-4">
 
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
      />  </div>  <div className="grid grid-cols-2 gap-4">
  
</div> 
    </div>
  );
};

export default Tenant;