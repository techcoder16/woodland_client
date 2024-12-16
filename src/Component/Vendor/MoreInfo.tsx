import React from 'react'
import InputField from '../../utils/InputField'
import SelectField from '../../utils/SelectedField'

const MoreInfo = ({register,errors}:any) => {
  return (
    <div>
 <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">More Info</div>
    
<InputField
        label="Website"
        name="website"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >

<InputField
        label="Pager"
        name="pager"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >

        
<InputField
        label="BirthPlace"
        name="birthplace"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >
       
       <InputField
        label="Nationality"
        name="nationality"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >
           
       <InputField
        label="Passport No"
        name="passportNumber"
        register={register}
        error={errors.addressLine?.message?.toString()}
      /
      >

<SelectField
        label="Accept LHA/DWP"
        name="acceptLHA"
        options={[{value:"No",label:"No"},{value:"Yes",label:"Yes"}]}
        register={register}
        error={errors.salutation?.message?.toString()}
      />

    </div>
  )
}

export default MoreInfo