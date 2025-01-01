import React from 'react'
import FormContent from './FormContent';
import { CorrespondenceAddress } from './CorrespondenceAddress';

import ContactInfo from './ContactInfo';
import MoreInfo from './MoreInfo';

const StandardInfo = ({register,errors}:any) => {



  return (
    <div className='w-1/2'>
         
      <FormContent register={register} errors={errors}  ></FormContent>
        <hr>
        </hr>
        <CorrespondenceAddress register={register} errors={errors}></CorrespondenceAddress>
        <hr>
        </hr> 
   <ContactInfo register={register} errors={errors}></ContactInfo>
   <hr>
   </hr>
<MoreInfo register={register} errors={errors}>
  
</MoreInfo>

      </div>
  )
}

export default StandardInfo