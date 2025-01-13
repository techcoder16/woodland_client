import React, { useEffect, useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';

const StandardInfo = ({ register, errors, setValue, clearErrors }: any) => {
  const [countries, setCountries] = useState<any>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedSalutation, setSelectedSalutation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [acceptLHA, setAcceptLHA] = useState('');

  // Fetch countries for the correspondence address section
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          'https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code'
        );
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setCountries(data.countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setCountries([]);
      }
    };
    fetchCountries();
  }, []);

  const salutationOptions = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'fullName', label: 'Full Name' },
    { value: 'company', label: 'Company' },
    { value: 'companyTitleFullName', label: 'Company + Title + Full Name' },
  ];

  const titleOptions = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'miss', label: 'Miss' },
    { value: 'ms', label: 'Ms' },
    { value: 'dr', label: 'Dr' },
  ];

  const typeOptions = [
    { value: 'Company', label: 'Company' },
    { value: 'Individual', label: 'Individual' },
  ];

  const handleSelectChange = (name: string, value: string) => {
    // Update corresponding state based on the name of the select field
    if (name === 'type') setSelectedType(value);
    if (name === 'title') setSelectedTitle(value);
    if (name === 'salutation') setSelectedSalutation(value);
    if (name === 'country') setSelectedCountry(value);
    if (name === 'acceptLHA') setAcceptLHA(value);

    // Use setValue to update the form field value and clear any previous errors
    setValue(name, value); // Update the form field value
    clearErrors(name); // Clear any validation errors for the field

    // Optionally, log or do other side effects here
    console.log(`${name} selected: ${value}`);
  };

  return (
    <div className="w-full">
      {/* Personal Information Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Personal Information</div>
        <div className="flex flex-col w-full mb-4 mx-2 bg-[#F4F4F4] p-6 rounded-sm">
          <div className="flex items-center w-full">
            <label className="font-medium mr-4">Vendor</label>
            <input type="checkbox" className="p-2 border mx-2 border-gray-300 rounded" {...register('vendor')} />
            <label className="font-medium mr-4">Landlord</label>
            <input type="checkbox" className="p-2 border border-gray-300 rounded" {...register('landlord')} />
          </div>
        </div>

        <SelectField
          label="Type"
          name="type"
          options={typeOptions}
          register={register}
          error={errors.type?.message?.toString()}
          onChange={(value) => handleSelectChange('type', value)} // Added onChange
        />

        <SelectField
          label="Title"
          name="title"
          options={titleOptions}
          register={register}
          error={errors.title?.message?.toString()}
          onChange={(value) => handleSelectChange('title', value)} // Added onChange
        />

        <InputField label="First Name" name="firstName" register={register} error={errors.firstName?.message?.toString()} />
        <InputField label="Last Name" name="lastName" register={register} error={errors.lastName?.message?.toString()} />
        <InputField label="Company" name="company" register={register} error={errors.company?.message?.toString()} />
        <SelectField
          label="Salutation"
          name="salutation"
          options={salutationOptions}
          register={register}
          error={errors.salutation?.message?.toString()}
          onChange={(value) => handleSelectChange('salutation', value)} // Added onChange
        />
      </div>

      <hr />

      <div className="mt-3">
        <div className="text-lg font-medium flex justify-start underline p-5">Correspondence Address</div>
        <InputField label="Post Code" name="postCode" register={register} error={errors.postCode?.message?.toString()} />
        <InputField label="Address Line 1" name="addressLine1" register={register} error={errors.addressLine1?.message?.toString()} />
        <InputField label="Address Line 2" name="addressLine2" register={register} error={errors.addressLine2?.message?.toString()} />
        <InputField label="Town" name="town" register={register} error={errors.addressLine?.message?.toString()} />
        <SelectField
          label="Country"
          name="country"
          options={countries}
          register={register}
          error={errors.country?.message?.toString()}
          onChange={(value) => handleSelectChange('country', value)} // Added onChange
        />
      </div>

      <hr />

      <div>
        <div className="text-lg font-medium flex justify-start underline p-5">Contact Info</div>
        <InputField label="Phone Home" name="phoneHome" register={register} error={errors.phoneHome?.message?.toString()} />
        <InputField label="Phone Work" name="phoneWork" register={register} error={errors.phoneWork?.message?.toString()} />
        <InputField label="Phone Mobile" name="phoneMobile" register={register} error={errors.phoneMobile?.message?.toString()} />
        <InputField label="Fax" name="fax" register={register} error={errors.fax?.message?.toString()} />
        <InputField label="Email" name="email" register={register} error={errors.email?.message?.toString()} />
      </div>

      <hr />

      <div>
        <div className="text-lg font-medium flex justify-start underline p-5">More Info</div>
        <InputField label="Website" name="website" register={register} error={errors.website?.message?.toString()} />
        <InputField label="Pager" name="pager" register={register} error={errors.pager?.message?.toString()} />
        <InputField label="Birthplace" name="birthplace" register={register} error={errors.birthplace?.message?.toString()} />
        <InputField label="Nationality" name="nationality" register={register} error={errors.nationality?.message?.toString()} />
        <InputField label="Passport No" name="passportNumber" register={register} error={errors.passportNumber?.message?.toString()} />
        <SelectField
          label="Accept LHA/DWP"
          name="acceptLHA"
          options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]}
          register={register}
          error={errors.acceptLHA?.message?.toString()}
          onChange={(value) => handleSelectChange('acceptLHA', value)} // Added onChange
        />
      </div>
    </div>
  );
};

export default StandardInfo;
