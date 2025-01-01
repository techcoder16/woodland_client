// FormContent.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';

// Form schema validation using Zod

// FormContent Component
const FormContent = ({register,errors}:any) => {
 
  

  const salutationOptions = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'fullName', label: 'Full Name' },
    { value: 'titleFirstName', label: 'Title + First Name' },
    { value: 'titleLastName', label: 'Title + Last Name' },
    { value: 'titleFullName', label: 'Title + Full Name' },
    { value: 'titleInitialLastNameAndTitleInitialLastName', label: 'Title1 + Initial1 + Last Name1 and Title2 + Initial2 + Last Name2' },
    { value: 'titleAndTitleLastName', label: 'Title1 and Title2 + Last Name1' },
    { value: 'firstNameFirstName', label: 'First Name1 / First Name2' },
    { value: 'titleFirstNameAndTitleFirstName', label: 'Title1 + First Name1 / Title2 + First Name2' },
    { value: 'titleLastNameAndTitleLastName', label: 'Title1 + Last Name1 / Title2 + Last Name2' },
    { value: 'titleFullNameAndTitleFullName', label: 'Title1 + Full Name1 / Title2 + Full Name2' },
    { value: 'company', label: 'Company' },
    { value: 'companyTitleFullName', label: 'Company + Title + Full Name' },
    { value: 'titleFullNameCompany', label: 'Title + Full Name + Company' },
  ];

  const titleOptions = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'miss', label: 'Miss' },
    { value: 'ms', label: 'Ms' },
    { value: 'dr', label: 'Dr' },
    { value: 'prof', label: 'Prof' },
  ];
  const typeOptions = [
    { value: 'Company', label: 'Company' },
    { value: 'Individual', label: 'Individual' },
  ];


  return (   <div className='lg:w-1/2 w-full'>
    <form  className="p-4 w-full">
        <div className="text-lg font-medium text-gray-600 flex justify-start underline  p-5 ">Personal information</div>
      {/* Landlord and Vendor Checkbox */}
      <div className="flex flex-col w-full mb-4 mx-2 bg-[#F4F4F4] p-6 rounded-sm">
        <div className="lg:flex items-center lg:w-full">
          <label className="text-gray-700 font-medium mr-4 w-32">Vendor</label>
          <input type="checkbox" className="p-2 border border-gray-300 rounded" {...register('vendor')} />
          <label className="text-gray-700 font-medium mr-4 w-32">Landlord</label>
          <input type="checkbox" className="p-2 border border-gray-300 rounded" {...register('landlord')} />
        </div>
      </div>

      {/* Type Dropdown */}
      <SelectField
        label="Type"
        name="type"
        options={typeOptions}
        register={register}
        error={errors.type?.message?.toString()}
      />

      {/* Title Dropdown */}
      <SelectField
        label="Title"
        name="title"
        options={titleOptions}
        register={register}
        defaultValue="Select a title"
        error={errors.title?.message?.toString()}
      />

      {/* First Name Field */}
      <InputField
        label="First Name"
        name="firstName"
        register={register}
        error={errors.firstName?.message?.toString()}
      />

      {/* Last Name Field */}
      <InputField
        label="Last Name"
        name="lastName"
        register={register}
        error={errors.lastName?.message?.toString()}
      />

      {/* Company Field */}
      <InputField
        label="Company"
        name="company"
        register={register}
        error={errors.company?.message?.toString()}
      />

      {/* Salutation Dropdown */}
      <SelectField
        label="Salutation"
        name="salutation"
        options={salutationOptions}
        register={register}
        error={errors.salutation?.message?.toString()}
      />

    
    
    </form></div>
  );
};

export default FormContent;
