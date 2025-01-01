import React, { useState } from 'react';
import StandardInfo from './StandardInfo';
import InternalInfo from './InternalInfo';
import BankDetails from './BankDetails';
import WebLogin from './WebLogin';
import Attachments from './Attachments';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
const VendorList = () => {
  const [activeTab, setActiveTab] = useState(0);
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
    label: z.string(),
    status: z.string(),
    branch:z.string(),
    source:z.string(),
    dnrvfn:z.boolean()  , 
    ldhor:z.boolean()   ,
    sales_fee:z.string(),
    management_fee:z.string(),
    finders_fee:z.string(),
    sales_fee_a:z.string(),
    management_fee_a:z.string(),
    finders_fee_a:z.string(),
    nrl_ref:z.string(),
    nrl_rate:z.string(),
  
    vat_number:z.string(),
    landlord_full_name:z.string(),
    landlord_contact:z.string(),
    bank_body:z.string(),
  });
  
  
    
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
  });
  
  const onSubmit = (data: any) => {
    console.log('Form Data:', data);
  };

  
  const tabs = [
    { label: "Standard Info", content: <StandardInfo  register = {register} errors = {errors}/> },
    { label: "Internal Info", content: <InternalInfo register = {register} errors = {errors} /> },
    { label: "Bank Details", content: <BankDetails  register = {register} errors = {errors}  /> },
    { label: "Web Login", content: <WebLogin /> },
    { label: "Attachments", content: <Attachments /> },
  ];

  const renderStepLines = () => (
    <div className="flex items-center">
      {tabs.map((_, index) => (
        <React.Fragment key={index}>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${index <= activeTab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {index + 1}
          </div>
          {index < tabs.length - 1 && <div className={`flex-1 h-0.5 ${index < activeTab ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className='items-start w-full font-sans'>
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <ul className="flex space-x-2">
                {tabs.map((tab, index) => (
                  <li key={index} className={`px-4 py-2 rounded-t-lg cursor-pointer ${index === activeTab ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`} onClick={() => setActiveTab(index)}>
                    {tab.label} <span className="text-xs">Step {index + 1}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500">
              <a href="#" className="text-green-500">Landlords/Vendors</a> / Add new landlord / vendor
            </div>
          </div>

          {renderStepLines()}

     
          <div className="flex w-full mx-auto bg-white p-6 rounded-lg shadow-md">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
