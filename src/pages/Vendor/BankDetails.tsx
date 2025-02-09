import React, { useEffect, useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';

const BankDetails = ({register,watch, clearErrors, setValue, errors }: any) => {
  const [countries, setCountries] = useState<any>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setCountries(data.countries);
      } catch (error) {
        
        console.error('Error fetching countries:', error);
        setCountries([]);
      }
    };
    fetchCountries();
  }, []);

  const handleSelectChange = (name: string, value: string) => {
    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field
    
  };
  
  return (
    <div>
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Bank details</div>
        <InputField setValue={setValue} label="Bank Body" name="bank_body" register={register} error={errors.bank_body?.message?.toString()} />

        <div className="text-lg font-medium flex justify-start underline p-5">Bank branch address</div>
        <InputField setValue={setValue} label="Address Line 1" name="bank_address_line_1" register={register} error={errors.bank_address_line_1?.message?.toString()} />
        <InputField setValue={setValue} label="Address Line 2" name="bank_address_line_2" register={register} error={errors.bank_address_line_2?.message?.toString()} />
        <InputField setValue={setValue} label="Town" name="bank_town" register={register} error={errors.bank_town?.message?.toString()} />
        <InputField setValue={setValue}  label="Post Code" name="bank_post_code" register={register} error={errors.bank_post_code?.message?.toString()} />
        <SelectField 
        watch={watch}
          
        setValue={setValue}
        onChange={(value) => handleSelectChange("bank_country", value)}
        
        label="Country" name="bank_country" options={countries} register={register} error={errors.bank_country?.message?.toString()} />

        <div className="text-lg font-medium flex justify-start underline p-5">International Bank Details</div>
        <InputField setValue={setValue} label="IBAN" name="bank_iban" register={register} error={errors.bank_iban?.message?.toString()} />
        <InputField setValue={setValue} label="BIC" name="bic" register={register} error={errors.bank_bic?.message?.toString()} />
        <InputField setValue={setValue} label="NIB" name="nib" register={register} error={errors.nib?.message?.toString()} />
      </div>
    </div>
  );
};

export default BankDetails;
