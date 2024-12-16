import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import { count } from 'console';



export const CorrespondenceAddress = ({register,errors}:any) => {

const [countries,setCountries] = useState<any>([]);

    
  useEffect(() => {
    fetch(
      "https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code"
    )
      .then((response) => response.json())
      .then((data) => {
        setCountries(data.countries);

      
      });
  }, []);
  
  return (
    <div className='mt-3'>
  <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Correspondence Address</div>

<InputField
        label="Post Code"
        name="postCode"
        register={register}
        error={errors.postCode?.message?.toString()}
      />

      {/* Address Line Field */}
      <InputField
        label="Address Line 1"
        name="addressLine1"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >
   {/* Address Line Field */}
   <InputField
        label="Address Line 2"
        name="addressLine2"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >

<InputField
        label="Town"
        name="town"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >
        
        
        <SelectField
        label="Country"
        name="country"
        options={countries}
        register={register}
        error={errors.country?.message?.toString()}
      />

 
    </div>
  );
};
