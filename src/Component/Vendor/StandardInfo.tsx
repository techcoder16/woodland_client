import React from 'react'
import FormContent from './FormContent';
import { CorrespondenceAddress } from './CorrespondenceAddress';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ContactInfo from './ContactInfo';
import MoreInfo from './MoreInfo';

const StandardInfo = () => {
 const  titles = ['Mr', 'Mrs', 'Mr & Mrs','Ms','Dr','Sir','Other'];
// const salutaions = ['First Name', 'Last Name', 'Full Name', 'Title + First Name', 'Title + Last Name', 'Title + First Name'

// ]

const formSchema = z.object({
  landlord: z.boolean().optional(),
  vendor: z.boolean().optional(),
  type: z.enum(['Individual', 'Company'], {
    errorMap: () => ({ message: 'Invalid Type value. Please select one of the following options: "Company, Individual".' }),
  }),
  title: z.enum(['mr', 'mrs', 'miss', 'ms', 'dr', 'prof'], {
    errorMap: () => ({ message: 'Invalid title value. Please select one of the following options: "mr", "mrs", "miss", "ms", "dr", "prof".' }),
  }),
  firstName: z.string().nonempty('First Name is required'),
  lastName: z.string().nonempty('Last Name is required'),
  company: z.string().optional(),
  salutation: z.string().optional(),
  postCode: z.string().nonempty('Post Code is required'),
  addressLine: z.string().nonempty('Address Line is required'),
  addressLine2: z.string(),
  town: z.string(),
  country: z.string(),
  phoneHome: z.string(),
  phoneMobile: z.string(),
  fax: z.string(),
  email: z.string(),
  webste: z.string(),

  pager: z.string(),
  birthplace: z.string(),
  nationality: z.string(),
  passportNumber: z.string(),
  acceptLHA: z.string(),


});


  
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(formSchema),
});

const onSubmit = (data: any) => {
  console.log('Form Data:', data);
};


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