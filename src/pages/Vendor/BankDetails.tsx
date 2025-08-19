import React, { useEffect, useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import countriesData from '../../data/counteries.json';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const BankDetails = ({register,watch, clearErrors, setValue, errors }: any) => {
  // const [countries, setCountries] = useState<any>([]);

  // useEffect(() => {
  //   const fetchCountries = async () => {
  //     try {
  //       const response = await fetch('https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code');
  //       if (!response.ok) throw new Error('Failed to fetch countries');
  //       const data = await response.json();
  //       setCountries(data.countries);
  //     } catch (error) {
        
  //       console.error('Error fetching countries:', error);
  //       setCountries([]);
  //     }
  //   };
  //   fetchCountries();
  // }, []);

  const handleSelectChange = (name: string, value: string) => {
    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field
    
  };
  
  return (
    <div>


      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Bank details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <InputField setValue={setValue} label="Bank Body" name="bankBody" register={register} error={errors.bankBody?.message?.toString()} />
      </div>
        <div className="text-lg font-medium flex justify-start underline p-5">Bank branch address</div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <InputField setValue={setValue} label="Address Line 1" name="bankAddressLine1" register={register} error={errors.bankAddressLine1?.message?.toString()} />
        <InputField setValue={setValue} label="Address Line 2" name="bankAddressLine2" register={register} error={errors.bankAddressLine2?.message?.toString()} />
        </div>       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <InputField setValue={setValue} label="Town" name="bankTown" register={register} error={errors.bankTown?.message?.toString()} />
        <InputField setValue={setValue}  label="Post Code" name="bankPostCode" register={register} error={errors.bankPostCode?.message?.toString()} />
        </div>       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


        <SelectField 
        watch={watch}
          
        setValue={setValue}
        onChange={(value) => handleSelectChange("bankCountry", value)}
        
        label="Country" name="bankCountry" options={countriesData} register={register} error={errors.bankCountry?.message?.toString()} />

        <div className="text-lg font-medium flex justify-start underline p-5">International Bank Details</div>
        <InputField setValue={setValue} label="IBAN" name="bankIban" register={register} error={errors.bankIban?.message?.toString()} />
       
        </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <InputField setValue={setValue} label="BIC" name="bic" register={register} error={errors.bank_bic?.message?.toString()} />
        <InputField setValue={setValue} label="NIB" name="nib" register={register} error={errors.nib?.message?.toString()} />
      </div>
      </div>
     
    </div>
  
    
  );
};

export default BankDetails;
