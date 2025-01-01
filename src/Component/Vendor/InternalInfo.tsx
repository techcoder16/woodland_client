import React, { useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import InputSelect from '../../utils/InputSelect';
import { RegisterOptions, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import TextAreaField from '../../utils/TextAreaField';
const InternalInfo = ({register,errors}:any) => {

const [nrlRate,setNRLRate] = useState<string>("");
    const labelOptions = [
        { label: 'Not dealt with yet', value: 'not_dealt_with_yet' },
        { label: 'HOT', value: 'hot' },
        { label: 'WAR', value: 'war' },
        { label: 'COLD', value: 'cold' }
      ];
      
      const statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
        { label: 'Lost to a competitor', value: 'lost_to_a_competitor' }
      ];
      const branchOptions = [{ label: 'Woodland', value: 'woodland'}]

    return (
      <div className='lg:w-1/2 w-full'>
    <form  className="p-4 w-full">
        <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Other Info</div>
      {/* Landlord and Vendor Checkbox */}
      <div className="mx-2 items-center bg-[#F4F4F4] p-6 flex  rounded-sm">

     

                <input type="checkbox" name = "dnrvfn" {...register("dnrvfn")} className="form-checkbox h-5 w-5 text-gray-600"/>
                <label className="text-gray-700 mx-2">Do not receive viewing feedback notifications</label>
            </div>
      
          
                    <SelectField
        label="Label"
        name="label"
        options={labelOptions}
        register={register}
        defaultValue="Select a label"
        error={errors.label?.message?.toString()}
      />


   <SelectField
        label="Status"
        name="status"
        options={statusOptions}
        register={register}
        defaultValue="Select a status"
        error={errors.status?.message?.toString()}
      />

<SelectField
        label="Branch"
        name="branch"
        options={branchOptions}
        register={register}
        defaultValue="Select a branch"
        error={errors.branch?.message?.toString()}
      />  
      <InputField
       label="Negotiater"
       name="negotiater"
       register={register}
       error={errors.negotiater?.message?.toString()}
     /
     >
             
            
             <InputField
       label="Source"
       name="source"
       register={register}
       error={errors.source?.message?.toString()}
     /
     >
             
             <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Fees and contract, etc.</div> 
             <div className="mx-2 items-center bg-[#F4F4F4] p-6 flex mx-4 rounded-sm">

     

<input type="checkbox" name = "ldhor" {...register("ldhor")} className="form-checkbox h-5 w-5 text-gray-600"/>
<label className="text-gray-700 mx-2">
Landlord does his own repairs</label>
</div>  


<div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Default sole agency fee</div> 

    <InputSelect label={'Sales fee'} name={'sales_fee'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>
    
    <InputSelect label={'Finders fee'} name={'finders_fee'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>
    
    <InputSelect label={'Management fee'} name={'management_fee'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>



<div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Default multi agency fee</div> 


<InputSelect label={'Sales fee'} name={'sales_fee_a'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>
    
    <InputSelect label={'Finders fee'} name={'finders_fee_a'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>
    
    <InputSelect label={'Management fee'} name={'management_fee_a'} options={[      { label: '%', value: 'percentage' },
          { label: 'Fixed', value: 'fixed' },
          ]} register={register}/>




<div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">NRL and VAT</div> 
<SelectField
        label="NRL Tax"
        name="nrl_tax"
        options={[ { label: 'No', value: '' },{ label: 'Charge Tax', value: 'charge_tax' },{ label: 'Tax exempt', value: 'tax_exempt' },]}
        register={register}
          onChange={(e)=>{
              console.log(e);
            setNRLRate(e);
          }}
        defaultValue=""
        error={errors.branch?.message?.toString()}
      />  
{
  nrlRate === "No" ? (
    <>
      {/* Render nothing for "No" */}
    </>
  ) : nrlRate === "charge_tax" ? (
    <>
      <InputField
        label="NRL rate"
        name="nrl_rate"
        register={register}
        error={errors.nrl_rate?.message?.toString()}
      />
    </>
  ) : nrlRate === "tax_exempt" ? (
    <>
      <InputField
        label="NRL ref"
        name="nrl_ref"
        register={register}
        error={errors.nrl_ref?.message?.toString()}
      />
    </>
  ) : null
}
<InputField
        label="Vat Number"
        name="vat_number"
        register={register}
        error={errors.vat_number?.message?.toString()}
      />
             <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Landlord/Vendor2</div> 

             <InputField
        label="Landlord/vendor 2 full name"
        name="landlord_full_name"             
        register={register}
        error={errors.landlord_full_name?.message?.toString()}
      />

<InputField
        label="Landlord/vendor 2 contact"
        name="landlord_contact"
        register={register}
        error={errors.landlord_contact?.message?.toString()}
      />
 <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Comments</div> 

 <TextAreaField   
       label="comments"
       name="comments"
       register={register}
       error={errors.comments?.message?.toString()}
     /
     >
 <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Other Info</div> 

 <TextAreaField   
       label="Other Info"
       name="other_info"
       register={register}
       error={errors.other_info?.message?.toString()}
     /
     >

</form>
  </div>
    );
};

export default InternalInfo;
