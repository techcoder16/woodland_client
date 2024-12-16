import React from 'react'
import InputField from '../../utils/InputField'

const ContactInfo = ({register,errors}:any) => {
  return (
    <div>

<div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Contact info</div>

<InputField
        label="Phone home"
        name="phoneHome"
        register={register}
        error={errors.phoneHome?.message?.toString()}
      />
      
<InputField
        label="Phone work"
        name="phoneWork"
        register={register}
        error={errors.phoneWork?.message?.toString()}
      />
      
<InputField
        label="Phone mobile"
        name="phoneMobile"
        register={register}
        error={errors.phoneMobile?.message?.toString()}
      />

<InputField
        label="Fax"
        name="fax"
        register={register}
        error={errors.phoneHome?.message?.toString()}
      />
<InputField
        label="Email"
        name="email"
        register={register}
        error={errors.phoneHome?.message?.toString()}
      />


    </div>
  )
}

export default ContactInfo