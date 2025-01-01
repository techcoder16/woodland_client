import React, { useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import InputSelect from '../../utils/InputSelect';
const BankDetails = ({register,errors}:any) => (

  <div className='w-1/2'>
  <form  className="p-4 w-full">
        <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Bank details</div>
        <InputField
        label="Bank Body"
        name="bank_body"
        register={register}
        error={errors.bank_body?.message?.toString()}
      />

<InputField
        label="Account no"
        name="account_no"
        register={register}
        error={errors.account_no?.message?.toString()}
      />

<InputField
        label="Sort code"
        name="sort_code"
        register={register}
        error={errors.sort_code?.message?.toString()}
      />

<InputField
        label="Account name"
        name="account_name"
        register={register}
        error={errors.account_name?.message?.toString()}
      />
<InputField
        label="Beneficiary reference" 
        name="beneficiary_ref"
        register={register}
        error={errors.beneficiary_ref?.message?.toString()}
      />


      
        <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Bank branch address</div>



        
        <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">International Bank Details</div>

        </form>
        </div>

);

export default BankDetails;
